import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Header', text: 'AI Semester Plan Builder. Let AI create a personalized semester plan based on your academic profile.' },
  { section: 'Parameters', text: 'Plan Parameters. Major. Semester. Credit Preference. Difficulty Tolerance. Time of Day Preference. Additional Preferences. Generate Plans.' },
  { section: 'Plans', text: 'Generated Plans. Plan A Balanced Load. Plan B Research Focus. Plan C Light Schedule. Course recommendations. Workload distribution.' },
  { section: 'Actions', text: 'Apply to Schedule Planner. Customize plan. Save plan. Week Preview.' },
];

import { motion } from 'motion/react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  CalendarDays,
  Sun,
  Sunset,
  Moon,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { HCI_COURSES, getWorkload, type CourseCategory } from '@/pages/catalog/data';
import { COMPLETED_COURSES, IN_PROGRESS_COURSES } from '@/lib/student';

// ─── Types ───────────────────────────────────────────────────────────

interface PlanParams {
  major: string;
  semester: string;
  targetCredits: number;
  difficultyTolerance: number;
  timePreferences: string[];
  avoidBackToBack: boolean;
  balanceMix: boolean;
  lighterFridays: boolean;
}

interface PlanCourse {
  code: string;
  name: string;
  credits: number;
  instructor: string | null;
  workload: number;
  category: CourseCategory;
  days: string[];
  timeSlot: 'morning' | 'afternoon' | 'evening';
  prerequisitesMet: boolean;
  prerequisiteWarning?: string;
  reason: string;
}

