import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuration ───────────────────────────────────────────────────

const openaiKey = process.env.OPENAI_API_KEY ?? '';
const pineconeKey = process.env.PINECONE_API_KEY ?? '';
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'hci-index';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const pinecone = pineconeKey ? new Pinecone({ apiKey: pineconeKey }) : null;

const CHAT_MODEL = 'gpt-4.1-mini';
const TOP_K = 10;
const MAX_RETRIES = 3;

const SYSTEM_PROMPT = `You are ISU Qatalog Assistant — a knowledgeable, friendly advisor for Iowa State University's Human-Computer Interaction (HCI) graduate program.

You help students with:
- Course selection, descriptions, prerequisites, and schedules
- Degree requirements for MS (thesis & creative component), MHCI, PhD, and graduate certificates
- Professor information and ratings
- Registration dates and academic deadlines
- Program policies (internships, CPT, funding, etc.)
- Graduation requirements and progress tracking

Rules:
- Only answer based on the provided context. If the context doesn't contain the answer, say so honestly.
- Be concise but thorough. Use bullet points for lists.
- When discussing courses, include the course code, name, credits, and delivery format when available.
- When discussing requirements, be specific about credit counts and categories.
- If a student asks about something ambiguous, ask a clarifying question.
- Format responses with markdown for readability.`;

// ─── Types ───────────────────────────────────────────────────────────

interface Chunk {
  id: string;
  text: string;
  source: string;
  tokens: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationStore {
  [sessionId: string]: { messages: Message[]; lastActive: number };
}

// ─── State ───────────────────────────────────────────────────────────

let chunks: Chunk[] = [];
let ready = false;
let usePinecone = false;
const conversations: ConversationStore = {};

const MAX_HISTORY = 20;
const SESSION_TTL = 30 * 60 * 1000;

// ─── Retry wrapper (handles 429 rate limits) ─────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const isRateLimit = status === 429 || err?.code === 'rate_limit_exceeded';
      if (!isRateLimit || attempt === retries) throw err;

      const retryAfter = err?.headers?.['retry-after'];
      const waitSec = retryAfter ? Math.min(parseFloat(retryAfter), 30) : Math.pow(2, attempt + 1);
      console.log(`[AI] Rate limited, retrying in ${waitSec}s (attempt ${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

// ─── OpenAI Chat Helper ─────────────────────────────────────────────

async function complete(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { temperature?: number; max_tokens?: number } = {},
): Promise<string> {
  if (!openai) throw new Error('OpenAI not configured');

  const res = await withRetry(() =>
    openai!.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 1500,
    }),
  );

  return res.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';
}

// ─── JSON → Text (for local chunking) ────────────────────────────────

function jsonToText(obj: unknown, depth = 0): string {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    return obj
      .map((item) => jsonToText(item, depth))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>)
      .map(([key, val]) => {
        const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const value = jsonToText(val, depth + 1);
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return `${label}:\n${value}`;
        }
        return `${label}: ${value}`;
      })
      .join('\n');
  }

  return '';
}

function topicFromFilename(file: string): string {
  return file
    .replace(/\.json$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// ─── Local Chunking (fallback when Pinecone not available) ───────────

function loadAndChunk(): { id: string; text: string; source: string }[] {
  const dataDir = path.resolve(__dirname, '../hci_data');
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const rawChunks: { id: string; text: string; source: string }[] = [];

  for (const file of files) {
    const topic = topicFromFilename(file);
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const text = jsonToText(data[i]);
        if (text.length > 40) {
          rawChunks.push({
            id: `${file}#${i}`,
            text: `[Source: ${topic}]\n${text}`,
            source: file,
          });
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);

      if (entries.length <= 4 || raw.length < 3000) {
        rawChunks.push({
          id: `${file}#root`,
          text: `[Source: ${topic}]\n${jsonToText(data)}`,
          source: file,
        });
      } else {
        for (const [key, val] of entries) {
          const text = jsonToText(val);
          if (text.length > 30) {
            const label = key
              .replace(/[_-]/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
            rawChunks.push({
              id: `${file}#${key}`,
              text: `[Source: ${topic} — ${label}]\n${text}`,
              source: file,
            });
          }
        }
      }
    }
  }

  return rawChunks;
}

// ─── Local TF-IDF Retrieval (fallback) ───────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'in','on','at','to','for','of','with','by','from','as','into','about','between',
  'through','after','before','during','above','below','and','or','but','not','no',
  'if','then','than','that','this','these','those','it','its','i','me','my','we',
  'our','you','your','he','she','they','them','their','what','which','who','how',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

let idfMap: Map<string, number> = new Map();

