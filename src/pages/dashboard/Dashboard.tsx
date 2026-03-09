import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Greeting', text: 'Ready to plan your academic journey?' },
  { section: 'Registration Alert', text: 'Fall 2026 Registration Opens Soon. Priority registration opens April 6, 2026. Set Reminder.' },
  { section: 'Quick Actions', text: 'Build a Semester Plan. AI-assisted scheduling.' },
  { section: 'Quick Actions', text: 'Search Courses. Browse the full catalog.' },
  { section: 'Quick Actions', text: 'View Saved Plans. Resume where you left off.' },
  { section: 'Current Semester', text: 'Spring 2026 Semester. In Progress. Total Credits.' },
  { section: 'Graduation Progress', text: 'Graduation. Credits. Core Requirements. Electives. Research Credits. View Full Report.' },
  { section: 'AI Recommendations', text: 'AI-Powered Recommendations. Powered by AI — personalized for your courses. Personalized for your degree plan.' },
];
import { motion } from 'motion/react';
import {
  Clock,
  Bell,
  CalendarPlus,
  Search,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  BookOpen,
  FlaskConical,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { CURRENT_COURSES } from '@/lib/student';
import { HCI_COURSES } from '@/pages/catalog/data';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface Recommendation {
  code: string;
  name: string;
  match: number;
  reason: string;
}

const FALLBACK_RECOMMENDATIONS: Recommendation[] = [
  { code: 'HCI 577', name: 'Advanced User Research', match: 95, reason: 'Aligns with your HCI focus and research interests' },
  { code: 'HCI 5210', name: 'Interaction Design Studio', match: 89, reason: 'Builds on your Usability Engineering coursework' },
  { code: 'CPRE 5580', name: 'Accessible Computing', match: 82, reason: 'Fulfills elective requirement, high peer rating' },
];

function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(FALLBACK_RECOMMENDATIONS);
  const [loading, setLoading] = useState(true);
  const [isAI, setIsAI] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ ok: true; recommendations: Recommendation[] }>(
        '/api/ai/recommendations',
        {
          method: 'POST',
          json: {
            currentCourses: CURRENT_COURSES.map((c) => c.code),
            completedCourses: ['HCI 5210', 'HCI 5840', 'HCI 5790X', 'HCI 5890'],
          },
        },
      );
      if (data.recommendations?.length > 0) {
        setRecommendations(data.recommendations);
        setIsAI(true);
      }
    } catch {
      // Keep fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { recommendations, loading, isAI, refresh: fetch_ };
}

