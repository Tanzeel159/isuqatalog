import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  to: string;
  keywords: string[];
}

const ACTIONS: Action[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Your academic overview', icon: LayoutDashboard, to: '/dashboard', keywords: ['home', 'overview'] },
  { id: 'catalog', label: 'Course Catalog', description: 'Browse all departments', icon: BookOpen, to: '/catalog', keywords: ['courses', 'browse', 'search', 'department'] },
  { id: 'planner', label: 'AI Planner', description: 'AI-assisted scheduling', icon: Sparkles, to: '/planner', keywords: ['ai', 'plan', 'schedule', 'recommend'] },
  { id: 'schedule', label: 'Schedule Planner', description: 'View your class schedule', icon: CalendarDays, to: '/schedule', keywords: ['calendar', 'timetable'] },
  { id: 'graduation', label: 'Graduation Check', description: 'Track degree progress', icon: GraduationCap, to: '/graduation', keywords: ['degree', 'progress', 'requirements'] },
  { id: 'profile', label: 'Profile', description: 'Account settings', icon: User, to: '/profile', keywords: ['account', 'settings'] },
];

const LISTBOX_ID = 'command-palette-listbox';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const filtered = ACTIONS.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.label.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.keywords.some((k) => k.includes(q))
    );
  });

  const execute = useCallback((action: Action) => {
    navigate(action.to);
    setOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      execute(filtered[activeIndex]);
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

  const activeId = filtered[activeIndex] ? `command-option-${filtered[activeIndex].id}` : undefined;

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
                  placeholder="Search actions, pages, courses..."
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
                className="max-h-[320px] overflow-y-auto p-2"
              >
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-neutral-400)]">
                    No results found
                  </p>
                ) : (
                  filtered.map((action, i) => {
                    const Icon = action.icon;
                    const optionId = `command-option-${action.id}`;
                    return (
                      <button
                        key={action.id}
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
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                          i === activeIndex ? 'bg-[var(--color-brand-cardinal)]/10' : 'bg-[var(--color-neutral-100)]',
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
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
