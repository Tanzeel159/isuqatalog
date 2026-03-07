import { useState, useMemo, useRef, useEffect, useCallback, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
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
  Loader2,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { apiFetch } from '@/lib/api';
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

/* ────────────────────────────────────────────────────────────
   Inline sub-components
   ──────────────────────────────────────────────────────────── */

const Checkbox: FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string;
}> = ({ checked, onChange, label, color }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2.5 cursor-pointer group w-full text-left py-1"
    >
      <div
        className={cn(
          'w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-200 shrink-0',
          checked
            ? 'bg-[var(--color-brand-cardinal)] border-[var(--color-brand-cardinal)]'
            : 'border-[var(--color-neutral-300)] group-hover:border-[var(--color-neutral-400)]',
        )}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 6l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {color && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-600)]">
          {label}
        </span>
      </div>
    </button>
  );
}

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
        {/* Top: code + category + rating + workload */}
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

        {/* Course name */}
        <h3 className="mt-3 text-[var(--text-md)] font-bold text-[var(--color-brand-dark)] leading-snug">
          {course.name}
        </h3>

        {/* Meta line */}
        <p className="mt-1 text-[var(--text-xs)] text-[var(--color-neutral-400)]">
          {course.credits} Credits &middot; {level}
          {activeOffering?.instructor && (
            <> &middot; {activeOffering.instructor}</>
          )}
        </p>

        {/* Description */}
        <p className="mt-2.5 text-[var(--text-sm)] text-[var(--color-neutral-500)] leading-relaxed line-clamp-2">
          {course.description}
        </p>

        {/* Tags */}
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

        {/* Actions */}
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
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--color-brand-cardinal)] text-white text-[var(--text-xs)] font-bold shadow-sm hover:bg-[var(--color-brand-cardinal-hover)] transition-colors"
          >
            View Details
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main page
   ──────────────────────────────────────────────────────────── */

