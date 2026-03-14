import { useState, useMemo, useRef, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Header', text: 'Course Catalog. Browse courses across all departments.' },
  { section: 'Filters', text: 'Filter courses. Best Match. Highest Rated. Lowest Workload. Most Popular. Max Workload. Min Rating.' },
  { section: 'Categories', text: 'Design Core. Implementation Core. Phenomena Core. Evaluation Core. Elective.' },
  { section: 'My Courses', text: 'My Courses. View your enrolled and registered courses.', route: '/catalog?view=my' },
  { section: 'Saved Courses', text: 'Saved Courses. Courses you bookmarked for later.', route: '/catalog?view=saved' },
];
import {
  SlidersHorizontal,
  X,
  Star,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  Monitor,
  ArrowRight,
  Search as SearchIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  HCI_COURSES,
  DEPARTMENT_LIST,
  ALL_CATEGORIES,
  CATEGORY_CONFIG,
  courseLevel,
  getWorkload,
  getAvgRating,
  type Course,
  type CourseCategory,
} from './data';

const SEMESTER_OPTIONS = ['All Terms', 'Fall 2025', 'Spring 2026'] as const;
const TERM_MAP: Record<string, string> = {
  'Fall 2025': 'FALL 2025',
  'Spring 2026': 'SPRING 2026',
};

const SORT_OPTIONS = [
  { value: 'best-match', label: 'Best Match' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'lowest-workload', label: 'Lowest Workload' },
  { value: 'most-popular', label: 'Most Popular' },
] as const;

const LEVEL_OPTIONS = ['Graduate', 'Undergraduate'] as const;

/* ────────────────────────────────────────────────────────────
   Inline sub-components
   ──────────────────────────────────────────────────────────── */

function WorkloadDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[6px] h-[6px] rounded-full transition-colors',
            i < value
              ? 'bg-[var(--color-brand-cardinal)]'
              : 'bg-[var(--color-neutral-200)]',
          )}
        />
      ))}
    </div>
  );
}