function ProgressRing({ value, max, size = 56 }: { value: number; max: number; size?: number }) {
  const pct = Math.round((value / max) * 100);
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Graduation progress: ${pct}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-neutral-100)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-brand-cardinal)" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.5 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[var(--text-xs)] font-bold text-[var(--color-neutral-700)]">
        {pct}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { recommendations, loading: recsLoading, isAI, refresh: refreshRecs } = useAIRecommendations();
  const userName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Student';
  const totalCredits = CURRENT_COURSES.reduce((sum, c) => sum + c.credits, 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-5">

        {/* Greeting */}
        <motion.div variants={fadeUp}>
          <h1 className="text-[var(--text-2xl)] font-bold tracking-tight text-[var(--color-brand-dark)]">
            {getGreeting()}, <span className="text-[var(--color-brand-cardinal)]">{userName}</span>
          </h1>
          <p className="mt-1 text-[var(--text-base)] text-[var(--color-neutral-400)]">
            Ready to plan your academic journey?
          </p>
        </motion.div>

        {/* Registration alert */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl glass-panel group"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-[var(--color-brand-cardinal)]" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pl-5 pr-5 py-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center"
              >
                <Clock className="w-[18px] h-[18px] text-[var(--color-brand-cardinal)]" />
              </motion.div>
              <div>
                <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-900)]">
                  Fall 2026 Registration Opens Soon
                </p>
                <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)]">
                  Priority registration opens April 6, 2026
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0" aria-label="Set reminder for Fall 2026 registration">
              <Bell className="w-3.5 h-3.5" />
              Set Reminder
            </Button>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: CalendarPlus, label: 'Build a Semester Plan', desc: 'AI-assisted scheduling', to: '/planner' },
            { icon: Search, label: 'Search Courses', desc: 'Browse the full catalog', to: '/catalog' },
            { icon: FolderOpen, label: 'View Saved Plans', desc: 'Resume where you left off', to: '/schedule' },
          ].map(({ icon: Icon, label, desc, to }, i) => (
            <Link key={label} to={to}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel rounded-2xl p-5 cursor-pointer h-full group/card hover:shadow-lg transition-shadow duration-300"
              >
                <motion.div
                  whileHover={{ rotate: -8, scale: 1.1 }}
                  className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center mb-3"
                >
                  <Icon className="w-[18px] h-[18px] text-[var(--color-brand-cardinal)]" />
                </motion.div>
                <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-900)]">{label}</p>
                <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] mt-0.5">{desc}</p>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-neutral-300)] mt-3 group-hover/card:text-[var(--color-brand-cardinal)] group-hover/card:translate-x-1 transition-all duration-200" />
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Two-column: Semester + Graduation */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Current semester */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">
                Spring 2026 Semester
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-cardinal)]/6 text-[var(--color-brand-cardinal)] text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand-cardinal)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-brand-cardinal)]" />
                </span>
                In Progress
              </span>
            </div>
            <div className="px-5 pb-5 space-y-1">
              {CURRENT_COURSES.map((course, i) => (
                <motion.div
                  key={course.code}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                  whileHover={{ x: 4, backgroundColor: 'var(--color-neutral-50)' }}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[var(--text-xs)] font-bold text-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal)]/8 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      {course.code}
                    </span>
                    <span className="text-[var(--text-base)] font-medium text-[var(--color-neutral-700)] truncate">
                      {course.name}
                    </span>
                  </div>
                  <span className="text-[var(--text-xs)] font-semibold text-[var(--color-neutral-400)] whitespace-nowrap ml-3 tabular-nums">
                    {course.credits} credits
                  </span>
                </motion.div>
              ))}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border-default)]/50">
                <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)]">Total Credits</span>
                <span className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)] tabular-nums">{totalCredits}</span>
              </div>
            </div>
          </motion.div>

          {/* Graduation progress */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-5 pb-2 flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
              <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">
                Graduation
              </h2>
            </div>

            <div className="px-5 pb-5 flex-1 flex flex-col">
              <div className="flex items-center gap-4 my-3 py-3 rounded-2xl bg-[var(--color-neutral-50)]/80 px-4">
                <ProgressRing value={25} max={35} size={56} />
                <div>
                  <p className="text-[var(--text-2xs)] font-bold tracking-widest text-[var(--color-neutral-400)] uppercase">
                    Credits
                  </p>
                  <p className="text-[var(--text-xl)] font-bold text-[var(--color-neutral-900)] leading-none mt-0.5 tabular-nums">
                    25<span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-300)]">/35</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {[
                  { label: 'Core Requirements', value: 'Complete', icon: CheckCircle2 },
                  { label: 'Electives', value: '6/9', icon: BookOpen },
                  { label: 'Research Credits', value: '3/6', icon: FlaskConical },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[var(--color-neutral-400)]" />
                      <span className="text-[var(--text-base)] font-medium text-[var(--color-neutral-600)]">{label}</span>
                    </div>
                    <span className={cn(
                      'text-[var(--text-sm)] font-bold tabular-nums',
                      value === 'Complete' ? 'text-[var(--color-success)]' : 'text-[var(--color-neutral-700)]',
                    )}>
                      {value === 'Complete' ? '✓ Done' : value}
                    </span>
                  </div>
                ))}
              </div>

              <Link to="/graduation" className="mt-4">
                <Button variant="outline" size="sm" className="w-full group/btn">
                  View Full Report
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-cardinal)]/10">
                <Sparkles className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">
                    AI-Powered Recommendations
                  </h2>
                  {isAI && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] font-medium">
                  {isAI ? 'Powered by AI — personalized for your courses' : 'Personalized for your degree plan'}
                </p>
              </div>
            </div>
            {isAI && (
              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={refreshRecs}
                disabled={recsLoading}
                aria-label="Refresh recommendations"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', recsLoading && 'animate-spin')} />
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-panel rounded-2xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-20 rounded-lg bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                      <div className="h-4 w-16 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    </div>
                    <div className="h-5 w-3/4 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    <div className="h-4 w-full rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    <div className="h-4 w-2/3 rounded bg-[var(--color-neutral-100)] animate-skeleton bg-[length:400%_100%] bg-gradient-to-r from-[var(--color-neutral-100)] via-[var(--color-neutral-50)] to-[var(--color-neutral-100)]" />
                    <div className="h-1 w-full rounded-full bg-[var(--color-neutral-100)]" />
                  </div>
                </div>
              ))
            ) : (
              recommendations.map((rec, i) => (
                <motion.div
                  key={rec.code}
                  role="link"
                  tabIndex={0}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const match = HCI_COURSES.find((c) => c.code === rec.code);
                    if (match) navigate(`/course/${match.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const match = HCI_COURSES.find((c) => c.code === rec.code);
                      if (match) navigate(`/course/${match.id}`);
                    }
                  }}
                  className="glass-panel rounded-2xl overflow-hidden cursor-pointer group/rec hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[var(--text-xs)] font-bold text-[var(--color-brand-cardinal)] bg-[var(--color-brand-cardinal)]/8 px-2.5 py-0.5 rounded-lg">
                        {rec.code}
                      </span>
                      <span className="text-[var(--text-xs)] font-bold text-[var(--color-neutral-500)] tabular-nums">
                        {rec.match}% match
                      </span>
                    </div>

                    <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-900)] mb-1">
                      {rec.name}
                    </p>
                    <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] leading-relaxed mb-4">
                      {rec.reason}
                    </p>

                    <div className="h-1 w-full rounded-full bg-[var(--color-neutral-100)] overflow-hidden mb-3">
                      <motion.div
                        className="h-full rounded-full bg-[var(--color-brand-cardinal)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${rec.match}%` }}
                        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.6 + i * 0.1 }}
                      />
                    </div>

                    <span className="inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-[var(--color-brand-cardinal)] group-hover/rec:gap-2 transition-all duration-200">
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
}
