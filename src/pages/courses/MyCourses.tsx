import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Overview', text: 'My Courses. View enrolled, completed, saved, and planned courses in one place.' },
  { section: 'Current Semester', text: 'Current semester courses. In progress. Enrolled. Workload. Professor. Schedule.' },
  { section: 'Course History', text: 'Course history. Completed courses. Past semesters. Grades. Credits earned.' },
  { section: 'Saved Courses', text: 'Saved courses. Wishlist. Bookmarked. AI recommended. Seat availability. Add to plan.' },
  { section: 'Planned Courses', text: 'Planned courses. Next semester. Future schedule. Prerequisites. Conflicts.' },
];

import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  ExternalLink,
  Plus,
  X,
  Search,
  SortAsc,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { cn } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

import { HCI_COURSES, getWorkload, getAvgRating, CATEGORY_CONFIG } from '@/pages/catalog/data';
import type { Course, CourseCategory } from '@/pages/catalog/data';
import { SEMESTERS as SCHEDULE_SEMESTERS } from '@/pages/schedule/data';
import type { WorkloadLevel } from '@/pages/schedule/data';
import {
  COMPLETED_COURSES as SHARED_COMPLETED_COURSES,
  COMPLETED_COURSE_HISTORY,
  CURRENT_ENROLLMENTS,
  DEGREE_REQUIREMENTS,
  SAVED_COURSES,
} from '@/lib/student';

// ─── Types ───────────────────────────────────────────────────────────

type CourseStatus = 'enrolled' | 'completed' | 'saved' | 'planned';

interface MyCourseRow {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: CourseStatus;
  category: CourseCategory;
  instructor: string | null;
  semester: string;
  grade: string | null;
  workload: WorkloadLevel;
  workloadScore: number;
  rating: number | null;
  satisfies: string | null;
  aiReason: string | null;
  hasConflict: boolean;
  conflictNote: string | null;
  prereqsMet: boolean;
  prereqNote: string | null;
}

type TabId = 'my-courses' | 'saved' | 'planned';

const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'my-courses', label: 'My Courses', icon: BookOpen },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'planned', label: 'Planned', icon: CalendarClock },
];

// ─── Data Building ───────────────────────────────────────────────────

function findCatalogCourse(code: string): Course | undefined {
  return HCI_COURSES.find((c) => c.code === code || c.code.replace(/\s/g, '') === code.replace(/\s/g, ''));
}

function getRequirementLabel(code: string): string | null {
  for (const req of DEGREE_REQUIREMENTS) {
    if (req.courses?.some((c) => c.code === code)) return req.label;
  }
  const catalog = findCatalogCourse(code);
  if (!catalog) return null;
  if (catalog.category === 'Elective') return 'Electives';
  if (catalog.category === 'Evaluation Core') return 'Research Methods';
  return 'Major Core requirements';
}

function workloadLevel(score: number): WorkloadLevel {
  if (score <= 2) return 'low';
  if (score <= 3) return 'moderate';
  return 'high';
}

const WORKLOAD_STYLE: Record<WorkloadLevel, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-[var(--color-success)]/12', text: 'text-[var(--color-success)]', label: 'Low' },
  moderate: { bg: 'bg-[var(--color-warning)]/12', text: 'text-[var(--color-warning)]', label: 'Med' },
  high: { bg: 'bg-[var(--color-error)]/12', text: 'text-[var(--color-error)]', label: 'High' },
};