const CatalogCard: FC<{
  course: Course;
  isSaved: boolean;
  onToggleSave: () => void;
  semester: string;
}> = ({ course, isSaved, onToggleSave, semester }) => {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[course.category];
  const workload = getWorkload(course);
  const avgRating = getAvgRating(course);
  const level = courseLevel(course.code);

  const mappedSemester = TERM_MAP[semester];
  const activeOffering = mappedSemester
    ? (course.offerings.find((o) => o.term === mappedSemester) ??
      course.offerings[0])
    : course.offerings[0];

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{
        y: -3,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className="glass-panel rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[var(--text-xs)] font-bold text-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal)]/8 px-2.5 py-1 rounded-lg">
              {course.code}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[var(--text-2xs)] font-semibold',
                config.bgClass,
                config.textClass,
              )}
            >
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {avgRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
                <span className="text-[var(--text-sm)] font-bold text-[var(--color-brand-dark)] tabular-nums">
                  {avgRating}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)]">
                WL
              </span>
              <WorkloadDots value={workload} />
            </div>
          </div>
        </div>

        <h3 className="mt-3 text-[var(--text-md)] font-bold text-[var(--color-brand-dark)] leading-snug">
          {course.name}
        </h3>

        <p className="mt-1 text-[var(--text-xs)] text-[var(--color-neutral-400)]">
          {course.credits} Credits &middot; {level}
          {activeOffering?.instructor && (
            <> &middot; {activeOffering.instructor}</>
          )}
        </p>

        <p className="mt-2.5 text-[var(--text-sm)] text-[var(--color-neutral-500)] leading-relaxed line-clamp-2">
          {course.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {course.offerings.map((o) => (
            <span
              key={o.term}
              className="rounded-md bg-[var(--color-neutral-50)] px-2 py-0.5 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-500)]"
            >
              {o.term}
            </span>
          ))}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[var(--text-2xs)] font-medium',
              course.delivery.includes('In-Person')
                ? 'bg-[var(--color-info-light)] text-[var(--color-info)]'
                : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)]',
            )}
          >
            {course.delivery.includes('In-Person') ? (
              <MapPin className="w-2.5 h-2.5" />
            ) : (
              <Monitor className="w-2.5 h-2.5" />
            )}
            {course.delivery}
          </span>
          {course.crossListed && (
            <span className="rounded-md bg-[var(--color-neutral-50)] px-2 py-0.5 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)]">
              +{course.crossListed}
            </span>
          )}
          {activeOffering?.wouldTakeAgain && (
            <span className="rounded-md bg-[var(--color-success-light)] px-2 py-0.5 text-[var(--text-2xs)] font-semibold text-[var(--color-success)]">
              {activeOffering.wouldTakeAgain} retake
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--color-border-default)]/30 pt-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--text-xs)] font-semibold transition-all duration-200',
              isSaved
                ? 'bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)]'
                : 'text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-600)]',
            )}
          >
            {isSaved ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
            {isSaved ? 'Saved' : 'Save'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/course/${course.id}`);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)] text-[var(--text-xs)] font-bold hover:bg-[var(--color-brand-cardinal)]/15 transition-colors"
          >
            View Details
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ────────────────────────────────────────────────────────────
   Main page
   ──────────────────────────────────────────────────────────── */

export default function CourseCatalog() {
  const [department, setDepartment] = useState('hci');
  const [level, setLevel] = useState<string>('Graduate');
  const [semester, setSemester] = useState<string>('All Terms');
  const [selectedCategories, setSelectedCategories] = useState<Set<CourseCategory>>(new Set());
  const [sortBy, setSortBy] = useState('best-match');
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const [textFilter, setTextFilter] = useState('');

  const sortRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortDropdown(false);
      if (deptRef.current && !deptRef.current.contains(e.target as Node))
        setShowDeptDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const courses = department === 'hci' ? HCI_COURSES : [];

  const filteredCourses = useMemo(() => {
    const result = courses.filter((c) => {
      if (level !== 'All' && courseLevel(c.code) !== level) return false;

      if (semester !== 'All Terms') {
        const mapped = TERM_MAP[semester];
        if (mapped && !c.offerings.some((o) => o.term === mapped)) return false;
      }

      if (maxWorkload < 5 && getWorkload(c) > maxWorkload) return false;

      const rating = getAvgRating(c);
      if (minRating > 0 && (rating === null || rating < minRating)) return false;

      if (selectedCategories.size > 0 && !selectedCategories.has(c.category)) return false;

      if (textFilter.trim()) {
        const q = textFilter.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.offerings.some((o) => o.instructor?.toLowerCase().includes(q))
        );
      }

      return true;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'highest-rated':
          return (getAvgRating(b) ?? 0) - (getAvgRating(a) ?? 0);
        case 'lowest-workload':
          return getWorkload(a) - getWorkload(b);
        case 'most-popular': {
          const rA = parseInt(a.offerings.find((o) => o.wouldTakeAgain)?.wouldTakeAgain ?? '0');
          const rB = parseInt(b.offerings.find((o) => o.wouldTakeAgain)?.wouldTakeAgain ?? '0');
          return rB - rA;
        }
        default:
          return 0;
      }
    });
  }, [courses, level, semester, maxWorkload, minRating, selectedCategories, textFilter, sortBy]);

  const toggleCategory = (cat: CourseCategory) =>
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const toggleSaved = (id: string) =>
    setSavedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetFilters = () => {
    setLevel('Graduate');
    setSemester('All Terms');
    setMaxWorkload(5);
    setMinRating(0);
    setSelectedCategories(new Set());
    setTextFilter('');
  };

  const hasActiveFilters =
    level !== 'Graduate' ||
    semester !== 'All Terms' ||
    maxWorkload < 5 ||
    minRating > 0 ||
    selectedCategories.size > 0 ||
    textFilter.trim() !== '';

  const hasAdvancedFilters = maxWorkload < 5 || minRating > 0;

  const activeDept = DEPARTMENT_LIST.find((d) => d.id === department);

  const categoryCounts = useMemo(() => {
    const base = courses.filter((c) => {
      if (level !== 'All' && courseLevel(c.code) !== level) return false;
      if (semester !== 'All Terms') {
        const mapped = TERM_MAP[semester];
        if (mapped && !c.offerings.some((o) => o.term === mapped)) return false;
      }
      return true;
    });
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = base.filter((c) => c.category === cat).length;
    });
    return counts;
  }, [courses, level, semester]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-6xl mx-auto"
      >
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-[var(--text-2xl)] font-bold tracking-tight text-[var(--color-brand-dark)]">
            Course Catalog
          </h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            Browse courses across all departments
          </p>
        </div>

        {/* ── Filter bar ─────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl mb-5 relative z-40">
          {/* Row 1: Department, text filter, level, semester, advanced toggle, sort */}
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
            {/* Department selector */}
            <div className="relative" ref={deptRef}>
              <button
                onClick={() => setShowDeptDropdown((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5',
                  'text-[var(--text-xs)] font-bold transition-all duration-200',
                  'border-[var(--color-border-default)] bg-white text-[var(--color-brand-dark)]',
                  'hover:border-[var(--color-border-hover)]',
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeDept?.accent }}
                />
                {activeDept?.code ?? 'Dept'}
                <ChevronDown className="h-3 w-3 text-[var(--color-neutral-400)]" />
              </button>
              <AnimatePresence>
                {showDeptDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 z-40 mt-1 w-60 rounded-xl border border-[var(--color-border-default)] bg-white py-1 shadow-[var(--shadow-dropdown)]"
                  >
                    {DEPARTMENT_LIST.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setDepartment(d.id); setShowDeptDropdown(false); }}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[var(--text-sm)] transition-colors',
                          department === d.id
                            ? 'bg-[var(--color-brand-cardinal-light)] text-[var(--color-brand-cardinal)] font-semibold'
                            : 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]',
                        )}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.accent }} />
                        <span className="font-bold shrink-0">{d.code}</span>
                        <span className="text-[var(--color-neutral-400)] text-[var(--text-xs)] truncate">{d.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-5 w-px bg-[var(--color-border-default)]" />

            {/* Text filter */}
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
              <input
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder="Filter courses..."
                className="h-8 w-[160px] rounded-lg border border-[var(--color-border-default)] bg-white pl-8 pr-7 text-[var(--text-xs)] text-[var(--color-neutral-800)] placeholder:text-[var(--color-neutral-400)] transition-colors focus:border-[var(--color-neutral-400)] focus:outline-none"
              />
              {textFilter && (
                <button
                  onClick={() => setTextFilter('')}
                  className="absolute right-2 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-[var(--color-border-default)]" />

            {/* Level toggle */}
            <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-default)]">
              {LEVEL_OPTIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(level === l ? 'All' : l)}
                  className={cn(
                    'px-3.5 py-1.5 text-[var(--text-xs)] font-medium transition-all duration-200',
                    level === l
                      ? 'bg-[var(--color-brand-dark)] text-white'
                      : 'bg-white text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Semester pills */}
            <div className="flex items-center gap-1">
              {SEMESTER_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[var(--text-xs)] font-medium transition-all duration-200',
                    semester === s
                      ? 'bg-[var(--color-neutral-100)] text-[var(--color-brand-dark)] font-semibold'
                      : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-[var(--color-border-default)]" />

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                'text-[var(--text-xs)] font-medium transition-all duration-200',
                showAdvanced || hasAdvancedFilters
                  ? 'border-[var(--color-brand-dark)] bg-[var(--color-brand-dark)] text-white'
                  : 'border-[var(--color-border-default)] bg-white text-[var(--color-neutral-500)] hover:border-[var(--color-border-hover)]',
              )}
            >
              <SlidersHorizontal className="h-3 w-3" />
              More
              {hasAdvancedFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[var(--color-brand-dark)]">
                  {(maxWorkload < 5 ? 1 : 0) + (minRating > 0 ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative ml-auto" ref={sortRef}>
              <button
                onClick={() => setShowSortDropdown((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-white text-[var(--text-xs)] font-semibold text-[var(--color-neutral-600)] hover:border-[var(--color-border-hover)] transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </span>
              </button>
              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute right-0 z-30 mt-1.5 w-48 rounded-xl border border-[var(--color-border-default)] bg-white py-1 shadow-[var(--shadow-dropdown)]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-[var(--text-sm)] transition-colors',
                          sortBy === opt.value
                            ? 'bg-[var(--color-brand-cardinal-light)] text-[var(--color-brand-cardinal)] font-semibold'
                            : 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Advanced filters drawer */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[var(--color-border-default)]"
              >
                <div className="flex flex-wrap items-center gap-6 px-4 py-3">
                  {/* Workload */}
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-2xs)] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">
                      Max Workload
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setMaxWorkload(n)}
                          className={cn(
                            'w-7 h-7 rounded-lg text-[var(--text-xs)] font-semibold transition-all duration-200',
                            n <= maxWorkload
                              ? 'bg-[var(--color-brand-cardinal)]/10 text-[var(--color-brand-cardinal)]'
                              : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-300)]',
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-5 w-px bg-[var(--color-border-default)]" />

                  {/* Rating */}
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-2xs)] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">
                      Min Rating
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { value: 0, label: 'Any' },
                        { value: 3, label: '≥ 3.0' },
                        { value: 4, label: '≥ 4.0' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMinRating(opt.value)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-[var(--text-xs)] font-semibold transition-all duration-200',
                            minRating === opt.value
                              ? 'bg-[var(--color-brand-cardinal)] text-white'
                              : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasAdvancedFilters && (
                    <>
                      <div className="h-5 w-px bg-[var(--color-border-default)]" />
                      <button
                        onClick={() => { setMaxWorkload(5); setMinRating(0); }}
                        className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-medium text-[var(--color-brand-cardinal)]"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border-default)] px-4 py-2.5">
            {ALL_CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = categoryCounts[cat] ?? 0;
              const active = selectedCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[var(--text-2xs)] font-semibold transition-all duration-200',
                    active
                      ? cn(config.bgClass, config.textClass)
                      : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
                  )}
                >
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', active && 'ring-2 ring-current/20')}
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                  <span className={cn('tabular-nums', active ? 'opacity-60' : 'text-[var(--color-neutral-400)]')}>
                    {count}
                  </span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-[var(--color-brand-cardinal)]"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Results header ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
            Showing{' '}
            <span className="font-bold text-[var(--color-brand-dark)]">
              {filteredCourses.length}
            </span>{' '}
            {filteredCourses.length === 1 ? 'course' : 'courses'}
          </p>
          <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] bg-[var(--color-neutral-100)] px-2 py-0.5 rounded-full select-none">
            WL — Workload
          </span>
        </div>

        {/* ── Course cards — grid ─────────────────────────── */}
        {filteredCourses.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
          >
            {filteredCourses.map((course) => (
              <CatalogCard
                key={course.id}
                course={course}
                isSaved={savedCourses.has(course.id)}
                onToggleSave={() => toggleSaved(course.id)}
                semester={semester}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-12 flex flex-col items-center text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-cardinal)]/6 flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-[var(--color-brand-cardinal)]" />
            </div>
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-brand-dark)]">
              No courses found
            </h3>
            <p className="mt-1.5 text-[var(--text-sm)] text-[var(--color-neutral-400)] max-w-sm">
              {department !== 'hci'
                ? `Course data for ${DEPARTMENT_LIST.find((d) => d.id === department)?.name ?? department} is coming soon.`
                : 'Try adjusting your filters or search query to find what you\'re looking for.'}
            </p>
            {hasActiveFilters && department === 'hci' && (
              <button
                onClick={resetFilters}
                className="mt-4 px-5 py-2 rounded-xl bg-[var(--color-brand-cardinal)] text-white text-[var(--text-sm)] font-semibold shadow-sm hover:bg-[var(--color-brand-cardinal-hover)] transition-colors"
              >
                Reset Filters
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