export default function CourseCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('hci');
  const [levels, setLevels] = useState({
    Undergraduate: false,
    Graduate: true,
    Certificate: false,
  });
  const [semester, setSemester] = useState<string>('All Terms');
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<
    Set<CourseCategory>
  >(new Set());
  const [sortBy, setSortBy] = useState('best-match');
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiMatchedCodes, setAiMatchedCodes] = useState<Set<string> | null>(null);
  const [aiSummary, setAiSummary] = useState('');

  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerAISearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q || aiSearchLoading) return;
    setAiSearchLoading(true);
    setAiSummary('');
    try {
      const data = await apiFetch<{ ok: true; courses: string[]; summary: string }>(
        '/api/ai/search',
        { method: 'POST', json: { query: q } },
      );
      if (data.courses.length > 0) {
        const codeSet = new Set(data.courses.map((c) => c.toLowerCase().replace(/\s+/g, '')));
        setAiMatchedCodes(codeSet);
        setAiSummary(data.summary);
      } else {
        setAiMatchedCodes(new Set());
        setAiSummary(data.summary || 'No courses matched your search.');
      }
    } catch {
      setAiMatchedCodes(null);
      setAiSummary('');
    } finally {
      setAiSearchLoading(false);
    }
  }, [searchQuery, aiSearchLoading]);

  const clearAISearch = useCallback(() => {
    setAiMatchedCodes(null);
    setAiSummary('');
    setSearchQuery('');
  }, []);

  const courses = department === 'hci' ? HCI_COURSES : [];

  const filteredCourses = useMemo(() => {
    const result = courses.filter((c) => {
      // If AI search is active, use AI results as primary filter
      if (aiMatchedCodes !== null) {
        const normalizedCode = c.code.toLowerCase().replace(/\s+/g, '');
        return aiMatchedCodes.has(normalizedCode);
      }

      const lvl = courseLevel(c.code);
      const anyLevel = !levels.Undergraduate && !levels.Graduate;
      if (!anyLevel) {
        if (lvl === 'Undergraduate' && !levels.Undergraduate) return false;
        if (lvl === 'Graduate' && !levels.Graduate) return false;
      }

      if (semester !== 'All Terms') {
        const mapped = TERM_MAP[semester];
        if (mapped && !c.offerings.some((o) => o.term === mapped)) return false;
      }

      if (getWorkload(c) > maxWorkload) return false;

      const rating = getAvgRating(c);
      if (minRating > 0 && (rating === null || rating < minRating))
        return false;

      if (selectedCategories.size > 0 && !selectedCategories.has(c.category))
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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
          const rA = parseInt(
            a.offerings.find((o) => o.wouldTakeAgain)?.wouldTakeAgain ?? '0',
          );
          const rB = parseInt(
            b.offerings.find((o) => o.wouldTakeAgain)?.wouldTakeAgain ?? '0',
          );
          return rB - rA;
        }
        default:
          return 0;
      }
    });
  }, [
    courses,
    levels,
    semester,
    maxWorkload,
    minRating,
    selectedCategories,
    searchQuery,
    sortBy,
    aiMatchedCodes,
  ]);

  const toggleLevel = (level: string) =>
    setLevels((p) => ({
      ...p,
      [level]: !p[level as keyof typeof p],
    }));

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
    setLevels({ Undergraduate: false, Graduate: true, Certificate: false });
    setSemester('All Terms');
    setMaxWorkload(5);
    setMinRating(0);
    setSelectedCategories(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters =
    levels.Undergraduate ||
    levels.Certificate ||
    semester !== 'All Terms' ||
    maxWorkload < 5 ||
    minRating > 0 ||
    selectedCategories.size > 0 ||
    searchQuery.trim() !== '';

  const sliderProgress = ((maxWorkload - 1) / 4) * 100;

  /* ── Filter panel (shared between desktop sidebar + mobile drawer) ── */
  const filterPanel = (
    <div className="space-y-6">
      {/* Department */}
      <div>
        <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)] mb-2.5">
          Department
        </h3>
        <div className="relative">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Department"
            className={cn(
              'w-full h-[var(--input-h-md)] rounded-xl border border-[var(--color-border-default)] bg-white px-3 pr-9',
              'text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]',
              'focus:outline-none focus:border-[var(--color-brand-cardinal)] focus:ring-2 focus:ring-[var(--color-brand-cardinal)]/10',
              'appearance-none cursor-pointer transition-all duration-200',
            )}
          >
            {DEPARTMENT_LIST.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)] pointer-events-none" />
        </div>
      </div>

      {/* Level */}
      <div>
        <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)] mb-2.5">
          Level
        </h3>
        <div className="space-y-1">
          {(['Undergraduate', 'Graduate', 'Certificate'] as const).map((l) => (
            <Checkbox
              key={l}
              checked={levels[l]}
              onChange={() => toggleLevel(l)}
              label={l}
            />
          ))}
        </div>
      </div>

      {/* Term */}
      <div>
        <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)] mb-2.5">
          Term
        </h3>
        <div className="relative">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            aria-label="Term"
            className={cn(
              'w-full h-[var(--input-h-md)] rounded-xl border border-[var(--color-border-default)] bg-white px-3 pr-9',
              'text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]',
              'focus:outline-none focus:border-[var(--color-brand-cardinal)] focus:ring-2 focus:ring-[var(--color-brand-cardinal)]/10',
              'appearance-none cursor-pointer transition-all duration-200',
            )}
          >
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)] pointer-events-none" />
        </div>
      </div>

      {/* Workload score */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)]">
            Workload Score
          </h3>
          <span className="text-[var(--text-xs)] font-bold text-[var(--color-brand-cardinal)] tabular-nums">
            1&ndash;{maxWorkload}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={maxWorkload}
          onChange={(e) => setMaxWorkload(Number(e.target.value))}
          aria-label="Maximum workload score (1 = easy, 5 = hard)"
          className="range-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--color-brand-cardinal) 0%, var(--color-brand-cardinal) ${sliderProgress}%, var(--color-neutral-200) ${sliderProgress}%, var(--color-neutral-200) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={cn(
                'text-[var(--text-2xs)] font-medium cursor-pointer transition-colors',
                n <= maxWorkload
                  ? 'text-[var(--color-brand-cardinal)]'
                  : 'text-[var(--color-neutral-300)]',
              )}
              onClick={() => setMaxWorkload(n)}
            >
              {n}
            </span>
          ))}
        </div>
        <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-1">
          1 = easy &middot; 5 = hard
        </p>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)] mb-2.5">
          Minimum Rating
        </h3>
        <div className="flex gap-2">
          {[
            { value: 0, label: 'Any' },
            { value: 3, label: '\u2265 3.0' },
            { value: 4, label: '\u2265 4.0' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMinRating(opt.value)}
              aria-pressed={minRating === opt.value}
              aria-label={`Minimum rating: ${opt.label}`}
              className={cn(
                'flex-1 py-2 rounded-xl text-[var(--text-xs)] font-semibold transition-all duration-200',
                minRating === opt.value
                  ? 'bg-[var(--color-brand-cardinal)] text-white shadow-sm'
                  : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)] mb-2.5">
          Category
        </h3>
        <div className="space-y-1">
          {ALL_CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <Checkbox
                key={cat}
                checked={selectedCategories.has(cat)}
                onChange={() => toggleCategory(cat)}
                label={config.label}
                color={config.color}
              />
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={resetFilters}
        disabled={!hasActiveFilters}
        className={cn(
          'w-full py-2.5 rounded-xl text-[var(--text-sm)] font-semibold transition-all duration-200',
          hasActiveFilters
            ? 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)]'
            : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-300)] cursor-not-allowed',
        )}
      >
        Reset Filters
      </motion.button>
    </div>
  );

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-7xl mx-auto"
      >
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[var(--text-2xl)] font-bold tracking-tight text-[var(--color-brand-dark)]">
            Course Catalog
          </h1>
          <p className="mt-1 text-[var(--text-base)] text-[var(--color-neutral-400)]">
            Browse courses across all departments
          </p>
        </div>

        {/* AI Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6"
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border bg-white/90 backdrop-blur-sm px-4',
              'border-[var(--color-border-default)]',
              'transition-all duration-200',
              'focus-within:border-[var(--color-brand-cardinal)] focus-within:ring-4 focus-within:ring-[var(--color-brand-cardinal)]/5 focus-within:shadow-[var(--shadow-card)]',
              'hover:border-[var(--color-border-hover)]',
            )}
          >
            <Sparkles className="w-5 h-5 text-[var(--color-brand-cardinal)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (aiMatchedCodes !== null) {
                  setAiMatchedCodes(null);
                  setAiSummary('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  triggerAISearch();
                }
              }}
              placeholder='AI Search — try "user research methods" or "python programming"'
              aria-label="AI Search — try user research methods or python programming"
              className="flex-1 h-[var(--input-h-lg)] bg-transparent text-[var(--text-sm)] placeholder:text-[var(--color-neutral-400)] focus:outline-none"
            />
            {(searchQuery || aiMatchedCodes !== null) && (
              <button
                onClick={clearAISearch}
                aria-label="Clear search"
                className="p-1 rounded-full hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={triggerAISearch}
              disabled={!searchQuery.trim() || aiSearchLoading}
              aria-label="AI Search"
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-[var(--text-xs)] font-bold shadow-sm transition-colors',
                searchQuery.trim() && !aiSearchLoading
                  ? 'bg-[var(--color-brand-cardinal)] text-white hover:bg-[var(--color-brand-cardinal-hover)]'
                  : 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-400)] cursor-not-allowed',
              )}
            >
              {aiSearchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SearchIcon className="w-4 h-4" />
              )}
            </motion.button>
          </div>

          {/* AI Search Results Banner */}
          <AnimatePresence>
            {aiMatchedCodes !== null && aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="mt-3"
              >
                <div className="flex items-start gap-3 rounded-xl bg-[var(--color-brand-cardinal-light)] border border-[var(--color-brand-cardinal)]/10 px-4 py-3">
                  <Bot className="w-4 h-4 text-[var(--color-brand-cardinal)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-sm)] text-[var(--color-neutral-700)] leading-relaxed">
                      {aiSummary}
                    </p>
                    <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-1 font-medium">
                      {aiMatchedCodes.size} {aiMatchedCodes.size === 1 ? 'course' : 'courses'} found by AI
                    </p>
                  </div>
                  <button
                    onClick={clearAISearch}
                    className="text-[var(--text-xs)] font-semibold text-[var(--color-brand-cardinal)] hover:text-[var(--color-brand-cardinal-hover)] whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          {/* Desktop filters sidebar - sticky so it stays visible when scrolling */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="hidden lg:block sticky top-0 w-[280px] shrink-0 self-start"
          >
            <div
              className="glass-panel rounded-2xl p-5 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 8rem)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
                  <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                    Filters
                  </h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-[var(--text-sm)] font-medium text-[var(--color-brand-cardinal)] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {filterPanel}
            </div>
          </motion.aside>

          {/* Mobile filters drawer */}
          <AnimatePresence>
            {showMobileFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                  onClick={() => setShowMobileFilters(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 bottom-0 w-[300px] z-50 glass-panel-strong overflow-y-auto p-5 lg:hidden"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
                      <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                        Filters
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1.5 rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {filterPanel}
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Results header: count + mobile filter btn + sort */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-white text-[var(--text-xs)] font-semibold text-[var(--color-neutral-600)] hover:border-[var(--color-border-hover)] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-brand-cardinal)] text-white text-[9px] font-bold flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
                <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
                  Showing{' '}
                  <span className="font-bold text-[var(--color-brand-dark)]">
                    {filteredCourses.length}
                  </span>{' '}
                  {filteredCourses.length === 1 ? 'course' : 'courses'}
                </p>
              </div>

              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-white text-[var(--text-xs)] font-semibold text-[var(--color-neutral-600)] hover:border-[var(--color-border-hover)] transition-colors"
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
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute right-0 z-30 mt-1.5 w-48 rounded-xl border border-[var(--color-border-default)] bg-white py-1 shadow-[var(--shadow-dropdown)]"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowSortDropdown(false);
                          }}
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

            {/* Course cards */}
            {filteredCourses.length > 0 && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
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
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