function buildRows(): MyCourseRow[] {
  const rows: MyCourseRow[] = [];

  for (const entry of CURRENT_ENROLLMENTS) {
    const catalog = findCatalogCourse(entry.code);
    const wl = catalog ? getWorkload(catalog) : 3;
    rows.push({
      id: `enrolled-${entry.code}`,
      code: entry.code,
      name: entry.name,
      credits: entry.credits,
      status: 'enrolled',
      category: entry.category,
      instructor: catalog?.offerings[0]?.instructor ?? null,
      semester: entry.semester,
      grade: null,
      workload: workloadLevel(wl),
      workloadScore: wl,
      rating: catalog ? getAvgRating(catalog) : null,
      satisfies: getRequirementLabel(entry.code),
      aiReason: null,
      hasConflict: false,
      conflictNote: null,
      prereqsMet: true,
      prereqNote: null,
    });
  }

  for (const completed of COMPLETED_COURSE_HISTORY) {
    const catalog = findCatalogCourse(completed.code);
    const wl = catalog ? getWorkload(catalog) : 3;
    rows.push({
      id: `completed-${completed.code}`,
      code: completed.code,
      name: completed.name,
      credits: completed.credits,
      status: 'completed',
      category: completed.category,
      instructor: catalog?.offerings[0]?.instructor ?? null,
      semester: completed.semester,
      grade: completed.grade,
      workload: workloadLevel(wl),
      workloadScore: wl,
      rating: catalog ? getAvgRating(catalog) : null,
      satisfies: getRequirementLabel(completed.code),
      aiReason: null,
      hasConflict: false,
      conflictNote: null,
      prereqsMet: true,
      prereqNote: null,
    });
  }

  for (const saved of SAVED_COURSES) {
    const catalog = findCatalogCourse(saved.code);
    if (!catalog) continue;
    const wl = getWorkload(catalog);
    const alreadyHave = rows.some((r) => r.code === saved.code);
    if (alreadyHave) continue;
    rows.push({
      id: `saved-${saved.code}`,
      code: saved.code,
      name: catalog.name,
      credits: parseInt(catalog.credits),
      status: 'saved',
      category: catalog.category,
      instructor: catalog.offerings[0]?.instructor ?? null,
      semester: saved.targetSemester,
      grade: null,
      workload: workloadLevel(wl),
      workloadScore: wl,
      rating: getAvgRating(catalog),
      satisfies: getRequirementLabel(saved.code),
      aiReason: saved.savedReason,
      hasConflict: saved.code === 'PSYCH 5010',
      conflictNote: saved.code === 'PSYCH 5010' ? 'Time conflict with HCI 5990 on Fridays' : null,
      prereqsMet: true,
      prereqNote: null,
    });
  }

  const plannedSemester = SCHEDULE_SEMESTERS.find((s) => s.id === 'fall-2026');
  if (plannedSemester) {
    for (const sc of plannedSemester.courses) {
      const alreadyHave = rows.some((r) => r.code === sc.code);
      if (alreadyHave) continue;
      const catalog = findCatalogCourse(sc.code);
      const prereqsMet = sc.prerequisites.every((p) => SHARED_COMPLETED_COURSES.includes(p));
      rows.push({
        id: `planned-${sc.code}`,
        code: sc.code,
        name: sc.name,
        credits: sc.credits,
        status: 'planned',
        category: catalog?.category ?? 'Elective',
        instructor: sc.instructor,
        semester: 'Fall 2026',
        grade: null,
        workload: sc.workload,
        workloadScore: sc.workload === 'low' ? 2 : sc.workload === 'moderate' ? 3 : 4,
        rating: catalog ? getAvgRating(catalog) : null,
        satisfies: getRequirementLabel(sc.code),
        aiReason: null,
        hasConflict: false,
        conflictNote: null,
        prereqsMet,
        prereqNote: prereqsMet ? null : `Requires ${sc.prerequisites.filter((p) => !SHARED_COMPLETED_COURSES.includes(p)).join(', ')}`,
      });
    }
  }

  return rows;
}

const ALL_ROWS = buildRows();

// ─── Status Config ───────────────────────────────────────────────────

const STATUS_STYLE: Record<CourseStatus, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  enrolled: { bg: 'bg-[var(--color-info)]/12', text: 'text-[var(--color-info)]', label: 'Enrolled', icon: BookOpen },
  completed: { bg: 'bg-[var(--color-success)]/12', text: 'text-[var(--color-success)]', label: 'Completed', icon: CheckCircle2 },
  saved: { bg: 'bg-[var(--color-brand-cardinal)]/12', text: 'text-[var(--color-brand-cardinal)]', label: 'Saved', icon: Bookmark },
  planned: { bg: 'bg-[var(--color-warning)]/12', text: 'text-[var(--color-warning)]', label: 'Planned', icon: CalendarClock },
};

// ─── Sub-components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: CourseStatus }) {
  const cfg = STATUS_STYLE[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[var(--text-2xs)] font-semibold', cfg.bg, cfg.text)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: CourseCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[var(--text-2xs)] font-semibold', cfg.bgClass, cfg.textClass)}>
      {cfg.label}
    </span>
  );
}

function WorkloadDots({ score, level }: { score: number; level: WorkloadLevel }) {
  const style = WORKLOAD_STYLE[level];
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn('w-1.5 h-1.5 rounded-full', i <= score ? style.text.replace('text-', 'bg-') : 'bg-[var(--color-neutral-200)]')}
          />
        ))}
      </div>
      <span className={cn('text-[var(--text-2xs)] font-medium', style.text)}>{style.label}</span>
    </div>
  );
}

