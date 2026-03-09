import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Star,
  Clock,
  BookOpen,
  Users,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  BarChart3,
  MessageSquare,
  RefreshCw,
  Sparkles,
  TrendingUp,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { apiFetch } from '@/lib/api';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  HCI_COURSES,
  CATEGORY_CONFIG,
  getAvgRating,
  getWorkload,
  type Course,
} from './data';
import type { PageSearchEntry } from '@/lib/searchTypes';

/* ────────────────────────────────────────────────────────────
   Search entries (co-located per project convention)
   ──────────────────────────────────────────────────────────── */

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Course Detail', text: 'Course details. About this course. Syllabus overview. Course description.' },
  { section: 'Workload', text: 'Workload and expectations. Lecture hours. Outside work. Workload score.' },
  { section: 'Assessment', text: 'Assessment methods. Grade breakdown. Projects. Exams. Participation.' },
  { section: 'Reviews', text: 'Student reviews. Verified ISU students. Course feedback.' },
  { section: 'Statistics', text: 'Course statistics. Enrollment. Average grade. Would take again. Difficulty.' },
  { section: 'Prerequisites', text: 'Prerequisites and cross-listings. Advisor confirmation.' },
];

/* ────────────────────────────────────────────────────────────
   Deterministic mock-data generation (seeded per course id)
   ──────────────────────────────────────────────────────────── */

function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ASSESSMENT_SETS = [
  [
    { label: 'Projects', pct: 40, color: 'var(--color-info)' },
    { label: 'Exams', pct: 30, color: 'var(--color-brand-cardinal)' },
    { label: 'Group Work', pct: 20, color: 'var(--color-brand-gold)' },
    { label: 'Participation', pct: 10, color: 'var(--color-success)' },
  ],
  [
    { label: 'Research Paper', pct: 35, color: 'var(--color-info)' },
    { label: 'Presentations', pct: 25, color: 'var(--color-brand-gold)' },
    { label: 'Midterm', pct: 20, color: 'var(--color-brand-cardinal)' },
    { label: 'Final Exam', pct: 20, color: 'var(--color-success)' },
  ],
  [
    { label: 'Lab Work', pct: 45, color: 'var(--color-info)' },
    { label: 'Quizzes', pct: 20, color: 'var(--color-brand-cardinal)' },
    { label: 'Final Project', pct: 25, color: 'var(--color-brand-gold)' },
    { label: 'Participation', pct: 10, color: 'var(--color-success)' },
  ],
];

const REVIEW_POOL = [
  'Great course — very hands-on with clear feedback from the instructor.',
  'Challenging but rewarding. The projects are where the real learning happens.',
  'Professor was knowledgeable and made complex topics accessible.',
  'Heavy workload but the material is fascinating and directly applicable.',
  'Well-structured with a good balance of theory and practical work.',
  'Highly recommend for anyone looking to deepen their HCI understanding.',
];

const GRADE_MAP = ['A', 'A-', 'B+', 'B', 'B-'];

function getCourseExtras(course: Course) {
  const h = seed(course.id);
  const workload = getWorkload(course);
  const offering = course.offerings[0];

  const reviewCount = 2 + (h % 3);
  const reviews = Array.from({ length: reviewCount }, (_, i) => ({
    text: REVIEW_POOL[(h + i) % REVIEW_POOL.length],
    term: i % 2 === 0 ? 'Spring 2025' : 'Fall 2024',
    rating: 3.5 + ((h + i) % 4) * 0.5,
  }));

  const enrollment = 12 + (h % 20);

  return {
    lectureHours: workload <= 2 ? '3 hrs' : workload <= 3 ? '4 hrs' : '5 hrs',
    outsideWork: workload <= 2 ? '4-6 hrs' : workload <= 3 ? '6-8 hrs' : '8-10 hrs',
    enrollment,
    seats: enrollment + 3 + (h % 8),
    avgGrade: GRADE_MAP[Math.min(workload - 1, GRADE_MAP.length - 1)] ?? 'B+',
    wouldTakeAgain: offering?.wouldTakeAgain
      ? parseInt(offering.wouldTakeAgain)
      : 70 + (h % 25),
    assessment: ASSESSMENT_SETS[h % ASSESSMENT_SETS.length],
    reviews,
    difficulty: workload <= 2 ? 'Easy' : workload <= 3 ? 'Moderate' : 'Challenging',
  };
}

