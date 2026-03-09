import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  CalendarDays,
  GraduationCap,
  User,
  ArrowRight,
  FileText,
  TextSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HCI_COURSES, CATEGORY_CONFIG } from '@/pages/catalog/data';
import { getSearchIndex, type ContentEntry } from '@/lib/searchIndex';

type ResultGroup = 'page' | 'course' | 'content';

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  to: string;
  keywords: string[];
  group: ResultGroup;
}

interface ContentResult {
  id: string;
  entry: ContentEntry;
  snippet: string;
  group: 'content';
}

type SearchResult = Action | ContentResult;

function isContentResult(r: SearchResult): r is ContentResult {
  return r.group === 'content';
}

function buildSnippet(text: string, query: string, radius = 40): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  return snippet;
}

const PAGE_ACTIONS: Action[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Your academic overview', icon: LayoutDashboard, to: '/dashboard', keywords: ['home', 'overview'], group: 'page' },
  { id: 'catalog', label: 'Course Catalog', description: 'Browse all departments', icon: BookOpen, to: '/catalog', keywords: ['courses', 'browse', 'search', 'department'], group: 'page' },
  { id: 'planner', label: 'AI Planner', description: 'AI-assisted scheduling', icon: Sparkles, to: '/planner', keywords: ['ai', 'plan', 'schedule', 'recommend'], group: 'page' },
  { id: 'schedule', label: 'Schedule Planner', description: 'View your class schedule', icon: CalendarDays, to: '/schedule', keywords: ['calendar', 'timetable'], group: 'page' },
  { id: 'graduation', label: 'Graduation Check', description: 'Track degree progress', icon: GraduationCap, to: '/graduation', keywords: ['degree', 'progress', 'requirements'], group: 'page' },
  { id: 'profile', label: 'Profile', description: 'Account settings', icon: User, to: '/profile', keywords: ['account', 'settings'], group: 'page' },
];

const COURSE_ACTIONS: Action[] = HCI_COURSES.map((c) => ({
  id: `course-${c.id}`,
  label: c.code,
  description: c.name,
  icon: FileText,
  to: '/catalog',
  keywords: [
    c.code.toLowerCase(),
    c.name.toLowerCase(),
    ...c.offerings.map((o) => o.instructor?.toLowerCase() ?? ''),
    c.category.toLowerCase(),
  ],
  group: 'course' as const,
}));