// ─── Table Header ────────────────────────────────────────────────────

const GRID_COLS = 'minmax(0,2.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.7fr) 52px minmax(0,1.1fr) 44px';

const COLUMNS = [
  { key: 'code', label: 'Course' },
  { key: 'category', label: 'Category' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'semester', label: 'Semester' },
  { key: 'workload', label: 'Workload' },
  { key: 'grade', label: 'Grade' },
  { key: 'satisfies', label: 'Satisfies' },
  { key: 'actions', label: '' },
];

function TableHeader({ sortBy, sortDir, onSort }: { sortBy: string; sortDir: 'asc' | 'desc'; onSort: (key: string) => void }) {
  return (
    <div
      className="grid items-center gap-2 px-4 py-2.5 bg-[var(--color-neutral-100)] border-b border-[var(--color-border-default)] sticky top-0 z-10"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {COLUMNS.map((col) => (
        <button
          key={col.key}
          type="button"
          onClick={() => col.key !== 'actions' && onSort(col.key)}
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.12em] text-left select-none transition-colors flex items-center gap-1',
            col.key !== 'actions' ? 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] cursor-pointer' : 'cursor-default',
          )}
        >
          {col.label}
          {sortBy === col.key && (
            <SortAsc className={cn('w-3 h-3', sortDir === 'desc' && 'rotate-180')} />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Table Row ───────────────────────────────────────────────────────

function TableRow({ row, index }: { row: MyCourseRow; index: number; key?: string | number }) {
  const catalogCourse = findCatalogCourse(row.code);
  const courseId = catalogCourse?.id;

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'grid items-center gap-2 px-4 py-3 border-b border-[var(--color-border-default)]/60 transition-colors hover:bg-[var(--color-neutral-50)]/80 group',
        row.hasConflict && 'bg-[var(--color-error)]/[0.03]',
      )}
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {/* Course — code + name on line 1, credits + AI reason on line 2 */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          {courseId ? (
            <Link
              to={`/course/${courseId}`}
              className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-900)] hover:text-[var(--color-brand-cardinal)] transition-colors shrink-0"
            >
              {row.code}
            </Link>
          ) : (
            <span className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-900)] shrink-0">{row.code}</span>
          )}
          <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] tabular-nums shrink-0">{row.credits} cr</span>
          {row.hasConflict && (
            <span className="shrink-0" title={row.conflictNote ?? 'Schedule conflict'}>
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-error)]" />
            </span>
          )}
          {!row.prereqsMet && (
            <span className="shrink-0" title={row.prereqNote ?? 'Prerequisites not met'}>
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            </span>
          )}
        </div>
        <span className="text-[var(--text-xs)] text-[var(--color-neutral-500)] truncate">{row.name}</span>
        {row.aiReason && (
          <span className="text-[var(--text-2xs)] text-[var(--color-brand-cardinal)] flex items-center gap-1 mt-0.5">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{row.aiReason}</span>
          </span>
        )}
      </div>

      {/* Category */}
      <div><CategoryBadge category={row.category} /></div>

      {/* Instructor */}
      <div className="text-[var(--text-sm)] text-[var(--color-neutral-600)] truncate">{row.instructor ?? '—'}</div>

      {/* Semester */}
      <div className="text-[var(--text-xs)] text-[var(--color-neutral-600)]">{row.semester}</div>

      {/* Workload */}
      <div><WorkloadDots score={row.workloadScore} level={row.workload} /></div>

      {/* Grade */}
      <div>
        {row.grade ? (
          <span className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-800)]">{row.grade}</span>
        ) : row.status === 'enrolled' ? (
          <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">—</span>
        ) : (
          <span className="text-[var(--color-neutral-300)]">—</span>
        )}
      </div>

      {/* Satisfies requirement */}
      <div className="min-w-0">
        {row.satisfies ? (
          <span className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-medium text-[var(--color-success)]">
            <GraduationCap className="w-3 h-3 shrink-0" />
            <span className="truncate">{row.satisfies}</span>
          </span>
        ) : (
          <span className="text-[var(--color-neutral-300)]">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {courseId && (
          <Link
            to={`/course/${courseId}`}
            className="p-1 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
            title="View details"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
          </Link>
        )}
        {row.status === 'saved' && (
          <Link
            to="/planner"
            className="p-1 rounded-lg hover:bg-[var(--color-brand-cardinal-light)] transition-colors"
            title="Add to plan"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--color-brand-cardinal)]" />
          </Link>
        )}
        {(row.status === 'enrolled' || row.status === 'completed') && (
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
            title="Discussion thread"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────

function SectionHeader({ label, count, icon: Icon, color }: { label: string; count: number; icon: typeof BookOpen; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-neutral-50)]/60 border-b border-[var(--color-border-default)]/40">
      <Icon className={cn('w-3.5 h-3.5', color)} />
      <span className={cn('text-[var(--text-xs)] font-bold uppercase tracking-wider', color)}>{label}</span>
      <span className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] bg-[var(--color-neutral-100)] rounded-full px-1.5 py-0.5">{count}</span>
    </div>
  );
}