function buildIdf(): void {
  const docCount = chunks.length;
  const df = new Map<string, number>();

  for (const chunk of chunks) {
    const unique = new Set(chunk.tokens);
    for (const token of unique) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  idfMap = new Map();
  for (const [term, count] of df) {
    idfMap.set(term, Math.log((docCount + 1) / (count + 1)) + 1);
  }
}

function scoreChunk(queryTokens: string[], chunk: Chunk): number {
  const tf = new Map<string, number>();
  for (const t of chunk.tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }

  let score = 0;
  for (const qt of queryTokens) {
    const termFreq = tf.get(qt) || 0;
    if (termFreq > 0) {
      const normalizedTf = termFreq / chunk.tokens.length;
      const idf = idfMap.get(qt) || 1;
      score += normalizedTf * idf;
    }
  }
  return score;
}

function findRelevantLocal(query: string, k: number = TOP_K): string[] {
  const queryTokens = tokenize(query);
  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(queryTokens, chunk),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => s.chunk.text);
}

// ─── Pinecone Retrieval ──────────────────────────────────────────────

async function queryPinecone(query: string, topK: number = TOP_K): Promise<string[]> {
  if (!openai || !pinecone) return [];

  const embeddingRes = await withRetry(() =>
    openai!.embeddings.create({ model: EMBEDDING_MODEL, input: query }),
  );
  const vector = embeddingRes.data[0].embedding;

  const index = pinecone.Index(PINECONE_INDEX);
  const results = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => {
        const meta = m.metadata as Record<string, any> | undefined;
        if (!meta) return '';
        return meta.text || meta.pageContent || meta.content || meta.chunk || '';
      })
      .filter(Boolean) ?? []
  );
}

// ─── Unified Retrieval (Pinecone → TF-IDF fallback) ─────────────────

async function findRelevant(query: string, k: number = TOP_K): Promise<string[]> {
  if (usePinecone) {
    try {
      const results = await queryPinecone(query, k);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[AI] Pinecone query failed, falling back to local search:', (err as Error).message);
    }
  }
  return findRelevantLocal(query, k);
}

// ─── Initialization ──────────────────────────────────────────────────

export async function initAI(): Promise<void> {
  if (!openai) {
    console.warn('[AI] OPENAI_API_KEY not set — AI assistant disabled. Add it to your .env file.');
    return;
  }

  // Load local chunks for TF-IDF fallback
  console.log('[AI] Loading and chunking HCI data...');
  const rawChunks = loadAndChunk();
  console.log(`[AI] Created ${rawChunks.length} chunks. Tokenizing...`);

  chunks = rawChunks.map((c) => ({ ...c, tokens: tokenize(c.text) }));
  buildIdf();

  // Check if Pinecone is available
  if (pinecone) {
    try {
      const index = pinecone.Index(PINECONE_INDEX);
      const stats = await index.describeIndexStats();
      const totalVectors = stats.totalRecordCount ?? 0;
      if (totalVectors > 0) {
        usePinecone = true;
        console.log(`[AI] Pinecone connected — index "${PINECONE_INDEX}" has ${totalVectors} vectors.`);
      } else {
        console.warn(`[AI] Pinecone index "${PINECONE_INDEX}" is empty. Using local TF-IDF.`);
      }
    } catch (err) {
      console.warn('[AI] Pinecone connection failed, using local TF-IDF:', (err as Error).message);
    }
  } else {
    console.log('[AI] PINECONE_API_KEY not set — using local TF-IDF retrieval.');
  }

  ready = true;
  console.log(`[AI] Ready — model: ${CHAT_MODEL}, retrieval: ${usePinecone ? 'Pinecone' : 'local TF-IDF'}`);
}

export function isReady(): boolean {
  return ready;
}

// ─── Conversation Memory ────────────────────────────────────────────

function getHistory(sessionId: string): Message[] {
  const conv = conversations[sessionId];
  if (!conv) return [];
  conv.lastActive = Date.now();
  return conv.messages;
}

function addMessage(sessionId: string, msg: Message): void {
  if (!conversations[sessionId]) {
    conversations[sessionId] = { messages: [], lastActive: Date.now() };
  }
  const conv = conversations[sessionId];
  conv.messages.push(msg);
  conv.lastActive = Date.now();

  if (conv.messages.length > MAX_HISTORY * 2) {
    conv.messages = conv.messages.slice(-MAX_HISTORY * 2);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const id of Object.keys(conversations)) {
    if (now - conversations[id].lastActive > SESSION_TTL) {
      delete conversations[id];
    }
  }
}, 5 * 60 * 1000);

// ─── Chat ────────────────────────────────────────────────────────────

export async function chat(
  sessionId: string,
  userMessage: string,
  studentContext?: string,
): Promise<string> {
  if (!ready) throw new Error('AI is still initializing. Please try again shortly.');

  const contextTexts = await findRelevant(userMessage);
  const contextBlock = contextTexts
    .map((t, i) => `--- Context ${i + 1} ---\n${t}`)
    .join('\n\n');

  const history = getHistory(sessionId);

  const systemContent = studentContext
    ? `${SYSTEM_PROMPT}\n\n--- CURRENT STUDENT PROFILE ---\n${studentContext}\n\nUse this student profile to give personalized answers. Reference their specific courses, credits, and progress when relevant.`
    : SYSTEM_PROMPT;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemContent },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user',
      content: `Here is relevant information from the ISU HCI program database:\n\n${contextBlock}\n\n---\n\nStudent question: ${userMessage}`,
    },
  ];

  const reply = await complete(messages, { temperature: 0.3, max_tokens: 1500 });

  addMessage(sessionId, { role: 'user', content: userMessage });
  addMessage(sessionId, { role: 'assistant', content: reply });

  return reply;
}

