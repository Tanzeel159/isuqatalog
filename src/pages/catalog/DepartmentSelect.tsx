import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowRight,
  ChevronRight,
  Target,
  BookOpen,
  Map,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { HCI_COURSES, CATEGORY_CONFIG } from './data';

const DEPARTMENTS = [
  { id: 'hci', code: 'HCI', name: 'Human-Computer Interaction', description: 'Master User Experience and Interaction Design', courses: 28, topCourse: 'UX Strategy', accent: '#C8102E' },
  { id: 'ae', code: 'AE', name: 'Aerospace Engineering', description: 'Leading Aerospace Engineering and Space Exploration', courses: 24, topCourse: 'Propulsion', accent: '#006BA6' },
  { id: 'ba', code: 'BA', name: 'Business Administration', description: 'Business Administration & Entrepreneurial Leadership', courses: 19, topCourse: 'Executive Leadership', accent: '#76881D' },
  { id: 'psych', code: 'PSYCH', name: 'Psychology', description: 'Explore the Depths of Human & AI Cognitive Science', courses: 31, topCourse: 'Applied Bio', accent: '#9A3324' },
  { id: 'art', code: 'ART', name: 'Art & Design', description: 'Mastery of the Human Creative Digital Art Practice', courses: 22, topCourse: 'Templates', accent: '#BE531C' },
  { id: 'idd', code: 'IDD', name: 'Interdisciplinary Design', description: 'Designing Digital Products & Solutions with Data', courses: 18, topCourse: 'Product Design', accent: '#003D4C' },
];

const FEATURES = [
  { icon: Map, title: 'Skill Mapping', description: 'Instantly map courses to industry skills & competencies so you find exactly what you need.' },
  { icon: Target, title: 'Career Alignment', description: 'AI analyzes your profile and future career interests to suggest courses tailored to your goals.' },
  { icon: BookOpen, title: 'Syllabus Analysis', description: 'Smart AI-powered analysis of your course syllabi ensures you spend time learning what matters.' },
];

const TRENDING_COURSES = [
  { id: '1', dept: 'HCI', number: '5500x', title: 'Advanced Methods for Data Collection & Analysis', professor: 'Dr. Edward Cupps', rating: 8.5, credits: 3, semester: 'Fall 2026', accent: '#C8102E' },
  { id: '2', dept: 'AE', number: '4200', title: 'Aerospace Propulsion Systems & Design', professor: 'Dr. Sarah Chen', rating: 7.8, credits: 3, semester: 'Spring 2027', accent: '#006BA6' },
  { id: '3', dept: 'PSYCH', number: '3100', title: 'Business Psychology & HR Management', professor: 'Dr. Mark Rivera', rating: 9.1, credits: 4, semester: 'Fall 2026', accent: '#9A3324' },
  { id: '4', dept: 'ART', number: '2500', title: 'Patterns in AI Functional Design', professor: 'Dr. Lisa Park', rating: 8.2, credits: 3, semester: 'Spring 2027', accent: '#BE531C' },
];

const MAX_PUBLIC_RESULTS = 6;