/* ────────────────────────────────────────────────────────────
   AI Difficulty Analysis hook
   ──────────────────────────────────────────────────────────── */

interface AnalysisPoint {
  label: string;
  detail: string;
}

interface CourseAnalysis {
  difficulty: string;
  summary: string;
  points: AnalysisPoint[];
}

function fallbackAnalysis(course: Course): CourseAnalysis {
  const workload = getWorkload(course);
  const difficulty = workload <= 2 ? 'Easy' : workload <= 3 ? 'Moderate' : 'Challenging';
  return {
    difficulty,
    summary: `${difficulty} workload (${workload}/5), delivered ${course.delivery.toLowerCase()}.`,
    points: [
      { label: 'Workload', detail: `Rated ${workload}/5 relative to other HCI courses.` },
      { label: 'Delivery', detail: `Available ${course.delivery.toLowerCase()}.` },
      { label: 'Category', detail: `Part of ${course.category} requirements.` },
    ],
  };
}

function useAIAnalysis(course: Course | null) {
  const [analysis, setAnalysis] = useState<CourseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAI, setIsAI] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!course) return;
    setLoading(true);
    try {
      const workload = getWorkload(course);
      const rating = getAvgRating(course);
      const offering = course.offerings[0];

      const data = await apiFetch<{ ok: true; analysis: CourseAnalysis }>(
        '/api/ai/course-analysis',
        {
          method: 'POST',
          json: {
            code: course.code,
            name: course.name,
            description: course.description,
            category: course.category,
            credits: course.credits,
            delivery: course.delivery,
            workload,
            avgRating: rating,
            wouldTakeAgain: offering?.wouldTakeAgain ?? null,
            instructor: offering?.instructor ?? null,
          },
        },
      );
      if (data.analysis) {
        setAnalysis(data.analysis);
        setIsAI(true);
      }
    } catch {
      // Keep fallback
    } finally {
      setLoading(false);
    }
  }, [course?.code]);

  useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

  const resolved = analysis ?? (course ? fallbackAnalysis(course) : null);
  return { analysis: resolved, loading, isAI, refresh: fetchAnalysis };
}

/* ────────────────────────────────────────────────────────────
   Tabs
   ──────────────────────────────────────────────────────────── */

