import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { CourseCard } from './components/CourseCard';
import {
  DEPARTMENT_LIST,
  DEPARTMENTS,
  ALL_CATEGORIES,
  CATEGORY_CONFIG,
  LEVELS,
  SEMESTERS,
  DELIVERY_MODES,
  HCI_COURSES,
  courseLevel,
  type CourseCategory,
} from './data';

const NAV_ITEMS = ['Courses', 'Professors', 'Students'] as const;

export default function DepartmentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deptName = DEPARTMENTS[id ?? ''] ?? id?.toUpperCase() ?? '???';

  const [activeNav, setActiveNav] = useState<(typeof NAV_ITEMS)[number]>('Courses');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Graduate');
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'ALL'>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<(typeof DELIVERY_MODES)[number]>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [textFilter, setTextFilter] = useState('');
  const [showDeptSwitcher, setShowDeptSwitcher] = useState(false);

  const courses = id === 'hci' ? HCI_COURSES : [];
  const hasActiveAdvanced = deliveryFilter !== 'ALL';

  const baseFiltered = courses.filter((c) => {
    if (courseLevel(c.code) !== level) return false;
    if (semester !== 'ALL' && !c.offerings.some((o) => o.term === semester)) return false;
    if (deliveryFilter !== 'ALL' && c.delivery !== deliveryFilter) return false;
    return true;
  });

  const categoryCounts: Record<string, number> = { ALL: baseFiltered.length };
  ALL_CATEGORIES.forEach((cat) => {
    categoryCounts[cat] = baseFiltered.filter((c) => c.category === cat).length;
  });

  const filteredCourses = baseFiltered.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (textFilter.trim()) {
      const q = textFilter.trim().toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.offerings.some((o) => o.instructor?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const clearAllFilters = () => {
    setSemester('ALL');
    setSelectedCategory('ALL');
    setDeliveryFilter('ALL');
    setTextFilter('');
  };

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[var(--color-surface-page)]">
      <AnimatedBackground variant="catalog" />

      {/* Top banner + department switcher */}
      <div className="relative z-10 bg-[var(--color-brand-dark)]">
        <div className="flex items-center justify-between px-4 py-2.5 text-[var(--text-xs)] text-white sm:px-8">
          <span>
            Viewing <strong>{deptName}</strong> department
          </span>
          <button
            onClick={() => setShowDeptSwitcher((v) => !v)}
            className="flex items-center gap-1.5 font-semibold tracking-wide uppercase transition-opacity hover:opacity-80"
          >
            Switch
            <motion.div animate={{ rotate: showDeptSwitcher ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {showDeptSwitcher && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-8">
                {DEPARTMENT_LIST.map((dept) => {
                  const isActive = dept.id === id;
                  return (
                    <motion.button
                      key={dept.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { if (!isActive) navigate(`/department/${dept.id}`); setShowDeptSwitcher(false); }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5',
                        'text-[var(--text-xs)] font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-white text-[var(--color-brand-dark)]'
                          : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white',
                      )}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dept.accent }} />
                      {dept.code}
                      <span className="hidden text-[var(--text-2xs)] font-normal opacity-60 sm:inline">
                        {dept.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center gap-1 border-b border-[var(--color-border-default)] glass-panel-strong px-4 sm:px-8">
        <div className="mr-4 py-3">
          <Logo to="/catalog" size="md" />
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => setActiveNav(item)}
            className={cn(
              'relative px-3 py-3 text-[var(--text-sm)] font-medium transition-colors',
              activeNav === item ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]',
            )}
          >
            {item}
            {activeNav === item && (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-0 -bottom-px h-[2px] bg-[var(--color-brand-cardinal)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <button className="text-[var(--color-neutral-400)] transition-colors hover:text-[var(--color-neutral-600)]">
            <Bookmark className="h-4.5 w-4.5" />
          </button>
          <Link to="/" className="hidden text-[var(--text-sm)] font-semibold text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-brand-dark)] sm:inline-flex">
            Log in
          </Link>
          <Link
            to="/signup"
            className={cn(
              'h-[var(--input-h-sm)] rounded-full bg-[var(--color-brand-cardinal)] px-5',
              'inline-flex items-center text-[var(--text-xs)] font-bold text-white',
              'shadow-sm transition-all hover:bg-[var(--color-brand-cardinal-hover)] hover:shadow-md',
            )}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[var(--color-border-default)] bg-white/70 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
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

            <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-default)]">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    'px-4 py-1.5 text-[var(--text-xs)] font-medium transition-all duration-200',
                    level === l ? 'bg-[var(--color-brand-dark)] text-white' : 'bg-white text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-[var(--color-border-default)]" />

            <div className="flex items-center gap-1">
              {SEMESTERS.map((s) => (
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

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                'text-[var(--text-xs)] font-medium transition-all duration-200',
                showFilters || hasActiveAdvanced
                  ? 'border-[var(--color-brand-dark)] bg-[var(--color-brand-dark)] text-white'
                  : 'border-[var(--color-border-default)] bg-white text-[var(--color-neutral-500)] hover:border-[var(--color-border-hover)]',
              )}
            >
              <SlidersHorizontal className="h-3 w-3" />
              FILTERS
              {hasActiveAdvanced && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[var(--color-brand-dark)]">1</span>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[var(--color-border-default)]"
              >
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="text-[var(--text-2xs)] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Delivery</span>
                  <div className="flex items-center gap-1.5">
                    {DELIVERY_MODES.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDeliveryFilter(mode)}
                        className={cn(
                          'rounded-full px-3 py-1 text-[var(--text-2xs)] font-medium transition-all duration-200',
                          deliveryFilter === mode
                            ? 'bg-[var(--color-brand-dark)] text-white'
                            : 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]',
                        )}
                      >
                        {mode === 'ALL' ? 'All Modes' : mode}
                      </button>
                    ))}
                  </div>
                  {hasActiveAdvanced && (
                    <button onClick={() => setDeliveryFilter('ALL')} className="ml-auto inline-flex items-center gap-1 text-[var(--text-2xs)] font-medium text-[var(--color-brand-cardinal)]">
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border-default)] px-4 py-2.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[var(--text-2xs)] font-semibold transition-all duration-200',
                selectedCategory === 'ALL' ? 'bg-[var(--color-brand-dark)] text-white' : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
              )}
            >
              All
              <span className={cn('tabular-nums', selectedCategory === 'ALL' ? 'text-white/60' : 'text-[var(--color-neutral-400)]')}>
                {categoryCounts.ALL}
              </span>
            </button>

            {ALL_CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = categoryCounts[cat] ?? 0;
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(active ? 'ALL' : cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[var(--text-2xs)] font-semibold transition-all duration-200',
                    active ? cn(config.bgClass, config.textClass) : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', active && 'ring-2 ring-current/20')} style={{ backgroundColor: config.color }} />
                  {config.label}
                  <span className={cn('tabular-nums', active ? 'opacity-60' : 'text-[var(--color-neutral-400)]')}>{count}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Results */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)]">
            {filteredCourses.length === courses.length
              ? <><span className="font-semibold text-[var(--color-brand-dark)]">{courses.length}</span> courses available</>
              : <>Showing <span className="font-semibold text-[var(--color-brand-dark)]">{filteredCourses.length}</span> of {courses.length}</>}
          </p>
          {(semester !== 'ALL' || selectedCategory !== 'ALL' || deliveryFilter !== 'ALL' || textFilter.trim()) && (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-[var(--color-brand-cardinal)]">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Course cards */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, i) => {
            const sem: string = semester;
            return <CourseCard key={course.id} course={course} index={i} activeSemester={sem} />;
          })}
        </div>

        {filteredCourses.length === 0 && id === 'hci' && (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)]">
              {level === 'Undergraduate'
                ? `${deptName} is a graduate program — all courses are at the 5000+ level.`
                : 'No courses match your current filters.'}
            </p>
            <button
              onClick={level === 'Undergraduate' ? () => setLevel('Graduate') : clearAllFilters}
              className="mt-3 text-[var(--text-xs)] font-semibold text-[var(--color-brand-cardinal)]"
            >
              {level === 'Undergraduate' ? 'Switch to Graduate' : 'Clear all filters'}
            </button>
          </div>
        )}

        {id !== 'hci' && (
          <p className="mt-16 text-center text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            Course data for {deptName} coming soon.
          </p>
        )}
      </main>
    </div>
  );
}