export default function DepartmentSelect() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return HCI_COURSES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.offerings.some((o) => o.instructor?.toLowerCase().includes(q)),
    );
  }, [search]);

  const visibleResults = searchResults.slice(0, MAX_PUBLIC_RESULTS);
  const hasMore = searchResults.length > MAX_PUBLIC_RESULTS;
  const showResults = search.trim().length >= 2 && searchFocused;

  return (
    <div className="relative min-h-svh bg-[var(--color-surface-page)]">
      <AnimatedBackground variant="catalog" />

      {/* Search backdrop overlay */}
      <AnimatePresence>
        {searchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[3px]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <Logo to="/explore" size="lg" />
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-brand-dark)] sm:inline-flex"
          >
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
      </header>

      {/* Hero */}
      <section className={cn("relative flex flex-col items-center px-4 pb-6 sm:pb-10", searchFocused ? "z-40" : "z-20")}>
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex w-full max-w-2xl flex-col items-center text-center"
        >
          <h1 className="text-[var(--text-2xl)] font-bold tracking-[var(--tracking-tight)] text-[var(--color-neutral-900)] sm:text-[var(--text-3xl)]">
            Find the courses that <span className="text-gradient">matter to you</span>
          </h1>
          <p className="mt-2 text-[var(--text-sm)] leading-relaxed text-[var(--color-neutral-400)]">
            Browse departments, explore syllabi, and plan your academic path at Iowa State.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 w-full max-w-lg mx-auto relative"
          >
            <div
              className={cn(
                'relative flex items-center rounded-xl border bg-white transition-all duration-200',
                showResults && searchResults.length > 0
                  ? 'border-[var(--color-neutral-300)] shadow-lg rounded-b-none border-b-[var(--color-border-default)]'
                  : searchFocused
                    ? 'border-[var(--color-neutral-800)] shadow-md'
                    : 'border-[var(--color-border-default)] hover:border-[var(--color-neutral-400)]',
              )}
            >
              <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-[var(--color-neutral-400)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder='Search courses...'
                className="h-12 w-full bg-transparent px-3 text-[var(--text-base)] text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mr-3 p-1 rounded-md hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results — clean list */}
            <AnimatePresence>
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute left-0 right-0 top-full z-50 overflow-hidden rounded-b-xl border border-t-0 border-[var(--color-neutral-300)] bg-white shadow-lg"
                >
                  <p className="px-4 py-2 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)] bg-[var(--color-neutral-50)] border-b border-[var(--color-border-default)]">
                    {searchResults.length} course {searchResults.length === 1 ? 'result' : 'results'}
                  </p>

                  <div className="max-h-[280px] overflow-y-auto">
                    {visibleResults.map((course) => {
                      const config = CATEGORY_CONFIG[course.category];
                      return (
                        <button
                          key={course.id}
                          onMouseDown={() => navigate(`/department/hci`)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-[var(--text-xs)] font-bold text-[var(--color-neutral-500)] w-[72px] shrink-0 tabular-nums">
                            {course.code}
                          </span>
                          <span className="text-[var(--text-sm)] text-[var(--color-neutral-800)] truncate">
                            {course.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {hasMore ? (
                    <Link
                      to="/signup"
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center justify-center gap-1.5 py-2.5 border-t border-[var(--color-border-default)] text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] hover:bg-[var(--color-neutral-50)] transition-colors"
                    >
                      Sign in to see all {searchResults.length} results
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center justify-center gap-1.5 py-2.5 border-t border-[var(--color-border-default)] text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] hover:bg-[var(--color-neutral-50)] transition-colors"
                    >
                      Sign in for AI search & planning
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </motion.div>
              )}

              {showResults && search.trim().length >= 2 && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 right-0 top-full z-50 rounded-b-xl border border-t-0 border-[var(--color-neutral-300)] bg-white shadow-lg px-4 py-4 text-center"
                >
                  <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                  <p className="mt-0.5 text-[var(--text-xs)] text-[var(--color-neutral-400)]">
                    <Link to="/signup" className="font-medium text-[var(--color-brand-cardinal)] hover:underline">Sign up</Link> for AI-powered search
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="relative z-10 py-10 sm:py-14"
      >
        <div className="mx-auto grid max-w-4xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-panel rounded-2xl p-5 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/8"
              >
                <feature.icon className="h-5 w-5 text-[var(--color-brand-cardinal)]" />
              </motion.div>
              <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-brand-dark)]">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[var(--text-xs)] leading-relaxed text-[var(--color-neutral-400)]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Departments */}
      <section className="relative z-10 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[var(--text-lg)] font-bold tracking-tight text-[var(--color-neutral-900)] sm:text-[var(--text-xl)]">
                Explore Departments
              </h2>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-neutral-500)]">
                Browse across departments at Iowa State
              </p>
            </div>
            <Link
              to="/catalog"
              className="hidden items-center gap-1 text-[var(--text-xs)] font-semibold text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-brand-dark)] sm:flex"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {DEPARTMENTS.map((dept) => (
              <motion.div
                key={dept.id}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/department/${dept.id}`)}
                className="group cursor-pointer overflow-hidden rounded-2xl glass-panel hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className="relative flex h-28 items-center justify-center overflow-hidden"
                  style={{ backgroundColor: dept.accent }}
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 0.1, scale: 1 }}
                    viewport={{ once: true }}
                    className="absolute right-3 top-2 select-none text-[64px] font-extrabold leading-none text-white"
                  >
                    {dept.code}
                  </motion.span>
                  <span className="relative text-[var(--text-2xl)] font-extrabold tracking-wide text-white">
                    {dept.code}
                  </span>
                </div>

                <div className="p-5">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-widest text-[var(--color-neutral-400)]">
                    {dept.courses} courses
                  </span>
                  <h3 className="mt-1.5 text-[var(--text-lg)] font-bold tracking-tight text-[var(--color-brand-dark)]">
                    {dept.name}
                  </h3>
                  <p className="mt-1 text-[var(--text-xs)] leading-relaxed text-[var(--color-neutral-400)]">
                    {dept.description}
                  </p>
                  <div
                    className="mt-4 flex items-center gap-2 rounded-xl px-2.5 py-2"
                    style={{ backgroundColor: `${dept.accent}08` }}
                  >
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${dept.accent}18` }}
                    >
                      <Star className="h-2.5 w-2.5" style={{ color: dept.accent }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">Top Course</span>
                      <span className="text-[var(--text-xs)] font-bold text-[var(--color-brand-dark)]">{dept.topCourse}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trending Courses */}
      <section className="relative z-10 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/10">
              <TrendingUp className="h-4.5 w-4.5 text-[var(--color-brand-cardinal)]" />
            </div>
            <h2 className="text-[var(--text-lg)] font-bold tracking-tight text-[var(--color-neutral-900)] sm:text-[var(--text-xl)]">
              Trending Courses
            </h2>
          </div>
          <p className="mt-1.5 text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            Popular picks across departments this semester
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mt-7 grid gap-3 sm:grid-cols-2"
          >
            {TRENDING_COURSES.map((course) => (
              <motion.div
                key={course.id}
                variants={fadeUp}
                whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl glass-panel p-5 transition-all duration-300 hover:border-[var(--color-border-hover)]"
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]"
                  style={{ backgroundColor: course.accent }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--text-2xs)] font-bold tracking-wide text-white"
                        style={{ backgroundColor: course.accent }}
                      >
                        {course.dept} {course.number}
                      </span>
                      <span className="text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)]">
                        {course.semester}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-[var(--text-sm)] font-semibold leading-snug text-[var(--color-brand-dark)]">
                      {course.title}
                    </h3>
                    <p className="mt-1.5 text-[var(--text-xs)] text-[var(--color-neutral-500)]">
                      {course.professor}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl bg-[var(--color-neutral-50)] px-2.5 py-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
                      <span className="text-[var(--text-sm)] font-bold tabular-nums text-[var(--color-brand-dark)]">
                        {course.rating}
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">
                      Rating
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1">
                  View details <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer with integrated CTA */}
      <footer className="relative z-10 border-t border-[var(--color-border-default)] bg-[var(--color-neutral-50)]/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-[var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--color-neutral-400)]">
            Start your journey
          </p>
          <h2 className="mt-2.5 text-[var(--text-xl)] font-bold tracking-[var(--tracking-tight)] text-[var(--color-neutral-900)]">
            Join 10,000+ learners at Iowa State.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--text-sm)] leading-relaxed text-[var(--color-neutral-400)]">
            Personalized paths, expert instructors, and data-driven insights to help you reach your goals faster.
          </p>
          <div className="mt-6">
            <Link
              to="/signup"
              className={cn(
                'h-[var(--input-h-md)] rounded-full bg-[var(--color-brand-cardinal)] px-8',
                'inline-flex items-center gap-2 text-[var(--text-sm)] font-bold text-white',
                'shadow-sm transition-all duration-200',
                'hover:bg-[var(--color-brand-cardinal-hover)] hover:shadow-md',
              )}
            >
              Sign Up for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-default)] py-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-sm)] font-extrabold tracking-tight text-[var(--color-brand-cardinal)]">ISU</span>
                <span className="text-[var(--text-sm)] font-semibold tracking-tight text-[var(--color-brand-dark)]">Qatalog</span>
              </div>
              <span className="text-[var(--color-neutral-200)]">&middot;</span>
              <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                &copy; {new Date().getFullYear()} Iowa State University
              </p>
            </div>

            <nav className="flex items-center gap-6 text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)]">
              <Link to="/explore" className="transition-colors hover:text-[var(--color-neutral-700)]">Departments</Link>
              <Link to="/explore" className="transition-colors hover:text-[var(--color-neutral-700)]">Courses</Link>
              <a href="mailto:support@isuqatalog.com" className="transition-colors hover:text-[var(--color-neutral-700)]">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