const MAX_COURSE_RESULTS = 5;
const MAX_CONTENT_RESULTS = 6;
const LISTBOX_ID = 'command-palette-listbox';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnCatalog = location.pathname.startsWith('/catalog');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();

    const matchedPages = PAGE_ACTIONS.filter((a) => {
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.includes(q))
      );
    });

    let matchedCourses: Action[] = [];
    if (q.length >= 2) {
      matchedCourses = COURSE_ACTIONS.filter((a) =>
        a.keywords.some((k) => k.includes(q))
      ).slice(0, MAX_COURSE_RESULTS);
    }

    let matchedContent: ContentResult[] = [];
    if (q.length >= 2) {
      const seen = new Set<string>();
      for (const entry of getSearchIndex()) {
        if (entry.text.toLowerCase().includes(q)) {
          if (seen.has(entry.page + entry.section)) continue;
          seen.add(entry.page + entry.section);
          matchedContent.push({
            id: `content-${entry.id}`,
            entry,
            snippet: buildSnippet(entry.text, q),
            group: 'content',
          });
          if (matchedContent.length >= MAX_CONTENT_RESULTS) break;
        }
      }
    }

    if (isOnCatalog && matchedCourses.length > 0) {
      return [...matchedCourses, ...matchedPages, ...matchedContent];
    }
    return [...matchedPages, ...matchedContent, ...matchedCourses];
  }, [query, isOnCatalog]);

  const groupCounts = useMemo(() => {
    const counts: Record<ResultGroup, number> = { page: 0, course: 0, content: 0 };
    for (const r of results) counts[r.group]++;
    return counts;
  }, [results]);

  const execute = useCallback((result: SearchResult) => {
    const route = isContentResult(result) ? result.entry.route : result.to;
    navigate(route);
    setOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      execute(results[activeIndex]);
    } else if (e.key === 'Tab') {
      const focusable = listboxRef.current?.querySelectorAll<HTMLElement>(
        'button[role="option"]'
      );
      if (!focusable?.length) return;
      const lastIndex = focusable.length - 1;
      const activeEl = document.activeElement as HTMLElement;
      const currentIndex = Array.from(focusable).indexOf(activeEl);
      const isOnInput = activeEl === inputRef.current;
      if (e.shiftKey) {
        if (currentIndex === 0) {
          e.preventDefault();
          inputRef.current?.focus();
        } else if (isOnInput) {
          e.preventDefault();
          focusable[lastIndex].focus();
        }
      } else {
        if (currentIndex === lastIndex) {
          e.preventDefault();
          inputRef.current?.focus();
        } else if (isOnInput) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
    }
  };

  const activeId = results[activeIndex] ? `command-option-${results[activeIndex].id}` : undefined;

  let lastGroup: string | null = null;

  const GROUP_LABELS: Record<ResultGroup, string> = { page: 'Pages', course: 'Courses', content: 'Page Content' };
  const multipleGroups = Object.values(groupCounts).filter(Boolean).length > 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed left-1/2 top-[20%] z-[91] w-full max-w-lg -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-3 border-b border-[var(--color-neutral-100)] px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-[var(--color-neutral-400)]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isOnCatalog ? 'Search courses, pages...' : 'Search pages, courses...'}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={LISTBOX_ID}
                  aria-activedescendant={activeId}
                  aria-autocomplete="list"
                  className="flex-1 bg-transparent text-sm text-[var(--color-neutral-800)] placeholder:text-[var(--color-neutral-400)] focus:outline-none"
                />
                <kbd className="hidden shrink-0 rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-neutral-400)] sm:inline">
                  ESC
                </kbd>
              </div>

              <div
                ref={listboxRef}
                id={LISTBOX_ID}
                role="listbox"
                className="max-h-[360px] overflow-y-auto p-2"
              >
                {results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-neutral-400)]">
                    No results found
                  </p>
                ) : (
                  results.map((result, i) => {
                    const optionId = `command-option-${result.id}`;
                    const showGroupHeader = result.group !== lastGroup;
                    lastGroup = result.group;

                    if (isContentResult(result)) {
                      return (
                        <React.Fragment key={result.id}>
                          {showGroupHeader && query.trim().length >= 2 && multipleGroups && (
                            <div className="px-3 pt-2 pb-1">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-neutral-400)]">
                                {GROUP_LABELS[result.group]}
                              </p>
                            </div>
                          )}
                          <button
                            id={optionId}
                            role="option"
                            aria-selected={i === activeIndex}
                            onClick={() => execute(result)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                              i === activeIndex
                                ? 'bg-[var(--color-brand-cardinal)]/5 text-[var(--color-brand-cardinal)]'
                                : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                            )}
                          >
                            <div className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                              i === activeIndex ? 'bg-[var(--color-brand-cardinal)]/10' : 'bg-[var(--color-neutral-100)]',
                            )}>
                              <TextSearch className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">{result.entry.page}</p>
                                <span className="text-[10px] text-[var(--color-neutral-400)]">›</span>
                                <p className="text-[11px] text-[var(--color-neutral-400)] truncate">{result.entry.section}</p>
                              </div>
                              <p className="text-xs text-[var(--color-neutral-400)] truncate">
                                <HighlightedSnippet text={result.snippet} query={query} />
                              </p>
                            </div>
                            {i === activeIndex && (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-cardinal)]" />
                            )}
                          </button>
                        </React.Fragment>
                      );
                    }

                    const action = result as Action;
                    const isCourse = action.group === 'course';
                    const courseData = isCourse
                      ? HCI_COURSES.find((c) => `course-${c.id}` === action.id)
                      : null;
                    const categoryColor = courseData
                      ? CATEGORY_CONFIG[courseData.category]?.color
                      : undefined;

                    return (
                      <React.Fragment key={action.id}>
                        {showGroupHeader && query.trim().length >= 2 && multipleGroups && (
                          <div className="px-3 pt-2 pb-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-neutral-400)]">
                              {GROUP_LABELS[action.group]}
                            </p>
                          </div>
                        )}
                        <button
                          id={optionId}
                          role="option"
                          aria-selected={i === activeIndex}
                          onClick={() => execute(action)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                            i === activeIndex
                              ? 'bg-[var(--color-brand-cardinal)]/5 text-[var(--color-brand-cardinal)]'
                              : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                          )}
                        >
                          {isCourse && categoryColor ? (
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${categoryColor}15` }}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: categoryColor }}
                              />
                            </span>
                          ) : (
                            <div className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                              i === activeIndex ? 'bg-[var(--color-brand-cardinal)]/10' : 'bg-[var(--color-neutral-100)]',
                            )}>
                              <action.icon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{action.label}</p>
                            {action.description && (
                              <p className="text-xs text-[var(--color-neutral-400)] truncate">{action.description}</p>
                            )}
                          </div>
                          {i === activeIndex && (
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-cardinal)]" />
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-[var(--color-brand-cardinal)]/15 text-[var(--color-brand-cardinal)] rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