interface GeneratedPlan {
  id: string;
  title: string;
  matchScore: number;
  totalCredits: number;
  courses: PlanCourse[];
  workloadDistribution: { low: number; moderate: number; high: number };
  requirementsCoverage: string;
  explanation: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_PARAMS: PlanParams = {
  major: 'Human-Computer Interaction',
  semester: 'Fall 2026',
  targetCredits: 9,
  difficultyTolerance: 3,
  timePreferences: ['morning', 'afternoon'],
  avoidBackToBack: false,
  balanceMix: true,
  lighterFridays: false,
};

const PLAN_ACCENTS = [
  { color: 'var(--color-brand-cardinal)', light: 'var(--color-brand-cardinal-light)' },
  { color: '#6366f1', light: '#eef2ff' },
  { color: '#0d9488', light: '#f0fdfa' },
];

const COURSE_COLORS = [
  'var(--color-brand-cardinal)',
  'var(--color-success)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-brand-gold)',
];

const PLAN_LETTERS = ['A', 'B', 'C'];

const DAY_MAP: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
const PREVIEW_DAYS = ['M', 'T', 'W', 'T', 'F'];

const TIME_PATTERNS: { days: string[]; slot: 'morning' | 'afternoon' }[] = [
  { days: ['Tue', 'Thu'], slot: 'afternoon' },
  { days: ['Mon', 'Wed'], slot: 'morning' },
  { days: ['Tue', 'Thu'], slot: 'morning' },
  { days: ['Mon', 'Wed', 'Fri'], slot: 'morning' },
  { days: ['Mon', 'Wed', 'Fri'], slot: 'afternoon' },
];

const PREREQ_MAP: Record<string, string[]> = {
  'HCI 5750': ['HCI 5210'],
  'HCI 5220': ['HCI 5790X'],
  'HCI 5230X': ['HCI 5790X'],
  'HCI 6030': ['HCI 5040'],
  'HCI 6550': ['HCI 5210'],
};

// ─── Helpers ──────────────────────────────────────────────────────────

const UNAVAILABLE = [...new Set([...COMPLETED_COURSES, ...IN_PROGRESS_COURSES])];

function makePlanCourse(
  code: string,
  reason: string,
  days: string[],
  slot: 'morning' | 'afternoon',
  workloadOverride?: number,
): PlanCourse | null {
  const course = HCI_COURSES.find((c) => c.code === code);
  if (!course) return null;
  const wl = workloadOverride ?? getWorkload(course);
  const offering = course.offerings[0];
  const prereqs = PREREQ_MAP[code] ?? [];
  const unmet = prereqs.filter((p) => !UNAVAILABLE.includes(p));
  return {
    code: course.code,
    name: course.name,
    credits: parseInt(course.credits),
    instructor: offering?.instructor ?? null,
    workload: wl,
    category: course.category,
    days,
    timeSlot: slot,
    prerequisitesMet: unmet.length === 0,
    prerequisiteWarning: unmet.length > 0 ? `Requires ${unmet.join(', ')}` : undefined,
    reason,
  };
}

function computeWorkloadDist(courses: PlanCourse[]): { low: number; moderate: number; high: number } {
  const dist = { low: 0, moderate: 0, high: 0 };
  courses.forEach((c) => {
    if (c.workload <= 2) dist.low++;
    else if (c.workload <= 3) dist.moderate++;
    else dist.high++;
  });
  return dist;
}

// ─── Fallback Plan Strategies ─────────────────────────────────────────

interface CourseOption {
  code: string;
  reason: string;
  days: string[];
  slot: 'morning' | 'afternoon';
  workloadOverride?: number;
}

const PLAN_STRATEGIES: { title: string; matchScore: number; courses: CourseOption[] }[] = [
  {
    title: 'Balanced Load',
    matchScore: 94,
    courses: [
      { code: 'HCI 6550', reason: 'Covers phenomena core requirement; strong social HCI perspective', days: ['Tue', 'Thu'], slot: 'afternoon' },
      { code: 'ARTGR 5300', reason: 'Design core fills remaining requirement; complements research focus', days: ['Mon', 'Wed'], slot: 'morning' },
      { code: 'HCI 5960', reason: 'Lightweight elective exploring emerging HCI trends', days: ['Tue', 'Thu'], slot: 'morning', workloadOverride: 2 },
      { code: 'HCI 5400X', reason: 'Adds implementation depth with XR and machine learning', days: ['Mon', 'Wed', 'Fri'], slot: 'morning' },
      { code: 'PSYCH 5010', reason: 'Broadens evaluation methodology skills', days: ['Mon', 'Wed', 'Fri'], slot: 'afternoon', workloadOverride: 4 },
    ],
  },
  {
    title: 'Research & Implementation',
    matchScore: 87,
    courses: [
      { code: 'HCI 5400X', reason: 'XR and machine learning skills for research or industry', days: ['Mon', 'Wed', 'Fri'], slot: 'morning' },
      { code: 'HCI 6550', reason: 'Organizational perspectives complement technical coursework', days: ['Tue', 'Thu'], slot: 'afternoon' },
      { code: 'PSYCH 5010', reason: 'Foundations of behavioral research strengthens methodology', days: ['Mon', 'Wed', 'Fri'], slot: 'afternoon', workloadOverride: 4 },
      { code: 'HCI 5260', reason: 'Design ethnography balances quantitative with qualitative methods', days: ['Tue', 'Thu'], slot: 'morning', workloadOverride: 2 },
      { code: 'ARTGR 5300', reason: 'Design core rounds out research-heavy load', days: ['Mon', 'Wed'], slot: 'morning' },
    ],
  },
  {
    title: 'Light & Focused',
    matchScore: 82,
    courses: [
      { code: 'HCI 5960', reason: 'Light elective pairs well with thesis or creative component work', days: ['Tue', 'Thu'], slot: 'morning', workloadOverride: 2 },
      { code: 'ARTGR 5300', reason: 'Satisfies design core with hands-on studio experience', days: ['Mon', 'Wed'], slot: 'morning' },
      { code: 'HCI 5260', reason: 'Ethnographic methods add qualitative depth', days: ['Tue', 'Thu'], slot: 'afternoon', workloadOverride: 2 },
      { code: 'HCI 6550', reason: 'Phenomena core covers organizational implications', days: ['Mon', 'Wed'], slot: 'afternoon' },
      { code: 'HCI 5400X', reason: 'Technical elective for implementation skills', days: ['Mon', 'Wed', 'Fri'], slot: 'morning' },
    ],
  },
];

function buildFallbackPlans(targetCredits: number): GeneratedPlan[] {
  const numCourses = Math.max(1, Math.round(targetCredits / 3));

  return PLAN_STRATEGIES.map((strategy, i) => {
    const courses = strategy.courses
      .slice(0, numCourses)
      .map((opt) => makePlanCourse(opt.code, opt.reason, opt.days, opt.slot, opt.workloadOverride))
      .filter(Boolean) as PlanCourse[];

    const total = courses.reduce((s, c) => s + c.credits, 0);

    const cats: Record<string, number> = {};
    courses.forEach((c) => {
      const key = c.category.includes('Core') ? c.category.replace(' Core', '') : 'Elective';
      cats[key] = (cats[key] || 0) + 1;
    });
    const coverage = Object.entries(cats).map(([k, v]) => `${v} ${k}`).join(' + ');

    const desc = strategy.title.includes('Balanced')
      ? `Balanced mix of ${courses.length} course${courses.length !== 1 ? 's' : ''} for a manageable ${total}-credit semester.`
      : strategy.title.includes('Research')
        ? `Research-oriented plan with ${total} credits targeting core requirements and methodology depth.`
        : `Lighter ${total}-credit semester ideal for students focusing on creative component or thesis work.`;

    return {
      id: `plan-${i}`,
      title: strategy.title,
      matchScore: strategy.matchScore,
      totalCredits: total,
      courses,
      workloadDistribution: computeWorkloadDist(courses),
      requirementsCoverage: coverage,
      explanation: desc,
    };
  }).filter((p) => p.courses.length > 0);
}

interface AIPlanResponse {
  title: string;
  matchScore: number;
  courses: { code: string; reason: string }[];
  explanation: string;
  requirementsCoverage: string;
}

function enrichAIPlan(aiPlan: AIPlanResponse, index: number): GeneratedPlan {
  const courses: PlanCourse[] = aiPlan.courses
    .map((c, i) => {
      if (UNAVAILABLE.includes(c.code)) return null;
      const pattern = TIME_PATTERNS[i % TIME_PATTERNS.length];
      return makePlanCourse(c.code, c.reason, pattern.days, pattern.slot);
    })
    .filter(Boolean) as PlanCourse[];

  return {
    id: `plan-${index}`,
    title: aiPlan.title,
    matchScore: aiPlan.matchScore,
    totalCredits: courses.reduce((s, c) => s + c.credits, 0),
    courses,
    workloadDistribution: computeWorkloadDist(courses),
    requirementsCoverage: aiPlan.requirementsCoverage || '',
    explanation: aiPlan.explanation,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────

function WorkloadDots({ level }: { level: number }) {
  const getColor = () => {
    if (level <= 2) return 'bg-[var(--color-success)]';
    if (level <= 3) return 'bg-[var(--color-warning)]';
    return 'bg-[var(--color-error)]';
  };
  return (
    <div className="flex gap-0.5" title={`Workload: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[6px] h-[6px] rounded-full',
            i < level ? getColor() : 'bg-[var(--color-neutral-200)]',
          )}
        />
      ))}
    </div>
  );
}

const SLOT_LABELS = ['8–12', '12–5', '5–8'];

const SLOT_TIME_MAP: Record<string, string> = {
  morning: '8 am – 12 pm',
  afternoon: '12 – 5 pm',
  evening: '5 – 8 pm',
};

function WeeklyPreview({ courses }: { courses: PlanCourse[] }) {
  const grid: (string | null)[][] = Array.from({ length: 3 }, () => Array(5).fill(null));
  const legend: { color: string; code: string; days: string; time: string }[] = [];

  courses.forEach((course, i) => {
    const color = COURSE_COLORS[i % COURSE_COLORS.length];
    legend.push({
      color,
      code: course.code,
      days: course.days.join('/'),
      time: SLOT_TIME_MAP[course.timeSlot] ?? '',
    });
    const slotIdx = course.timeSlot === 'morning' ? 0 : course.timeSlot === 'afternoon' ? 1 : 2;
    course.days.forEach((day) => {
      const dayIdx = DAY_MAP[day];
      if (dayIdx !== undefined) grid[slotIdx][dayIdx] = color;
    });
  });

  const hasFriday = courses.some((c) => c.days.includes('Fri'));
  const daysUsed = new Set(courses.flatMap((c) => c.days));
  const annotation = !hasFriday
    ? 'No classes Friday'
    : daysUsed.size >= 5
      ? 'Dense week — no gaps'
      : null;

  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="text-[var(--text-2xs)] font-bold text-[var(--color-neutral-400)] uppercase tracking-wider mb-3">
        Week Preview
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-[30px_repeat(5,1fr)] gap-1.5 mb-1.5">
        <div />
        {PREVIEW_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[var(--color-neutral-500)] tracking-wide select-none">
            {d}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="space-y-1.5">
        {grid.map((row, slotIdx) => (
          <div key={slotIdx} className="grid grid-cols-[30px_repeat(5,1fr)] gap-1.5">
            <div className="flex items-center justify-center">
              <span className="text-[7px] font-bold text-[var(--color-neutral-400)] leading-none select-none whitespace-nowrap">
                {SLOT_LABELS[slotIdx]}
              </span>
            </div>
            {row.map((color, dayIdx) => (
              <motion.div
                key={dayIdx}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.4 + (slotIdx * 5 + dayIdx) * 0.04,
                  type: 'spring',
                  stiffness: 350,
                  damping: 22,
                }}
                className={cn(
                  'aspect-square rounded-lg',
                  color
                    ? 'shadow-[0_2px_6px_rgba(0,0,0,0.12)]'
                    : 'bg-[var(--color-neutral-50)] border border-[var(--color-neutral-100)]',
                )}
                style={
                  color
                    ? {
                        backgroundColor: color,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)',
                      }
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Color legend */}
      <div className="mt-3 pt-2.5 border-t border-[var(--color-border-default)]/40 space-y-2">
        {legend.map(({ color, code, days, time }) => (
          <div key={code} className="flex items-start gap-2">
            <span
              className="w-2.5 h-2.5 rounded-[3px] shrink-0 shadow-sm mt-0.5"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[var(--color-neutral-600)] leading-none block truncate">
                {code}
              </span>
              <span className="text-[9px] text-[var(--color-neutral-400)] leading-tight block mt-0.5">
                {days} · {time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Annotation */}
      {annotation && (
        <div className="mt-2.5 pt-2 border-t border-[var(--color-border-default)]/30">
          <span
            className={cn(
              'text-[var(--text-2xs)] font-semibold italic',
              !hasFriday ? 'text-[var(--color-success)]' : 'text-[var(--color-neutral-400)]',
            )}
          >
            {annotation}
          </span>
        </div>
      )}
    </div>
  );
}

function WorkloadDistBar({ distribution }: { distribution: { low: number; moderate: number; high: number } }) {
  const total = distribution.low + distribution.moderate + distribution.high;
  if (total === 0) return null;

  return (
    <div>
      <p className="text-[var(--text-2xs)] font-bold text-[var(--color-neutral-400)] uppercase tracking-wider mb-1.5">
        Workload Distribution
      </p>
      <div className="flex h-2 rounded-full overflow-hidden gap-px bg-[var(--color-neutral-100)]">
        {distribution.low > 0 && (
          <motion.div
            className="bg-[var(--color-success)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(distribution.low / total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />
        )}
        {distribution.moderate > 0 && (
          <motion.div
            className="bg-[var(--color-warning)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(distribution.moderate / total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          />
        )}
        {distribution.high > 0 && (
          <motion.div
            className="bg-[var(--color-error)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(distribution.high / total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          />
        )}
      </div>
      <div className="flex gap-3 mt-1.5">
        {distribution.low > 0 && (
          <span className="flex items-center gap-1 text-[var(--text-2xs)] text-[var(--color-neutral-500)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            Low: {distribution.low}
          </span>
        )}
        {distribution.moderate > 0 && (
          <span className="flex items-center gap-1 text-[var(--text-2xs)] text-[var(--color-neutral-500)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
            Moderate: {distribution.moderate}
          </span>
        )}
        {distribution.high > 0 && (
          <span className="flex items-center gap-1 text-[var(--text-2xs)] text-[var(--color-neutral-500)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
            High: {distribution.high}
          </span>
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, index }: { plan: GeneratedPlan; index: number; key?: string | number }) {
  const accent = PLAN_ACCENTS[index % PLAN_ACCENTS.length];

  return (
    <motion.div variants={fadeUp} className="flex gap-4">
      <div
        className="flex-1 glass-panel rounded-2xl overflow-hidden relative"
        style={{ borderLeft: `3px solid ${accent.color}` }}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">
              Plan {PLAN_LETTERS[index]}
              <span className="text-[var(--color-neutral-300)] font-normal mx-1.5">—</span>
              <span style={{ color: accent.color }}>{plan.title.replace(/^Plan\s*[A-C]:?\s*/i, '')}</span>
            </h3>
            <span
              className="text-[var(--text-xs)] font-bold px-2.5 py-1 rounded-lg shrink-0 ml-3"
              style={{ backgroundColor: accent.light, color: accent.color }}
            >
              {plan.matchScore}%
            </span>
          </div>

          {/* Total credits */}
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-600)]">
              Total Credits: <span className="text-[var(--color-neutral-800)]">{plan.totalCredits}</span>
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--color-neutral-400)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (plan.totalCredits / 15) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>
          </div>

          {/* Course list */}
          <div className="space-y-1">
            {plan.courses.map((course, i) => (
              <motion.div
                key={course.code}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-neutral-50)]/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-[var(--text-2xs)] font-bold text-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal)]/8 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {course.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)] truncate block">
                      {course.name}
                    </span>
                    {course.instructor && (
                      <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] block mt-0.5">
                        {course.instructor}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-400)] tabular-nums">
                    {course.credits} cr
                  </span>
                  <WorkloadDots level={course.workload} />
                  {!course.prerequisitesMet && (
                    <span title={course.prerequisiteWarning} className="text-[var(--color-warning)]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Workload distribution */}
          <WorkloadDistBar distribution={plan.workloadDistribution} />

          {/* Requirement coverage */}
          <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-neutral-500)]">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>
              Covers: <span className="font-semibold text-[var(--color-neutral-700)]">{plan.requirementsCoverage}</span>
            </span>
          </div>

          {/* AI Explanation */}
          <div className="rounded-xl bg-[var(--color-neutral-50)] p-3.5">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-cardinal)]/10">
                <Sparkles className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
              </div>
              <p className="text-[var(--text-sm)] text-[var(--color-neutral-600)] leading-relaxed">
                {plan.explanation}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border-default)]/50">
            <Link to="/schedule">
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Apply to Schedule
              </Button>
            </Link>
            <Button variant="outline" size="sm" disabled>
              Customize
            </Button>
            <Button variant="outline" size="sm" disabled>
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly preview */}
      <div className="w-52 shrink-0 hidden xl:block">
        <WeeklyPreview courses={plan.courses} />
      </div>
    </motion.div>
  );
}

function PlanSkeleton() {
  const sk = 'animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]';
  return (
    <div className="flex gap-4">
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-[var(--color-neutral-100)]" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className={cn('h-6 w-48 rounded-lg bg-[var(--color-neutral-100)]', sk)} />
            <div className={cn('h-6 w-20 rounded-lg bg-[var(--color-neutral-100)]', sk)} />
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--color-neutral-100)]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className={cn('h-5 w-16 rounded-lg bg-[var(--color-neutral-100)]', sk)} />
              <div className={cn('h-4 flex-1 rounded bg-[var(--color-neutral-100)]', sk)} />
              <div className={cn('h-4 w-12 rounded bg-[var(--color-neutral-100)]', sk)} />
            </div>
          ))}
          <div className="h-2 w-full rounded-full bg-[var(--color-neutral-100)]" />
          <div className="rounded-xl bg-[var(--color-neutral-50)] p-4">
            <div className="flex gap-3">
              <div className={cn('w-8 h-8 rounded-lg bg-[var(--color-neutral-100)] shrink-0', sk)} />
              <div className="flex-1 space-y-2">
                <div className={cn('h-4 w-full rounded bg-[var(--color-neutral-100)]', sk)} />
                <div className={cn('h-4 w-2/3 rounded bg-[var(--color-neutral-100)]', sk)} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-52 shrink-0 hidden xl:block">
        <div className="glass-panel rounded-xl p-4 space-y-2">
          <div className={cn('h-3 w-20 rounded bg-[var(--color-neutral-100)]', sk)} />
          <div className="grid grid-cols-[30px_repeat(5,1fr)] gap-1.5">
            <div />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className={cn('h-3 rounded bg-[var(--color-neutral-100)]', sk)} />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[30px_repeat(5,1fr)] gap-1.5">
              <div className={cn('aspect-square w-4 rounded bg-[var(--color-neutral-100)]', sk)} />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className={cn('aspect-square rounded-lg bg-[var(--color-neutral-100)]', sk)} />
              ))}
            </div>
          ))}
          <div className="pt-2 space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-[3px] bg-[var(--color-neutral-100)]', sk)} />
                <div className={cn('h-2.5 w-14 rounded bg-[var(--color-neutral-100)]', sk)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-cardinal)]/8 mb-5"
        >
          <Sparkles className="w-8 h-8 text-[var(--color-brand-cardinal)]" />
        </motion.div>
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mb-2">
          Generate Your Semester Plan
        </h3>
        <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] max-w-sm leading-relaxed">
          Set your preferences in the panel and let AI create personalized semester plans optimized for your academic profile and goals.
        </p>
      </div>
    </motion.div>
  );
}

function ParametersPanel({
  params,
  onChange,
  onGenerate,
  loading,
}: {
  params: PlanParams;
  onChange: (p: Partial<PlanParams>) => void;
  onGenerate: () => void;
  loading: boolean;
}) {
  const toggleTimePref = (pref: string) => {
    const current = params.timePreferences;
    onChange({
      timePreferences: current.includes(pref)
        ? current.filter((t) => t !== pref)
        : [...current, pref],
    });
  };

  const selectClass =
    'w-full h-[var(--input-h-md)] px-3 rounded-xl border border-[var(--color-border-default)] bg-white/80 text-[var(--text-sm)] text-[var(--color-neutral-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-cardinal)]/20 focus:border-[var(--color-brand-cardinal)] transition-all appearance-none cursor-pointer';

  return (
    <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden lg:sticky lg:top-24">
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border-default)]">
        <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Plan Parameters</h2>
      </div>
      <div className="p-5 space-y-5">
        {/* Major */}
        <div>
          <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Major</label>
          <select
            value={params.major}
            onChange={(e) => onChange({ major: e.target.value })}
            className={selectClass}
          >
            <option>Human-Computer Interaction</option>
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Semester</label>
          <select
            value={params.semester}
            onChange={(e) => onChange({ semester: e.target.value })}
            className={selectClass}
          >
            <option>Fall 2026</option>
            <option>Spring 2027</option>
          </select>
        </div>

        {/* Credit Preference */}
        <div>
          <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] mb-2 block">Credit Preference</label>
          <div className="flex gap-2">
            {[6, 9, 12, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ targetCredits: n })}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[var(--text-sm)] font-semibold transition-all duration-200',
                  params.targetCredits === n
                    ? 'bg-[var(--color-brand-cardinal)] text-white shadow-sm'
                    : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Tolerance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)]">Difficulty Tolerance</label>
            <span className="text-[var(--text-xs)] font-bold text-[var(--color-neutral-700)] tabular-nums">{params.difficultyTolerance} / 5</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ difficultyTolerance: n })}
                className={cn(
                  'flex-1 h-2.5 rounded-full transition-all duration-200 cursor-pointer',
                  n <= params.difficultyTolerance
                    ? params.difficultyTolerance <= 2
                      ? 'bg-[var(--color-success)]'
                      : params.difficultyTolerance <= 3
                        ? 'bg-[var(--color-warning)]'
                        : 'bg-[var(--color-error)]'
                    : 'bg-[var(--color-neutral-100)]',
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] font-medium text-[var(--color-neutral-400)]">Easy</span>
            <span className="text-[9px] font-medium text-[var(--color-neutral-400)]">Moderate</span>
            <span className="text-[9px] font-medium text-[var(--color-neutral-400)]">Challenging</span>
          </div>
        </div>

        {/* Time of Day Preference */}
        <div>
          <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] mb-2 block">Time of Day Preference</label>
          <div className="space-y-2">
            {[
              { id: 'morning', label: 'Morning (8am – 12pm)', icon: Sun },
              { id: 'afternoon', label: 'Afternoon (12pm – 5pm)', icon: Sunset },
              { id: 'evening', label: 'Evening (5pm – 8pm)', icon: Moon },
            ].map(({ id, label, icon: Icon }) => (
              <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    params.timePreferences.includes(id)
                      ? 'bg-[var(--color-brand-cardinal)] border-[var(--color-brand-cardinal)]'
                      : 'border-[var(--color-neutral-300)] group-hover:border-[var(--color-neutral-400)]',
                  )}
                >
                  {params.timePreferences.includes(id) && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                <Icon className="w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
                <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)]">{label}</span>
                <input
                  type="checkbox"
                  checked={params.timePreferences.includes(id)}
                  onChange={() => toggleTimePref(id)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Additional Preferences */}
        <div>
          <label className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] mb-2 block">Additional Preferences</label>
          <div className="space-y-2">
            {([
              { key: 'avoidBackToBack', label: 'Avoid back-to-back classes' },
              { key: 'balanceMix', label: 'Balance core + elective mix' },
              { key: 'lighterFridays', label: 'Lighter Fridays' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    params[key]
                      ? 'bg-[var(--color-brand-cardinal)] border-[var(--color-brand-cardinal)]'
                      : 'border-[var(--color-neutral-300)] group-hover:border-[var(--color-neutral-400)]',
                  )}
                >
                  {params[key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)]">{label}</span>
                <input
                  type="checkbox"
                  checked={params[key]}
                  onChange={() => onChange({ [key]: !params[key] })}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Generate */}
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Plans
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function AIPlannerPage() {
  const [params, setParams] = useState<PlanParams>(DEFAULT_PARAMS);
  const [plans, setPlans] = useState<GeneratedPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleChange = useCallback((partial: Partial<PlanParams>) => {
    setParams((p) => ({ ...p, ...partial }));
  }, []);

  const generatePlans = useCallback(async () => {
    setLoading(true);
    setGenerated(true);
    setIsAI(false);

    try {
      const data = await apiFetch<{ ok: true; plans: AIPlanResponse[] }>(
        '/api/ai/generate-plans',
        {
          method: 'POST',
          json: {
            ...params,
            completedCourses: COMPLETED_COURSES,
            inProgressCourses: IN_PROGRESS_COURSES,
          },
        },
      );

      if (data.plans?.length > 0) {
        const enriched = data.plans
          .map((p, i) => enrichAIPlan(p, i))
          .filter((p) => p.courses.length > 0);
        if (enriched.length > 0) {
          setPlans(enriched);
          setIsAI(true);
        } else {
          setPlans(buildFallbackPlans(params.targetCredits));
        }
      } else {
        setPlans(buildFallbackPlans(params.targetCredits));
      }
    } catch {
      setPlans(buildFallbackPlans(params.targetCredits));
    } finally {
      setLoading(false);
    }
  }, [params]);

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 px-1"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/10">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
          </div>
          <div>
            <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)]">AI Semester Plan Builder</h1>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
              Let AI create a personalized semester plan based on your academic profile.
            </p>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Parameters */}
          <div className="lg:col-span-3">
            <ParametersPanel
              params={params}
              onChange={handleChange}
              onGenerate={generatePlans}
              loading={loading}
            />
          </div>

          {/* Plans */}
          <div className="lg:col-span-9 space-y-5">
            {!generated ? (
              <EmptyState />
            ) : loading ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-cardinal)]/10 mb-4"
                  >
                    <Sparkles className="w-7 h-7 text-[var(--color-brand-cardinal)]" />
                  </motion.div>
                  <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mb-1.5">
                    Generating your personalized plan
                  </h3>
                  <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] max-w-xs">
                    Analyzing your preferences and academic profile to build optimized semester plans...
                  </p>
                </motion.div>
                {Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)}
              </>
            ) : (
              <>
                {/* Plans header */}
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-cardinal)]/10">
                      <Sparkles className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[var(--text-md)] font-semibold text-[var(--color-neutral-900)]">Generated Plans</h2>
                      {isAI && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] text-[9px] font-bold uppercase tracking-wider">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    onClick={generatePlans}
                    disabled={loading}
                    aria-label="Regenerate plans"
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                  </motion.button>
                </motion.div>

                {/* Fallback notice */}
                {!isAI && (
                  <motion.div
                    variants={fadeUp}
                    className="rounded-xl bg-[var(--color-info-light)] px-4 py-3 flex items-center gap-2.5"
                  >
                    <Info className="w-4 h-4 text-[var(--color-info)] shrink-0" />
                    <p className="text-[var(--text-sm)] text-[var(--color-info)]">
                      Showing sample plans. Connect to AI for personalized recommendations.
                    </p>
                  </motion.div>
                )}

                {/* Plan cards */}
                {plans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i} />
                ))}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