// ─── Stats Strip ─────────────────────────────────────────────────────

function StatsStrip({ rows }: { rows: MyCourseRow[] }) {
  const enrolled = rows.filter((r) => r.status === 'enrolled');
  const completed = rows.filter((r) => r.status === 'completed');
  const totalCredits = [...enrolled, ...completed].reduce((s, r) => s + r.credits, 0);

  return (
    <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
      {enrolled.length} enrolled · {completed.length} completed · {totalCredits} credits total
    </p>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabId }) {
  const configs: Record<TabId, { icon: typeof BookOpen; title: string; desc: string; action: string; link: string }> = {
    'my-courses': { icon: BookOpen, title: 'No courses yet', desc: 'Start browsing the catalog to find courses.', action: 'Browse Catalog', link: '/catalog' },
    saved: { icon: Bookmark, title: 'No saved courses', desc: 'Save courses from the catalog to compare and plan.', action: 'Browse Catalog', link: '/catalog' },
    planned: { icon: CalendarClock, title: 'No planned courses', desc: 'Use the AI Planner to build your next semester.', action: 'Open AI Planner', link: '/planner' },
  };
  const cfg = configs[tab];
  const Icon = cfg.icon;

  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-neutral-100)] flex items-center justify-center">
        <Icon className="w-6 h-6 text-[var(--color-neutral-400)]" />
      </div>
      <p className="text-[var(--text-base)] font-bold text-[var(--color-neutral-800)]">{cfg.title}</p>
      <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">{cfg.desc}</p>
      <Link
        to={cfg.link}
        className="mt-2 text-[var(--text-sm)] font-semibold text-[var(--color-brand-cardinal)] hover:underline flex items-center gap-1"
      >
        {cfg.action}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}

// ─── Conflict Banner ─────────────────────────────────────────────────