// ─── JSON Parsing Helpers ────────────────────────────────────────────

function parseJsonArray<T>(text: string): T[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

function parseJsonObject<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ─── AI Recommendations ─────────────────────────────────────────────

export async function getRecommendations(
  currentCourses: string[],
  completedCourses: string[],
): Promise<{ code: string; name: string; match: number; reason: string }[]> {
  if (!ready || !openai) throw new Error('AI not available');

  const allCourses = [...currentCourses, ...completedCourses];
  const query = `recommend courses HCI graduate student ${allCourses.join(' ')} elective design research`;
  const contextTexts = await findRelevant(query, 20);
  const contextBlock = contextTexts.map((t, i) => `--- ${i + 1} ---\n${t}`).join('\n\n');

  const reply = await complete([
    {
      role: 'system',
      content: 'You are an academic advisor for the ISU HCI program. Return ONLY valid JSON, no other text.',
    },
    {
      role: 'user',
      content: `Based on this HCI program course catalog, recommend exactly 3 courses for a graduate student.

Currently taking: ${currentCourses.join(', ') || 'none specified'}
Already completed: ${completedCourses.join(', ') || 'none specified'}

${contextBlock}

Rules:
- Do NOT recommend courses the student is currently taking or has completed
- Focus on courses that complement their existing coursework
- Consider prerequisite relationships and logical course progression
- Assign a realistic match percentage (60-98) based on relevance

Return ONLY a valid JSON array of exactly 3 objects:
[{"code":"DEPT NNNN","name":"Full Course Name","match":85,"reason":"One concise sentence explaining why"}]`,
    },
  ], { temperature: 0.4, max_tokens: 600 });

  return parseJsonArray(reply);
}

// ─── AI Course Search ───────────────────────────────────────────────

export async function aiSearch(
  query: string,
): Promise<{ courses: string[]; summary: string }> {
  if (!ready || !openai) throw new Error('AI not available');

  const contextTexts = await findRelevant(query, 20);
  const contextBlock = contextTexts.map((t, i) => `--- ${i + 1} ---\n${t}`).join('\n\n');

  const reply = await complete([
    {
      role: 'system',
      content: 'You are an academic course search assistant. Return ONLY valid JSON, no other text.',
    },
    {
      role: 'user',
      content: `A student searched for: "${query}"

Here is the HCI course catalog information:
${contextBlock}

Identify which courses are most relevant to this search. Return ONLY valid JSON:
{"courses":["HCI 5210","ARTGR 5300"],"summary":"One sentence summarizing what you found"}

Rules:
- Only include courses that genuinely match the search intent
- Use exact course codes as they appear (e.g. "HCI 5210", "ARTGR 5300", "HCI 5840")
- The summary should be helpful and specific
- If nothing matches well, return empty courses array with an appropriate summary`,
    },
  ], { temperature: 0.2, max_tokens: 500 });

  const parsed = parseJsonObject<{ courses?: string[]; summary?: string }>(reply);
  return {
    courses: Array.isArray(parsed?.courses) ? parsed.courses : [],
    summary: typeof parsed?.summary === 'string' ? parsed.summary : '',
  };
}

// ─── Academic Insights ──────────────────────────────────────────────

interface StudentProgress {
  completedCourses: string[];
  inProgressCourses: string[];
  earnedCredits: number;
  requiredCredits: number;
  gpa: number;
}

export async function getAcademicInsights(
  progress: StudentProgress,
): Promise<{ type: 'insight' | 'warning' | 'tip'; message: string; action: string }[]> {
  if (!ready || !openai) throw new Error('AI not available');

  const query = `degree requirements graduation credits ${progress.completedCourses.join(' ')} ${progress.inProgressCourses.join(' ')} elective research thesis`;
  const contextTexts = await findRelevant(query, 15);
  const contextBlock = contextTexts.map((t, i) => `--- ${i + 1} ---\n${t}`).join('\n\n');

  const reply = await complete([
    {
      role: 'system',
      content: 'You are an academic advisor analyzing student progress. Return ONLY valid JSON, no other text.',
    },
    {
      role: 'user',
      content: `Analyze this HCI graduate student's progress and provide personalized academic insights.

Student progress:
- Completed: ${progress.completedCourses.join(', ') || 'none'}
- Currently enrolled: ${progress.inProgressCourses.join(', ') || 'none'}
- Credits: ${progress.earnedCredits}/${progress.requiredCredits}
- GPA: ${progress.gpa}

Program information:
${contextBlock}

Provide 2-4 actionable insights. Each should be type "insight" (helpful observation), "warning" (potential issue), or "tip" (practical advice).

Return ONLY a valid JSON array:
[{"type":"insight","message":"Specific observation about their progress","action":"Short action label (2-3 words)"}]

Be specific — reference actual course codes, credit counts, and requirements.`,
    },
  ], { temperature: 0.3, max_tokens: 800 });

  return parseJsonArray(reply);
}