const TABS = ['Overview', 'Reviews', 'Discussion'] as const;
type Tab = (typeof TABS)[number];

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const course = HCI_COURSES.find((c) => c.id === id) ?? null;
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [saved, setSaved] = useState(false);
  const { analysis: aiAnalysis, loading: aiLoading, isAI, refresh: refreshAnalysis } = useAIAnalysis(course);

  if (!course) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-cardinal)]/6">
            <BookOpen className="h-7 w-7 text-[var(--color-brand-cardinal)]" />
          </div>
          <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-brand-dark)]">
            Course not found
          </h2>
          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            The course you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            to="/catalog"
            className="mt-6 rounded-xl bg-[var(--color-brand-cardinal)] px-6 py-2.5 text-[var(--text-sm)] font-semibold text-white shadow-sm hover:bg-[var(--color-brand-cardinal-hover)] transition-colors"
          >
            Back to Catalog
          </Link>
        </motion.div>
      </DashboardLayout>
    );
  }

  const config = CATEGORY_CONFIG[course.category];
  const avgRating = getAvgRating(course);
  const workload = getWorkload(course);
  const activeOffering = course.offerings[0];
  const extras = getCourseExtras(course);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-6xl mx-auto"
      >
        {/* ── Breadcrumb ──────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--color-neutral-400)] mb-4">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1 hover:text-[var(--color-brand-cardinal)] transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Catalog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>HCI Department</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--color-brand-dark)] font-medium">{course.code}</span>
        </nav>

        {/* ── Course Header ───────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
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
                <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                  {course.credits} Credits &middot; {course.delivery}
                </span>
              </div>

              <h1 className="mt-3 text-[var(--text-2xl)] font-bold tracking-tight text-[var(--color-brand-dark)] leading-tight">
                {course.name}
              </h1>
            </div>

            {/* Consolidated rating (single location) */}
            {avgRating !== null && (
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[var(--text-2xl)] font-extrabold text-[var(--color-brand-cardinal)]">
                    {avgRating}
                  </span>
                  <span className="text-[var(--text-md)] font-semibold text-[var(--color-neutral-300)]">
                    / 5.0
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3.5 w-3.5',
                        i < Math.round(avgRating)
                          ? 'fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]'
                          : 'text-[var(--color-neutral-200)]',
                      )}
                    />
                  ))}
                </div>
                <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-1">
                  {extras.reviews.length} student{' '}
                  {extras.reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {/* ── Tabs ──────────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-6 border-t border-[var(--color-border-default)]/50 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative pt-4 pb-3 text-[var(--text-sm)] font-medium transition-colors duration-200',
                  activeTab === tab
                    ? 'text-[var(--color-brand-cardinal)] font-semibold'
                    : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]',
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.span
                    layoutId="course-tab"
                    className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--color-brand-cardinal)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content grid ───────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* LEFT COLUMN */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            key={activeTab}
            className="flex flex-col gap-5"
          >
            {(activeTab === 'Overview' || activeTab === 'Reviews') && (
              <>
                {activeTab === 'Overview' && (
                  <>
                    {/* About This Course */}
                    <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6">
                      <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                        About This Course
                      </h2>
                      <p className="mt-3 text-[var(--text-sm)] leading-relaxed text-[var(--color-neutral-500)]">
                        {course.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeOffering?.instructor && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-[var(--text-xs)] font-medium text-[var(--color-neutral-600)]">
                            <Users className="h-3 w-3 text-[var(--color-neutral-400)]" />
                            {activeOffering.instructor}
                          </span>
                        )}
                        {course.crossListed && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-[var(--text-xs)] font-medium text-[var(--color-neutral-600)]">
                            <BookOpen className="h-3 w-3 text-[var(--color-neutral-400)]" />
                            Prereq: {course.crossListed}
                          </span>
                        )}
                        {course.offerings.map((o) => (
                          <span
                            key={o.term}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-[var(--text-xs)] font-medium text-[var(--color-neutral-600)]"
                          >
                            <Clock className="h-3 w-3 text-[var(--color-neutral-400)]" />
                            {o.term}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-[var(--text-xs)] font-medium text-[var(--color-neutral-600)]">
                          <Users className="h-3 w-3 text-[var(--color-neutral-400)]" />
                          {extras.seats} Seats
                        </span>
                      </div>
                    </motion.div>

                    {/* Workload & Expectations */}
                    <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6">
                      <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                        Workload &amp; Expectations
                      </h2>
                      <p className="mt-1 text-[var(--text-xs)] text-[var(--color-neutral-400)]">
                        Advisor-reported weekly commitment
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <span className="rounded-xl bg-[var(--color-brand-gold)]/15 px-4 py-2.5 text-[var(--text-sm)] font-semibold text-[var(--color-brand-gold-hover)]">
                          {extras.lectureHours} Lecture / week
                        </span>
                        <span className="rounded-xl bg-[var(--color-neutral-100)] px-4 py-2.5 text-[var(--text-sm)] font-semibold text-[var(--color-neutral-600)]">
                          {extras.outsideWork} Outside Work / week
                        </span>
                      </div>
                      <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-600)]">
                            Workload Score
                          </span>
                          <span className="text-[var(--text-sm)] font-bold text-[var(--color-brand-dark)] tabular-nums">
                            {workload} / 5
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[var(--color-neutral-100)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(workload / 5) * 100}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.3,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="h-full rounded-full"
                            style={{
                              background:
                                'linear-gradient(90deg, var(--color-brand-gold) 0%, var(--color-brand-cardinal) 100%)',
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Assessment Methods */}
                    <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6">
                      <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                        Assessment Methods
                      </h2>
                      <p className="mt-1 text-[var(--text-xs)] text-[var(--color-neutral-400)]">
                        Grade breakdown for this course
                      </p>
                      <div className="mt-4 flex flex-col gap-3.5">
                        {extras.assessment.map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="w-28 shrink-0 text-[var(--text-sm)] font-medium text-[var(--color-neutral-600)]">
                              {item.label}
                            </span>
                            <div className="flex-1 h-3 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.pct}%` }}
                                transition={{
                                  duration: 0.6,
                                  delay: 0.2,
                                  ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                            <span className="w-10 text-right text-[var(--text-sm)] font-semibold text-[var(--color-neutral-500)] tabular-nums">
                              {item.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                {/* Student Reviews (visible on Overview and Reviews tabs) */}
                <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6">
                  <h2 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                    Student Reviews
                  </h2>
                  <p className="mt-0.5 text-[var(--text-2xs)] font-medium text-[var(--color-neutral-400)] mb-5">
                    Verified ISU students &middot; {extras.reviews.length} reviews
                  </p>

                  <div className="flex flex-col gap-4">
                    {extras.reviews.map((review, i) => (
                      <div key={i} className="flex gap-3.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-2xs)] font-bold text-white"
                          style={{ backgroundColor: `hsl(${(seed(course.id) + i * 60) % 360}, 45%, 55%)` }}
                        >
                          S{i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    'h-3 w-3',
                                    s < Math.round(review.rating)
                                      ? 'fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]'
                                      : 'text-[var(--color-neutral-200)]',
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                              {review.term}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[var(--text-sm)] text-[var(--color-neutral-600)] leading-relaxed">
                            {review.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === 'Discussion' && (
              <motion.div
                variants={fadeUp}
                className="glass-panel rounded-2xl p-6 text-center py-16"
              >
                <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-neutral-300)] mb-3" />
                <h3 className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)]">
                  Discussion coming soon
                </h3>
                <p className="mt-1.5 text-[var(--text-sm)] text-[var(--color-neutral-400)]">
                  Share questions and insights with classmates.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT COLUMN (Sidebar) */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            {/* Action buttons */}
            <motion.div variants={fadeUp} className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSaved((v) => !v)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-[var(--text-sm)] font-bold transition-all duration-200',
                  saved
                    ? 'border-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal)]/6 text-[var(--color-brand-cardinal)]'
                    : 'border-[var(--color-border-default)] text-[var(--color-neutral-600)] hover:border-[var(--color-brand-cardinal)] hover:text-[var(--color-brand-cardinal)]',
                )}
              >
                {saved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {saved ? 'Saved' : 'Save Course'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-cardinal)] py-3 text-[var(--text-sm)] font-bold text-white shadow-sm hover:bg-[var(--color-brand-cardinal-hover)] transition-colors"
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Plan
              </motion.button>
            </motion.div>

            {/* Course Statistics */}
            <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-5">
              <h3 className="text-[var(--text-sm)] font-bold text-[var(--color-brand-dark)] mb-4">
                Course Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Workload', value: `${workload} / 5`, Icon: BarChart3 },
                  { label: 'Take Again', value: `${extras.wouldTakeAgain}%`, Icon: TrendingUp },
                  { label: 'Avg Grade', value: extras.avgGrade, Icon: GraduationCap },
                  { label: 'Enrollment', value: `${extras.enrollment}`, Icon: Users },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[var(--color-border-default)] bg-white p-3 text-center"
                  >
                    <stat.Icon className="mx-auto h-4 w-4 text-[var(--color-neutral-400)] mb-1.5" />
                    <p className="text-[var(--text-md)] font-bold text-[var(--color-brand-dark)] tabular-nums">
                      {stat.value}
                    </p>
                    <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Difficulty Assessment */}
            <motion.div
              variants={fadeUp}
              className="glass-panel rounded-2xl overflow-hidden"
            >
              <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border-default)]/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/8">
                      <Sparkles className="w-[18px] h-[18px] text-[var(--color-brand-cardinal)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[var(--text-md)] font-semibold text-[var(--color-neutral-900)]">
                          AI Difficulty Assessment
                        </h3>
                        {isAI && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] text-[9px] font-bold uppercase tracking-wider">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] font-medium">
                        {isAI ? 'Powered by AI' : 'Based on course data'}
                      </p>
                    </div>
                  </div>
                  {isAI && (
                    <motion.button
                      whileHover={{ rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      onClick={refreshAnalysis}
                      disabled={aiLoading}
                      aria-label="Refresh analysis"
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', aiLoading && 'animate-spin')} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="px-5 py-4">
                {aiLoading ? (
                  <div className="space-y-2.5">
                    <div className="h-4 w-2/3 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    <div className="h-3 w-full rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    <div className="h-3 w-4/5 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                  </div>
                ) : aiAnalysis && (
                  <>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[var(--text-2xs)] font-bold',
                      aiAnalysis.difficulty === 'Easy'
                        ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                        : aiAnalysis.difficulty === 'Moderate'
                          ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                          : 'bg-[var(--color-error-light)] text-[var(--color-error)]',
                    )}>
                      <BarChart3 className="h-3 w-3" />
                      {aiAnalysis.difficulty}
                    </span>
                    <p className="mt-2.5 text-[var(--text-xs)] text-[var(--color-neutral-500)] leading-relaxed line-clamp-3">
                      {aiAnalysis.summary}
                    </p>
                    {aiAnalysis.points.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {aiAnalysis.points.slice(0, 3).map((point, i) => (
                          <li key={i} className="flex items-baseline gap-2 text-[var(--text-xs)] leading-snug">
                            <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--color-brand-cardinal)] mt-[5px]" />
                            <span>
                              <span className="font-semibold text-[var(--color-neutral-700)]">{point.label}:</span>{' '}
                              <span className="text-[var(--color-neutral-500)]">{point.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {/* Prerequisites & Cross-Listings */}
            <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-[var(--text-sm)] font-bold text-[var(--color-brand-dark)]">
                  Prerequisites &amp; Cross-Listings
                </h3>
              </div>
              <div className="px-5 pb-4 space-y-2.5">
                {course.crossListed ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-brand-cardinal-light)] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-cardinal)]/10">
                        <BookOpen className="h-4 w-4 text-[var(--color-brand-cardinal)]" />
                      </div>
                      <div>
                        <p className="text-[var(--text-xs)] font-bold text-[var(--color-brand-cardinal)]">
                          {course.crossListed}
                        </p>
                        <p className="text-[var(--text-2xs)] text-[var(--color-neutral-500)]">
                          Cross-listed department
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-neutral-50)] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-100)]">
                        <GraduationCap className="h-4 w-4 text-[var(--color-neutral-400)]" />
                      </div>
                      <div>
                        <p className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-700)]">
                          Graduate standing
                        </p>
                        <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                          Required for enrollment
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-[var(--color-success-light)] p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
                      <GraduationCap className="h-4 w-4 text-[var(--color-success)]" />
                    </div>
                    <div>
                      <p className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-700)]">
                        No prerequisites
                      </p>
                      <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                        Open to all graduate students
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[var(--color-border-default)]/50 px-5 py-3">
                <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">
                  Confirm enrollment with your advisor
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
