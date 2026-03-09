import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Header', text: 'Schedule Planner. Export. Share with Advisor.' },
  { section: 'Status', text: 'Schedule Status. No time conflicts. Prerequisites. All Met. Not Met.' },
  { section: 'Graduation', text: 'Graduation Requirements. Schedule Summary. Total Courses. Total Credits. Average Workload.' },
];
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  SEMESTERS,
  DAYS,
  HOURS,
  formatHourAmPm,
  getWorkloadConfig,
  detectTimeConflicts,
  getPrerequisiteStatuses,
  getGraduationRequirements,
  type ScheduledCourse,
  type WorkloadLevel,
} from './data';

function CourseBlock({
  course,
  hoveredId,
  onHover,
}: React.PropsWithChildren<{
  course: ScheduledCourse;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}>) {
  const startOffset = (course.startHour - 8) * 64 + (course.startMin / 60) * 64;
  const duration = (course.endHour - course.startHour) * 60 + (course.endMin - course.startMin);
  const height = (duration / 60) * 64;
  const isHovered = hoveredId === course.id;
  const isFaded = hoveredId !== null && hoveredId !== course.id;

  return (
    <motion.div
      tabIndex={0}
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: isFaded ? 0.35 : 1,
        scale: 1,
        filter: isFaded ? 'blur(1px)' : 'blur(0px)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={() => onHover(course.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(course.id)}
      onBlur={() => onHover(null)}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-1 cursor-pointer overflow-hidden group/block',
        'transition-shadow duration-200',
        isHovered ? 'shadow-md z-20' : 'z-10',
      )}
      style={{
        top: startOffset,
        height: Math.max(height, 36),
        borderLeftColor: course.color,
        backgroundColor: `color-mix(in srgb, ${course.color} 6%, white)`,
      }}
    >
      <p
        className="text-[10px] font-bold leading-tight truncate"
        style={{ color: course.color }}
      >
        {course.code}
      </p>
      {height >= 50 && (
        <p className="text-[10px] font-medium text-[var(--color-neutral-600)] truncate leading-tight mt-0.5">
          {course.name}
        </p>
      )}
      {height >= 70 && (
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-[var(--color-neutral-400)] flex-shrink-0" />
          <span className="text-[9px] text-[var(--color-neutral-400)] truncate">
            {course.location}
          </span>
        </div>
      )}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 -bottom-px px-1.5 py-1 rounded-b-md"
            style={{
              backgroundColor: `color-mix(in srgb, ${course.color} 10%, white)`,
            }}
          >
            <p className="text-[9px] text-[var(--color-neutral-500)] truncate">
              {course.instructor}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WeekCalendar({ courses }: { courses: ScheduledCourse[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  const coursesByDay = useMemo(() => {
    const map: Record<string, ScheduledCourse[]> = {};
    for (const day of DAYS) {
      map[day] = courses.filter((c) => c.days.includes(day));
    }
    return map;
  }, [courses]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(5,1fr)] border-b border-[var(--color-border-default)]/50">
        <div className="h-10" />
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-500)] uppercase tracking-widest border-l border-[var(--color-border-default)]/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[52px_repeat(5,1fr)] relative">
        {/* Hour labels */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-16 flex items-start justify-end pr-2.5 pt-0"
            >
              <span className="text-[10px] font-medium text-[var(--color-neutral-400)] -translate-y-1.5 tabular-nums whitespace-nowrap">
                {formatHourAmPm(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="relative border-l border-[var(--color-border-default)]/30"
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-[var(--color-border-default)]/20"
              />
            ))}

            {coursesByDay[day]?.map((course) => (
              <CourseBlock
                key={course.id}
                course={course}
                hoveredId={hoveredId}
                onHover={handleHover}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Workload legend */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[var(--color-border-default)]/50">
        <span className="text-[10px] font-medium text-[var(--color-neutral-400)] uppercase tracking-wider">
          Workload
        </span>
        {(['low', 'moderate', 'high'] as WorkloadLevel[]).map((level) => {
          const cfg = getWorkloadConfig(level);
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-[3px] border', cfg.bg, cfg.border)} />
              <span className="text-[10px] font-medium text-[var(--color-neutral-500)]">
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleStatusPanel({
  courses,
}: {
  courses: ScheduledCourse[];
}) {
  const conflicts = useMemo(() => detectTimeConflicts(courses), [courses]);
  const prereqStatuses = useMemo(() => getPrerequisiteStatuses(courses), [courses]);
  const unmetPrereqs = prereqStatuses.filter((p) => !p.met);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-1.5 flex items-center gap-2">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">
          Schedule Status
        </h3>
      </div>
      <div className="px-4 pb-4 space-y-1">
        <div className="flex items-center gap-2 py-1.5">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            conflicts.length === 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]',
          )} />
          <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)]">
            {conflicts.length === 0
              ? 'No time conflicts'
              : `${conflicts.length} time conflict${conflicts.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {conflicts.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 pl-4 py-1"
          >
            <div>
              <p className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)]">
                {c.courseA} & {c.courseB}
              </p>
              <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                {c.day} {c.overlapStart} – {c.overlapEnd}
              </p>
            </div>
          </motion.div>
        ))}

        {unmetPrereqs.map((p, i) => (
          <motion.div
            key={`${p.courseCode}-${p.prerequisite}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex items-center gap-2 py-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] flex-shrink-0" />
            <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)]">
              <span className="font-medium text-[var(--color-neutral-700)]">{p.courseCode}</span>
              {' '}requires {p.prerequisite}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PrerequisitesPanel({ courses }: { courses: ScheduledCourse[] }) {
  const prereqStatuses = useMemo(() => getPrerequisiteStatuses(courses), [courses]);
  const allMet = prereqStatuses.every((p) => p.met);

  if (prereqStatuses.length === 0) {
    return (
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-1.5">
          <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">
            Prerequisites
          </h3>
        </div>
        <div className="px-4 pb-4">
          <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            No prerequisites for this semester
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">
          Prerequisites
        </h3>
        <span
          className={cn(
            'text-[var(--text-2xs)] font-semibold',
            allMet ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
          )}
        >
          {allMet ? 'All Met' : 'Not Met'}
        </span>
      </div>
      <div className="px-4 pb-4 space-y-0.5">
        {prereqStatuses.map((p) => (
          <div
            key={`${p.courseCode}-${p.prerequisite}`}
            className="flex items-center justify-between py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                p.met ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]',
              )} />
              <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)] truncate">
                {p.prerequisite}
              </span>
            </div>
            <span className="text-[var(--text-xs)] text-[var(--color-neutral-400)] whitespace-nowrap ml-2">
              for {p.courseCode}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraduationPanel() {
  const requirements = useMemo(
    () => getGraduationRequirements(SEMESTERS),
    [],
  );

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-1.5">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">
          Graduation Requirements
        </h3>
      </div>
      <div className="px-4 pb-4 space-y-3">
        {requirements.map((req, i) => {
          const pct = Math.round((req.current / req.required) * 100);
          return (
            <div key={req.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-600)]">
                  {req.label}
                </span>
                <span className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-700)] tabular-nums">
                  {req.complete ? (
                    <span className="flex items-center gap-1 text-[var(--color-neutral-500)]">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  ) : (
                    `${req.current}/${req.required}`
                  )}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-neutral-300)]"
                  style={{
                    backgroundColor: req.complete
                      ? 'var(--color-neutral-400)'
                      : 'var(--color-brand-cardinal)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.3 + i * 0.1,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleSummaryPanel({ courses }: { courses: ScheduledCourse[] }) {
  const totalCourses = courses.length;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  const avgWorkload = useMemo(() => {
    if (courses.length === 0) return 'N/A';
    const map: Record<WorkloadLevel, number> = { low: 1, moderate: 2, high: 3 };
    const avg = courses.reduce((sum, c) => sum + map[c.workload], 0) / courses.length;
    if (avg <= 1.5) return 'Low';
    if (avg <= 2.5) return 'Moderate';
    return 'High';
  }, [courses]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-1.5">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">
          Schedule Summary
        </h3>
      </div>
      <div className="px-4 pb-4 space-y-0.5">
        {[
          { label: 'Total Courses', value: totalCourses.toString() },
          { label: 'Total Credits', value: totalCredits.toString() },
          { label: 'Avg Workload', value: avgWorkload },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5"
          >
            <span className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
              {label}
            </span>
            <span className="text-[var(--text-base)] font-bold text-[var(--color-neutral-800)] tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchedulePlanner() {
  const [semesterIndex, setSemesterIndex] = useState(0);

  const semester = SEMESTERS[semesterIndex];
  const canPrev = semesterIndex > 0;
  const canNext = semesterIndex < SEMESTERS.length - 1;

  const goNext = useCallback(() => {
    setSemesterIndex((i) => Math.min(i + 1, SEMESTERS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setSemesterIndex((i) => Math.max(i - 1, 0));
  }, []);

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-5"
      >
        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-[var(--text-2xl)] font-bold tracking-tight text-[var(--color-brand-dark)]">
              Schedule Planner
            </h1>

            {/* Semester nav */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={goPrev}
                disabled={!canPrev}
                aria-label="Previous semester"
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  canPrev
                    ? 'hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] cursor-pointer'
                    : 'text-[var(--color-neutral-200)] cursor-not-allowed',
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">
                <motion.span
                  key={semester.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--text-base)] font-semibold text-[var(--color-brand-cardinal)] min-w-[120px] text-center"
                >
                  {semester.label}
                </motion.span>
              </AnimatePresence>

              <button
                onClick={goNext}
                disabled={!canNext}
                aria-label="Next semester"
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  canNext
                    ? 'hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] cursor-pointer'
                    : 'text-[var(--color-neutral-200)] cursor-not-allowed',
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button variant="primary" size="sm">
              <Share2 className="w-3.5 h-3.5" />
              Share with Advisor
            </Button>
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          {/* Calendar */}
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={semester.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <WeekCalendar courses={semester.courses} />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Right sidebar */}
          <motion.div variants={fadeUp} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`sidebar-${semester.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-4"
              >
                <ScheduleStatusPanel courses={semester.courses} />
                <PrerequisitesPanel courses={semester.courses} />
                <GraduationPanel />
                <ScheduleSummaryPanel courses={semester.courses} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
