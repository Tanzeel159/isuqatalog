import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb } from './db';
import { authenticateUser, createUser, getUserById } from './auth';
import { getCookie } from './cookies';
import { jsonError } from './http';
import { createSession, deleteSession, deleteUserSessions, getUserIdFromSession, sessionCookieName, purgeExpiredSessions } from './sessions';
import { initAI, isReady, chat, getRecommendations, aiSearch, getAcademicInsights } from './ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || Number(process.env.API_PORT) || 3001;
if (Number.isNaN(PORT)) {
  console.error('Invalid PORT');
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const db = openDb();
const app = express();

initAI().catch((err) => console.error('[AI] Initialization failed:', err));

// Purge expired sessions on startup, then every hour
purgeExpiredSessions(db);
setInterval(() => purgeExpiredSessions(db), 60 * 60 * 1000);

// ── Middleware ─────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: APP_URL, credentials: true }));
app.use(express.json({ limit: '200kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many attempts. Please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many messages. Please slow down.' },
});

// ── Cookie helper ─────────────────────────────────────────────────────

const cookieOpts = (expires: Date) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  expires,
});

// ── Routes ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/signup', authLimiter, (req, res) => {
  try {
    const { email, password, qatalogId } = (req.body || {}) as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string' || typeof qatalogId !== 'string') {
      return jsonError(res, 400, 'Email, password, and QatalogID are required.');
    }
    const user = createUser(db, { email, password, qatalogId });
    const session = createSession(db, user.id);

    res.cookie(sessionCookieName(), session.token, cookieOpts(new Date(session.expiresAt)));
    res.json({ ok: true, user });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Signup failed.';
    return jsonError(res, 400, msg);
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  try {
    const { emailOrQatalogId, password } = (req.body || {}) as Record<string, unknown>;
    if (typeof emailOrQatalogId !== 'string' || typeof password !== 'string') {
      return jsonError(res, 400, 'Credentials are required.');
    }
    const user = authenticateUser(db, { emailOrQatalogId, password });

    deleteUserSessions(db, user.id);
    const session = createSession(db, user.id);

    res.cookie(sessionCookieName(), session.token, cookieOpts(new Date(session.expiresAt)));
    res.json({ ok: true, user });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Login failed.';
    return jsonError(res, 401, msg);
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (token) deleteSession(db, token);

  res.clearCookie(sessionCookieName(), { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (!token) return jsonError(res, 401, 'Not authenticated.');

  const userId = getUserIdFromSession(db, token);
  if (!userId) return jsonError(res, 401, 'Not authenticated.');

  const user = getUserById(db, userId);
  if (!user) return jsonError(res, 401, 'Not authenticated.');

  res.json({ ok: true, user });
});

// ── AI Chat ───────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err && (err as any).status === 429) return true;
  if (err instanceof Error && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) return true;
  return false;
}

function aiErrorResponse(res: any, err: unknown, context: string) {
  console.error(`[AI] ${context} error:`, err);
  if (isRateLimitError(err)) {
    return jsonError(res, 429, 'AI is temporarily unavailable due to high demand. Please try again in a minute.');
  }
  return jsonError(res, 500, `Failed to ${context.toLowerCase()}. Please try again.`);
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  if (!isReady()) {
    return jsonError(res, 503, 'AI assistant is still initializing. Please try again in a moment.');
  }

  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (!token) return jsonError(res, 401, 'Not authenticated.');

  const userId = getUserIdFromSession(db, token);
  if (!userId) return jsonError(res, 401, 'Not authenticated.');

  const { message, context } = (req.body || {}) as Record<string, unknown>;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return jsonError(res, 400, 'Message is required.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonError(res, 400, `Message must be under ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const studentContext = typeof context === 'string' ? context : undefined;

  try {
    const sessionId = `chat-${userId}`;
    const reply = await chat(sessionId, message.trim(), studentContext);
    res.json({ ok: true, reply });
  } catch (err: unknown) {
    return aiErrorResponse(res, err, 'Chat');
  }
});

// ── AI Recommendations ────────────────────────────────────────────────

app.post('/api/ai/recommendations', chatLimiter, async (req, res) => {
  if (!isReady()) {
    return jsonError(res, 503, 'AI assistant is still initializing.');
  }

  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (!token) return jsonError(res, 401, 'Not authenticated.');
  const userId = getUserIdFromSession(db, token);
  if (!userId) return jsonError(res, 401, 'Not authenticated.');

  const { currentCourses, completedCourses } = (req.body || {}) as Record<string, unknown>;

  try {
    const recommendations = await getRecommendations(
      Array.isArray(currentCourses) ? currentCourses : [],
      Array.isArray(completedCourses) ? completedCourses : [],
    );
    res.json({ ok: true, recommendations });
  } catch (err: unknown) {
    return aiErrorResponse(res, err, 'Recommendations');
  }
});

// ── AI Course Search ──────────────────────────────────────────────────

app.post('/api/ai/search', chatLimiter, async (req, res) => {
  if (!isReady()) {
    return jsonError(res, 503, 'AI assistant is still initializing.');
  }

  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (!token) return jsonError(res, 401, 'Not authenticated.');
  const userId = getUserIdFromSession(db, token);
  if (!userId) return jsonError(res, 401, 'Not authenticated.');

  const { query } = (req.body || {}) as Record<string, unknown>;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return jsonError(res, 400, 'Search query is required.');
  }

  try {
    const results = await aiSearch(query.trim());
    res.json({ ok: true, ...results });
  } catch (err: unknown) {
    return aiErrorResponse(res, err, 'Search');
  }
});

// ── AI Academic Insights ──────────────────────────────────────────────

app.post('/api/ai/insights', chatLimiter, async (req, res) => {
  if (!isReady()) {
    return jsonError(res, 503, 'AI assistant is still initializing.');
  }

  const token = getCookie(req.headers.cookie, sessionCookieName());
  if (!token) return jsonError(res, 401, 'Not authenticated.');
  const userId = getUserIdFromSession(db, token);
  if (!userId) return jsonError(res, 401, 'Not authenticated.');

  const { completedCourses, inProgressCourses, earnedCredits, requiredCredits, gpa } =
    (req.body || {}) as Record<string, unknown>;

  try {
    const insights = await getAcademicInsights({
      completedCourses: Array.isArray(completedCourses) ? completedCourses : [],
      inProgressCourses: Array.isArray(inProgressCourses) ? inProgressCourses : [],
      earnedCredits: typeof earnedCredits === 'number' ? earnedCredits : 0,
      requiredCredits: typeof requiredCredits === 'number' ? requiredCredits : 36,
      gpa: typeof gpa === 'number' ? gpa : 0,
    });
    res.json({ ok: true, insights });
  } catch (err: unknown) {
    return aiErrorResponse(res, err, 'Insights');
  }
});

// ── Static frontend (production) ─────────────────────────────────────

if (isProd) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