function ConflictBanner({ rows }: { rows: MyCourseRow[] }) {
  const conflicts = rows.filter((r) => r.hasConflict);
  const prereqIssues = rows.filter((r) => !r.prereqsMet);
  if (conflicts.length === 0 && prereqIssues.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        {conflicts.map((r) => (
          <p key={r.id} className="text-[var(--text-sm)] text-[var(--color-error)]">
            <span className="font-semibold">{r.code}</span> — {r.conflictNote}
          </p>
        ))}
        {prereqIssues.map((r) => (
          <p key={r.id} className="text-[var(--text-sm)] text-[var(--color-warning)]">
            <span className="font-semibold">{r.code}</span> — {r.prereqNote}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState<TabId>('my-courses');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | 'all'>('all');

  const handleSort = useCallback((key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }, [sortBy]);

  const filteredRows = useMemo(() => {
    let rows: MyCourseRow[];
    switch (activeTab) {
      case 'my-courses':
        rows = ALL_ROWS.filter((r) => r.status === 'enrolled' || r.status === 'completed');
        break;
      case 'saved':
        rows = ALL_ROWS.filter((r) => r.status === 'saved');
        break;
      case 'planned':
        rows = ALL_ROWS.filter((r) => r.status === 'planned');
        break;
    }

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.instructor?.toLowerCase().includes(q) ||
        r.aiReason?.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== 'all') {
      rows = rows.filter((r) => r.category === categoryFilter);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'code': cmp = a.code.localeCompare(b.code); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'credits': cmp = a.credits - b.credits; break;
        case 'instructor': cmp = (a.instructor ?? '').localeCompare(b.instructor ?? ''); break;
        case 'semester': cmp = a.semester.localeCompare(b.semester); break;
        case 'workload': cmp = a.workloadScore - b.workloadScore; break;
        case 'grade': cmp = (a.grade ?? '').localeCompare(b.grade ?? ''); break;
        default: cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [activeTab, search, sortBy, sortDir, categoryFilter]);

  const enrolledCount = ALL_ROWS.filter((r) => r.status === 'enrolled').length;
  const completedCount = ALL_ROWS.filter((r) => r.status === 'completed').length;
  const savedCount = ALL_ROWS.filter((r) => r.status === 'saved').length;
  const plannedCount = ALL_ROWS.filter((r) => r.status === 'planned').length;

  const tabCounts: Record<TabId, number> = {
    'my-courses': enrolledCount + completedCount,
    saved: savedCount,
    planned: plannedCount,
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-[1400px] mx-auto space-y-5"
      >
        {/* Page header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)]">My Courses</h1>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              Your academic record — enrolled, completed, saved, and planned.
            </p>
          </div>
          <StatsStrip rows={ALL_ROWS} />
        </motion.div>

        {/* Conflict/prereq alerts */}
        <ConflictBanner rows={ALL_ROWS} />

        {/* Tabs + filter bar */}
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] px-4">
            {/* Tabs */}
            <div className="flex">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-3 text-[var(--text-sm)] font-semibold transition-colors whitespace-nowrap',
                      active ? 'text-[var(--color-brand-cardinal)]' : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={cn(
                      'text-[var(--text-2xs)] font-bold px-1.5 py-0.5 rounded-full ml-0.5',
                      active ? 'bg-[var(--color-brand-cardinal)]/10 text-[var(--color-brand-cardinal)]' : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)]',
                    )}>
                      {tabCounts[tab.id]}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-[var(--color-brand-cardinal)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + filter */}
            <div className="flex items-center gap-2 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-[var(--text-sm)] bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] rounded-xl w-36 focus:w-48 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-cardinal)]/10 focus:border-[var(--color-border-focus)] transition-all placeholder:text-[var(--color-neutral-400)]"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" />
                  </button>
                )}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CourseCategory | 'all')}
                className="text-[var(--text-xs)] font-medium bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] rounded-xl px-2.5 py-1.5 text-[var(--color-neutral-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-cardinal)]/10 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="Design Core">Design</option>
                <option value="Implementation Core">Implementation</option>
                <option value="Phenomena Core">Phenomena</option>
                <option value="Evaluation Core">Evaluation</option>
                <option value="Elective">Elective</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredRows.length > 0 ? (
                  activeTab === 'my-courses' ? (
                    <>
                      {(() => {
                        const enrolled = filteredRows.filter((r) => r.status === 'enrolled');
                        const completed = filteredRows.filter((r) => r.status === 'completed');
                        return (
                          <>
                            {enrolled.length > 0 && (
                              <>
                                <SectionHeader label="Currently Enrolled" count={enrolled.length} icon={BookOpen} color="text-[var(--color-info)]" />
                                {enrolled.map((row, i) => <TableRow key={row.id} row={row} index={i} />)}
                              </>
                            )}
                            {completed.length > 0 && (
                              <>
                                <SectionHeader label="Completed" count={completed.length} icon={CheckCircle2} color="text-[var(--color-success)]" />
                                {completed.map((row, i) => <TableRow key={row.id} row={row} index={i} />)}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    filteredRows.map((row, i) => (
                      <TableRow key={row.id} row={row} index={i} />
                    ))
                  )
                ) : (
                  <EmptyState tab={activeTab} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {filteredRows.length > 0 && (
            <div className="border-t border-[var(--color-border-default)]/50 bg-[var(--color-neutral-50)]/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[var(--text-xs)] text-[var(--color-neutral-500)]">
                {filteredRows.length} course{filteredRows.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
                {' · '}
                {filteredRows.reduce((s, r) => s + r.credits, 0)} credits
              </span>
              <div className="flex items-center gap-4">
                <Link
                  to="/catalog"
                  className="text-[var(--text-xs)] font-semibold text-[var(--color-brand-cardinal)] hover:underline flex items-center gap-1"
                >
                  Browse Catalog
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/planner"
                  className="text-[var(--text-xs)] font-semibold text-[var(--color-brand-cardinal)] hover:underline flex items-center gap-1"
                >
                  AI Planner
                  <Sparkles className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pipeline explainer */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-[var(--text-xs)] text-[var(--color-neutral-400)] py-2">
          <span>Catalog</span>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-[var(--color-brand-cardinal)]">Save</span>
          <ArrowRight className="w-3 h-3" />
          <span>Plan</span>
          <ArrowRight className="w-3 h-3" />
          <span>Enroll</span>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-[var(--color-success)]">Complete</span>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
