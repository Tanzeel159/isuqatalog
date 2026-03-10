import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, ArrowUp, Sparkles, Bot, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { getStudentContext } from '@/lib/student';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What courses are offered in Spring 2026?',
  'What are the MS degree requirements?',
  'Tell me about professor ratings',
  'How many credits do I need to graduate?',
];

// ─── Markdown → HTML ─────────────────────────────────────────────────

function renderMarkdown(raw: string): string {
  let text = raw;

  // Code blocks: ```lang\n...\n```
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code) =>
    `<pre class="chat-code-block"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()}</code></pre>`,
  );

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

  // Headings (### → h4, ## → h3, # → h2) — must come before bold
  text = text.replace(/^#### (.+)$/gm, '<h5 class="chat-h">$1</h5>');
  text = text.replace(/^### (.+)$/gm, '<h4 class="chat-h">$1</h4>');
  text = text.replace(/^## (.+)$/gm, '<h3 class="chat-h">$1</h3>');
  text = text.replace(/^# (.+)$/gm, '<h3 class="chat-h">$1</h3>');

  // Bold + italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');

  // Horizontal rule
  text = text.replace(/^---+$/gm, '<hr class="chat-hr" />');

  // Unordered list items
  text = text.replace(/^[\-\*] (.+)$/gm, '<li class="chat-li">$1</li>');

  // Ordered list items
  text = text.replace(/^\d+\.\s(.+)$/gm, '<li class="chat-li chat-li-ordered">$1</li>');

  // Wrap consecutive <li> in <ul>
  text = text.replace(/((?:<li class="chat-li">[\s\S]*?<\/li>\n?)+)/g, '<ul class="chat-ul">$1</ul>');
  text = text.replace(/((?:<li class="chat-li chat-li-ordered">[\s\S]*?<\/li>\n?)+)/g, '<ol class="chat-ol">$1</ol>');

  // Paragraphs: double newline → paragraph break
  text = text.replace(/\n{2,}/g, '</p><p class="chat-p">');

  // Single newlines → <br> (but not inside pre/code blocks)
  text = text.replace(/(?<!<\/pre>|<\/li>|<\/ul>|<\/ol>|<\/h[345]>|<hr[^>]*>)\n/g, '<br/>');

  return `<p class="chat-p">${text}</p>`
    .replace(/<p class="chat-p"><\/p>/g, '')
    .replace(/<p class="chat-p">(<(?:pre|ul|ol|h[345]|hr)[^>]*>)/g, '$1')
    .replace(/(<\/(?:pre|ul|ol|h[345])>)<\/p>/g, '$1');
}

// ─── Message Components ──────────────────────────────────────────────

function AssistantMessage({ content }: { content: string; key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex gap-3"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-cardinal)]/10 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[var(--color-brand-cardinal)]" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5 chat-response">
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(content)) }}
        />
      </div>
    </motion.div>
  );
}

function UserMessage({ content }: { content: string; key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-3"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-cardinal)] mt-0.5">
        <User className="w-3.5 h-3.5 text-white" />
      </div>
      <p className="text-[var(--text-sm)] leading-relaxed text-[var(--color-neutral-800)] pt-1 font-medium">{content}</p>
    </motion.div>
  );
}

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-cardinal)]/10 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[var(--color-brand-cardinal)]" />
      </div>
      <div className="flex items-center gap-2.5 pt-1">
        <motion.div
          className="h-4 w-4 rounded-full border-2 border-[var(--color-neutral-200)] border-t-[var(--color-brand-cardinal)]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
        />
        <span className="text-[var(--text-sm)] text-[var(--color-neutral-400)] font-medium">Thinking...</span>
      </div>
    </motion.div>
  );
}

// ─── ChatPanel ───────────────────────────────────────────────────────

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setInput('');
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);
      setInput('');
      setLoading(true);

      try {
        const data = await apiFetch<{ ok: true; reply: string }>('/api/chat', {
          method: 'POST',
          json: { message: trimmed, context: getStudentContext() },
        });
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.reply }]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: `Something went wrong: ${err.message || 'Please try again.'}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            aria-label="Open AI chat assistant"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-cardinal)] text-white shadow-xl shadow-[var(--color-brand-cardinal)]/20 hover:shadow-2xl hover:shadow-[var(--color-brand-cardinal)]/30 transition-shadow duration-300"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand-gold)] opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[var(--color-brand-gold)]" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            role="dialog"
            aria-label="AI chat assistant"
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[420px] h-[580px] max-h-[80vh] rounded-2xl bg-white shadow-2xl shadow-black/10 border border-[var(--color-border-default)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-900)]">Qatalog AI</h3>
                  <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] font-medium">
                    {loading ? 'Thinking...' : 'Qatalog AI'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                aria-label="Close chat"
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
            >
              {messages.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col items-center pt-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-cardinal)]/8 mb-4">
                    <Sparkles className="w-6 h-6 text-[var(--color-brand-cardinal)]" />
                  </div>
                  <h4 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)] mb-1">
                    Qatalog AI
                  </h4>
                  <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] mb-6 text-center max-w-[280px] leading-relaxed">
                    Ask about courses, degree requirements, schedules, professors, and more.
                  </p>

                  <div className="w-full space-y-1.5">
                    <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider mb-2">
                      Try asking
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <motion.button
                        key={s}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => sendMessage(s)}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--color-border-default)] px-3 py-2.5 text-left text-[var(--text-xs)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-brand-cardinal)]/20 hover:text-[var(--color-neutral-800)] transition-all duration-200"
                      >
                        <MessageSquare className="w-3 h-3 shrink-0 text-[var(--color-brand-cardinal)]" />
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <UserMessage key={msg.id} content={msg.content} />
                ) : (
                  <AssistantMessage key={msg.id} content={msg.content} />
                ),
              )}

              <AnimatePresence>{loading && <ThinkingIndicator />}</AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1 border-t border-[var(--color-border-default)]/50">
              <div
                className={cn(
                  'flex items-end gap-2 rounded-xl px-3.5 py-2.5 transition-all duration-200',
                  'bg-[var(--color-neutral-50)] border border-[var(--color-border-default)]',
                  'focus-within:border-[var(--color-brand-cardinal)]/40 focus-within:ring-2 focus-within:ring-[var(--color-brand-cardinal)]/8 focus-within:bg-white',
                )}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Qatalog AI..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[var(--text-sm)] text-[var(--color-neutral-800)] placeholder:text-[var(--color-neutral-400)] focus:outline-none max-h-[80px] min-h-[24px] leading-relaxed"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                    input.trim() && !loading
                      ? 'bg-[var(--color-brand-cardinal)] text-white shadow-sm'
                      : 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-400)]',
                  )}
                >
                  {loading ? (
                    <motion.div
                      className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-neutral-300)] border-t-[var(--color-neutral-500)]"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                  )}
                </motion.button>
              </div>
              <p className="mt-2 text-center text-[var(--text-2xs)] text-[var(--color-neutral-300)]">
                AI suggestions only &mdash; confirm with your advisor
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
