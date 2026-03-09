import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Header', text: 'Graduation Check. Track your progress toward degree completion.' },
  { section: 'Statistics', text: 'Estimated Graduation. Completed Credits. In progress. GPA. On track for graduation.' },
  { section: 'Degree Requirements', text: 'Degree Requirements. Complete. In progress. Core Requirements. Electives. Research Credits.' },
  { section: 'Timeline', text: 'Graduation Timeline. Plan semesters in Schedule to keep this timeline in sync. Add from Schedule.' },
  { section: 'AI Insights', text: 'AI Academic Insights. Powered by AI. Personalized for your plan.' },
];
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  CalendarPlus,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { fadeUp, staggerContainer } from '@/lib/motion';
import {
  EARNED_CREDITS,
  TOTAL_REQUIRED,
  IN_PROGRESS_COUNT,
  GPA,
  ESTIMATED_GRAD,
  COMPLETION_PCT,
  DEGREE_REQUIREMENTS,
  TIMELINE_SEMESTERS,
} from '@/lib/student';

interface AIInsight {
  type: 'insight' | 'warning' | 'tip';
  message: string;
  action: string;
}

const FALLBACK_INSIGHTS: AIInsight[] = [
  {
    type: 'insight',
    message: 'You still need 6 elective credits to graduate.',
    action: 'View suggestions',
  },
  {
    type: 'warning',
    message: "Course HCI 577 is scheduled before its prerequisite HCI 540.",
    action: 'Fix automatically',
  },
];

function ProgressRing({ value, max, size = 72 }: { value: number; max: number; size?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const stroke = (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Graduation progress: ${pct}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-neutral-100)"
          strokeWidth="6"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand-cardinal)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - stroke }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[var(--text-base)] font-bold text-[var(--color-neutral-800)] tabular-nums">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function EstimatedGraduationCard() {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel rounded-2xl overflow-hidden px-6 py-5"
    >
      <div className="flex items-center gap-2 text-[var(--color-neutral-500)] mb-4">
        <Calendar className="w-4 h-4" />
        <span className="text-[var(--text-sm)] font-semibold">Estimated Graduation: {ESTIMATED_GRAD}</span>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ProgressRing value={EARNED_CREDITS} max={TOTAL_REQUIRED} />
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-[var(--color-border-default)] px-4 py-2.5 bg-white/60">
            <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-wider">Completed Credits</p>
            <p className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-800)] tabular-nums">{EARNED_CREDITS}/{TOTAL_REQUIRED}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border-default)] px-4 py-2.5 bg-white/60">
            <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-wider">In progress · GPA</p>
            <p className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-800)] tabular-nums">{IN_PROGRESS_COUNT} · {GPA.toFixed(1)}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[var(--text-sm)] font-medium text-[var(--color-success)]">On track for graduation.</p>
    </motion.div>
  );
}

function DegreeRequirementsSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Degree Requirements</h3>
      </div>
      <div className="divide-y divide-[var(--color-border-default)]/60">
        {DEGREE_REQUIREMENTS.map((req) => {
          const id = req.label.replace(/\s+/g, '-').toLowerCase();
          const isExpanded = expandedId === id;
          const hasCourses = req.courses && req.courses.length > 0;

          return (
            <div key={req.label}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : id)}
                aria-expanded={isExpanded}
                aria-controls={hasCourses ? `section-${id}` : undefined}
                className="w-full grid grid-cols-[auto_minmax(0,1fr)_100px_auto] items-center gap-4 px-6 py-3.5 hover:bg-[var(--color-neutral-50)]/80 transition-colors text-left"
              >
                <span className="flex items-center justify-center w-6 h-6 shrink-0">
                  {req.done ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--color-neutral-300)]" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[var(--text-base)] font-medium text-[var(--color-neutral-800)] truncate">{req.label}</p>
                  <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-0.5">{req.earned}</p>
                </div>
                <span
                  className={cn(
                    'text-[var(--text-xs)] font-semibold text-right',
                    req.done ? 'text-[var(--color-success)]' : 'text-[var(--color-neutral-500)]',
                  )}
                >
                  {req.done ? 'Complete' : 'In progress'}
                </span>
                <span className="flex items-center justify-center w-6 h-6 shrink-0 text-[var(--color-neutral-400)]">
                  {hasCourses && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                </span>
              </button>
              <AnimatePresence>
                {isExpanded && hasCourses && req.courses && (
                  <motion.div
                    id={`section-${id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pl-[4.5rem] space-y-1.5">
                      {req.courses.map((c) => (
                        <div
                          key={c.code}
                          className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-3 py-1.5 px-3 rounded-lg bg-[var(--color-neutral-50)]/80 text-[var(--text-sm)]"
                        >
                          <span className="font-medium text-[var(--color-neutral-800)]">{c.code}</span>
                          <span className="text-[var(--color-neutral-500)] truncate" title={c.name}>{c.name}</span>
                          <span className="text-[var(--color-neutral-400)] tabular-nums text-right">{c.credits} cr</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function GraduationTimelineSection() {
  return (
    <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
      {/* Section: title = xl, subtitle = xs (design system hierarchy) */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
        <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-neutral-900)] tracking-tight">
          Graduation Timeline
        </h2>
        <p className="text-[var(--text-xs)] text-[var(--color-neutral-500)] mt-1.5">
          Plan semesters in Schedule to keep this timeline in sync.
        </p>
      </div>
      <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TIMELINE_SEMESTERS.map((sem, i) => (
          <motion.div
            key={sem.id}
            variants={fadeUp}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'min-h-[200px] flex flex-col rounded-xl border shadow-[var(--shadow-sm)]',
              'px-4 pt-4 pb-4',
              sem.status === 'current' && 'border-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal-light)]/30 ring-1 ring-[var(--color-brand-cardinal)]/20',
              sem.status === 'completed' && 'border-[var(--color-border-default)] bg-[var(--color-neutral-white)]',
              sem.status === 'planned' && 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)]/50',
            )}
          >
            {/* Card title: md (panel heading), below section xl */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[var(--text-md)] font-semibold text-[var(--color-neutral-800)] leading-tight truncate">
                {sem.label}
              </span>
              <span className="shrink-0 flex items-center justify-center w-5 h-5">
                {sem.status === 'current' && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand-cardinal)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-brand-cardinal)]" />
                  </span>
                )}
                {sem.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />}
                {sem.status === 'planned' && <Circle className="w-3.5 h-3.5 text-[var(--color-neutral-300)]" />}
              </span>
            </div>
            {/* Meta: credits = 2xs */}
            {sem.credits > 0 && (
              <p className="text-[var(--text-2xs)] text-[var(--color-neutral-500)] font-medium mb-1.5 tabular-nums uppercase tracking-wider">
                {sem.credits} credits
              </p>
            )}
            {/* Content: course codes = sm (body-level), status = 2xs label */}
            <div className="flex-1 min-h-[4rem] flex flex-col gap-1">
              {sem.courses.length > 0 ? (
                sem.courses.map((code) => (
                  <p
                    key={code}
                    className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)] leading-tight"
                  >
                    {code}
                  </p>
                ))
              ) : sem.status === 'planned' ? (
                <>
                  <p className="text-[var(--text-base)] font-medium text-[var(--color-neutral-700)] leading-snug">
                    No courses planned yet.
                  </p>
                  <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] leading-snug mt-0.5">
                    Add courses from Schedule Planner to see them here.
                  </p>
                  <Link to="/schedule" className="mt-3">
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Add from Schedule
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
            {/* Status: 2xs label, semantic color */}
            <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]/60">
              {sem.status === 'completed' && (
                <p className="text-[10px] font-semibold text-[var(--color-success)] uppercase tracking-[0.12em]">
                  Completed
                </p>
              )}
              {sem.status === 'current' && (
                <p className="text-[10px] font-semibold text-[var(--color-brand-cardinal)] uppercase tracking-[0.12em]">
                  Current
                </p>
              )}
              {sem.status === 'planned' && (
                <p className="text-[10px] font-semibold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">
                  Upcoming
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AIAcademicInsights() {
  const [insights, setInsights] = useState<AIInsight[]>(FALLBACK_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [isAI, setIsAI] = useState(false);

  const completedCourses = DEGREE_REQUIREMENTS.flatMap((r) => r.courses?.map((c) => c.code) ?? []);
  const inProgressCourses = TIMELINE_SEMESTERS
    .filter((s) => s.status === 'current')
    .flatMap((s) => s.courses);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ ok: true; insights: AIInsight[] }>(
        '/api/ai/insights',
        {
          method: 'POST',
          json: {
            completedCourses,
            inProgressCourses,
            earnedCredits: EARNED_CREDITS,
            requiredCredits: TOTAL_REQUIRED,
            gpa: GPA,
          },
        },
      );
      if (data.insights?.length > 0) {
        setInsights(data.insights);
        setIsAI(true);
      }
    } catch {
      // Keep fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const iconForType = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-[18px] h-[18px]" strokeWidth={2.25} />;
      case 'tip': return <Info className="w-[18px] h-[18px]" strokeWidth={2} />;
      default: return <Lightbulb className="w-[18px] h-[18px]" strokeWidth={2} />;
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel rounded-2xl overflow-hidden lg:sticky lg:top-6"
    >
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border-default)]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/8">
              <Sparkles className="w-[18px] h-[18px] text-[var(--color-brand-cardinal)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[var(--text-md)] font-semibold text-[var(--color-neutral-900)]">AI Academic Insights</h3>
                {isAI && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] text-[9px] font-bold uppercase tracking-wider">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] font-medium">
                {isAI ? 'Powered by AI' : 'Personalized for your plan'}
              </p>
            </div>
          </div>
          {isAI && (
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.4 }}
              onClick={fetchInsights}
              disabled={loading}
              aria-label="Refresh insights"
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[var(--color-neutral-50)] p-4">
              <div className="flex gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                  <div className="h-4 w-2/3 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                  <div className="h-3 w-24 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                </div>
              </div>
            </div>
          ))
        ) : (
          insights.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={cn(
                'group rounded-xl p-4 transition-all duration-[var(--duration-normal)]',
                item.type === 'warning'
                  ? 'bg-[var(--color-warning-light)] hover:shadow-[var(--shadow-sm)]'
                  : item.type === 'tip'
                    ? 'bg-[var(--color-info-light)] hover:shadow-[var(--shadow-sm)]'
                    : 'bg-[var(--color-neutral-50)] hover:bg-[var(--color-brand-cardinal-light)] hover:shadow-[var(--shadow-sm)]',
              )}
            >
              <div className="flex gap-3.5">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    item.type === 'warning'
                      ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                      : item.type === 'tip'
                        ? 'bg-[var(--color-info)]/15 text-[var(--color-info)]'
                        : 'bg-[var(--color-brand-cardinal)]/10 text-[var(--color-brand-cardinal)]',
                  )}
                >
                  {iconForType(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--text-base)] font-medium text-[var(--color-neutral-800)] leading-snug">
                    {item.message}
                  </p>
                  <button
                    aria-label={item.action}
                    className={cn(
                      'mt-3 inline-flex items-center gap-1 text-[var(--text-xs)] font-semibold transition-all duration-[var(--duration-fast)]',
                      item.type === 'warning'
                        ? 'text-[var(--color-warning)] hover:text-[var(--color-brand-dark)]'
                        : item.type === 'tip'
                          ? 'text-[var(--color-info)] hover:text-[var(--color-brand-dark)]'
                          : 'text-[var(--color-brand-cardinal)] hover:text-[var(--color-brand-cardinal-hover)]',
                    )}
                  >
                    {item.action}
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-[var(--duration-fast)]" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}

        <div className="rounded-xl bg-[var(--color-neutral-50)]/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-200)]/50">
              <Lightbulb className="w-4 h-4 text-[var(--color-neutral-300)]" />
            </div>
            <div>
              <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-300)] uppercase tracking-wider">AI Tip</p>
              <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] mt-1 leading-relaxed">
                {isAI
                  ? 'These insights are generated by AI based on your academic progress and HCI program requirements.'
                  : 'Personalized tips and recommendations will appear here based on your plan and progress.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GraduationCheck() {
  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 px-1"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/10">
            <GraduationCap className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
          </div>
          <div>
            <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)]">Graduation Check</h1>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">Track your progress toward degree completion.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <EstimatedGraduationCard />
            <DegreeRequirementsSection />
            <GraduationTimelineSection />
          </div>
          <div className="lg:col-span-1">
            <AIAcademicInsights />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
