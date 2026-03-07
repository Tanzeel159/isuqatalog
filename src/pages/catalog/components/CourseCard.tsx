import type { FC } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, MapPin, Monitor, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '../data';
import { CATEGORY_CONFIG } from '../data';

interface CourseCardProps {
  course: Course;
  index: number;
  activeSemester: string;
}

export const CourseCard: FC<CourseCardProps> = ({ course, index, activeSemester }) => {
  const config = CATEGORY_CONFIG[course.category];
  const [deptCode, courseNum] = course.code.split(/\s+/);

  const activeOffering =
    activeSemester === 'ALL'
      ? course.offerings[0]
      : course.offerings.find((o) => o.term === activeSemester) ?? course.offerings[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-t-[3px]',
        'glass-panel',
        'transition-all duration-200',
        'hover:shadow-lg',
      )}
      style={{ borderTopColor: config.color }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[var(--text-2xs)] font-semibold',
            config.bgClass, config.textClass,
          )}>
            {config.label}
          </span>
          <span className="text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)]">
            {course.credits} credits
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[var(--text-base)] font-bold tracking-tight text-[var(--color-brand-dark)]">
            {deptCode}
          </span>
          <ChevronRight className="h-3.5 w-3.5 self-center text-[var(--color-neutral-300)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-neutral-500)]" />
        </div>
        <span className="text-[var(--text-2xl)] font-extrabold leading-none tracking-tight text-[var(--color-brand-dark)]">
          {courseNum}
        </span>

        <h3 className="mt-2 text-[var(--text-sm)] font-semibold leading-snug text-[var(--color-neutral-700)]">
          {course.name}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[var(--text-xs)] leading-relaxed text-[var(--color-neutral-400)]">
          {course.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[var(--text-2xs)] font-medium',
            course.delivery.includes('In-Person')
              ? 'bg-[var(--color-info-light)] text-[var(--color-info)]'
              : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)]',
          )}>
            {course.delivery.includes('In-Person') ? <MapPin className="h-2.5 w-2.5" /> : <Monitor className="h-2.5 w-2.5" />}
            {course.delivery}
          </span>
          {course.crossListed && (
            <span className="rounded-md bg-[var(--color-neutral-50)] px-1.5 py-0.5 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)]">
              +{course.crossListed}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div className="mt-4 border-t border-[var(--color-border-default)]/50 pt-3">
          {activeOffering?.instructor ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="truncate text-[var(--text-xs)] font-medium text-[var(--color-neutral-600)]">
                  {activeOffering.instructor}
                </span>
              </div>
              {activeOffering.rating != null && (
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-3 w-3 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
                  <span className="text-[var(--text-xs)] font-semibold text-[var(--color-brand-dark)]">
                    {activeOffering.rating}/5
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-xs)] italic text-[var(--color-neutral-400)]">Instructor TBA</p>
          )}

          <div className="mt-1.5 flex items-center gap-2">
            {course.offerings.map((o) => (
              <span
                key={o.term}
                className={cn(
                  'text-[var(--text-2xs)] font-medium',
                  activeSemester !== 'ALL' && activeSemester === o.term
                    ? 'text-[var(--color-brand-dark)]'
                    : 'text-[var(--color-neutral-400)]',
                )}
              >
                {o.term}
              </span>
            ))}
            {activeOffering?.wouldTakeAgain && (
              <>
                <span className="text-[var(--color-neutral-200)]">|</span>
                <span className="text-[var(--text-2xs)] font-medium text-[var(--color-success)]">
                  {activeOffering.wouldTakeAgain} retake
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
