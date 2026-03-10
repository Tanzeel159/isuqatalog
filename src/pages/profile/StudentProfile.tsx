import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Major & Degree', text: 'Major and Degree. Minor. Academic Level. Expected Graduation. Current GPA. Credits Earned.' },
  { section: 'Interests & Focus', text: 'Research interests. Focus areas. UX Research. Interaction Design. Learning Technologies.' },
  { section: 'Degree Track', text: 'Degree track. Creative component. Thesis option. Coursework option.' },
  { section: 'Advisor', text: 'Advisor Information. Assigned Advisor. Contact. Academic Standing.' },
  { section: 'Graduation Progress', text: 'Graduation Progress. Degree Completion. Degree Requirements. Remaining credits.', route: '/profile?section=graduation' },
  { section: 'Degree Progress', text: 'Degree Completion. Edit Profile.' },
];
import { motion } from 'motion/react';
import {
  Pencil,
  Mail,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  ArrowRight,
  BookOpen,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  COMPLETED_COURSE_HISTORY,
  CURRENT_ENROLLMENTS,
  DEGREE_REQUIREMENTS,
  EARNED_CREDITS,
  GPA,
  IN_PROGRESS_CREDITS,
  STUDENT_ACADEMIC_PROFILE,
  TIMELINE_SEMESTERS,
  TOTAL_REQUIRED,
} from '@/lib/student';

const REMAINING = [
  ...CURRENT_ENROLLMENTS.map((course) => ({
    code: course.code,
    name: course.name,
    credits: course.credits,
    status: `In Progress — ${course.semester}`,
  })),
  ...TIMELINE_SEMESTERS.filter((semester) => semester.status === 'planned').flatMap((semester) =>
    semester.courses.map((code) => ({
      code,
      name: code === 'HCI 5990' ? 'Creative Component' : code,
      credits: 3,
      status: `Planned — ${semester.label}`,
    })),
  ),
].slice(0, 3);

function getDisplayName(user: { name?: string; email?: string } | null): string {
  if (!user) return 'Student';
  if (user.name?.trim()) return user.name.trim();
  if (user.email) {
    const local = user.email.split('@')[0] ?? '';
    return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase().replace(/[._-]/g, ' ');
  }
  return 'Student';
}

function ProfileHero() {
  const { user } = useAuth();
  const name = getDisplayName(user);
  const initials = name.split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const pct = Math.round((EARNED_CREDITS / TOTAL_REQUIRED) * 100);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="h-20 bg-[var(--color-brand-cardinal)]" />

      <div className="px-6 pt-6 pb-6 bg-[var(--color-surface-card)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg ring-4 ring-white border border-[var(--color-border-default)]/50">
              <span className="text-[var(--text-xl)] font-bold text-[var(--color-neutral-800)]">{initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[var(--color-border-default)] flex items-center justify-center shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors" aria-label="Edit avatar">
              <Pencil className="w-3 h-3 text-[var(--color-neutral-500)]" />
            </button>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <h2 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)] truncate leading-tight">{name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--text-sm)] text-[var(--color-neutral-500)]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />HCI — {STUDENT_ACADEMIC_PROFILE.major}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />{STUDENT_ACADEMIC_PROFILE.degree.replace(' in Human-Computer Interaction', '')} · {STUDENT_ACADEMIC_PROFILE.expectedGraduation}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 sm:ml-auto">
            <Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5" />Edit Profile</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Current GPA', value: GPA.toFixed(2), accent: true },
            { label: 'Credits Earned', value: EARNED_CREDITS.toString() },
            { label: 'Completion', value: `${pct}%` },
            { label: 'In Progress', value: `${IN_PROGRESS_CREDITS}` },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl border border-[var(--color-border-default)] px-4 py-3 bg-white/60">
              <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{label}</p>
              <p className={cn('text-[var(--text-lg)] font-bold mt-1 tabular-nums', accent ? 'text-[var(--color-brand-cardinal)]' : 'text-[var(--color-neutral-800)]')}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AcademicInfoSection() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Major & Degree */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
          <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Major & Degree</h3>
        </div>
        <div className="grid grid-cols-2">
          {[
            { label: 'Major', value: STUDENT_ACADEMIC_PROFILE.major },
            { label: 'Minor', value: STUDENT_ACADEMIC_PROFILE.minor },
            { label: 'Academic Level', value: `${STUDENT_ACADEMIC_PROFILE.academicLevel} (${STUDENT_ACADEMIC_PROFILE.year})` },
            { label: 'Expected Graduation', value: STUDENT_ACADEMIC_PROFILE.expectedGraduation },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-[var(--color-border-default)] px-6 py-4 even:border-l border-[var(--color-border-default)]/60">
              <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{label}</p>
              <p className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mt-1.5 leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mb-4">Academic Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Credits Earned', value: EARNED_CREDITS.toString(), sub: `of ${TOTAL_REQUIRED} required` },
            { label: 'Current GPA', value: GPA.toFixed(2), sub: '4.0 scale' },
            { label: 'In Progress', value: `${IN_PROGRESS_CREDITS} cr`, sub: `${CURRENT_ENROLLMENTS.length} courses` },
            { label: 'Remaining', value: `${TOTAL_REQUIRED - EARNED_CREDITS} cr`, sub: `${Math.ceil((TOTAL_REQUIRED - EARNED_CREDITS) / 9)} semesters` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-[var(--color-border-default)] px-4 py-3 bg-white/60">
              <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{label}</p>
              <p className="text-[var(--text-xl)] font-bold text-[var(--color-neutral-900)] mt-1 tabular-nums">{value}</p>
              <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interests & Focus + Degree Track side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Interests */}
        <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Interests & Focus Areas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {STUDENT_ACADEMIC_PROFILE.interests.map((interest) => (
              <span key={interest} className="px-3 py-1.5 rounded-xl bg-[var(--color-brand-cardinal)]/6 text-[var(--text-sm)] font-medium text-[var(--color-brand-cardinal)] border border-[var(--color-brand-cardinal)]/10">
                {interest}
              </span>
            ))}
          </div>
          <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] mt-3">
            These inform AI course recommendations and plan generation.
          </p>
        </div>

        {/* Degree Track */}
        <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Degree Track</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Program', value: STUDENT_ACADEMIC_PROFILE.degree, active: true },
              { label: 'Track', value: STUDENT_ACADEMIC_PROFILE.degreeTrack, active: true },
              { label: 'Concentration', value: STUDENT_ACADEMIC_PROFILE.concentration, active: true },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--color-border-default)]/40 last:border-0">
                <span className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">{label}</span>
                <span className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-800)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course History → link to My Courses */}
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)]">Course History</h3>
              <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)]">
                {COMPLETED_COURSE_HISTORY.length} completed · {CURRENT_ENROLLMENTS.length} enrolled · GPA {GPA.toFixed(2)}
              </p>
            </div>
          </div>
          <Link
            to="/my-courses"
            className="flex items-center gap-1.5 text-[var(--text-sm)] font-semibold text-[var(--color-brand-cardinal)] hover:underline"
          >
            View full course history
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Advisor */}
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mb-5">Advisor Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Assigned Advisor</p>
            <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-800)] mt-1">{STUDENT_ACADEMIC_PROFILE.advisor.name}</p>
          </div>
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Contact</p>
            <a href={`mailto:${STUDENT_ACADEMIC_PROFILE.advisor.email}`} className="text-[var(--text-base)] font-semibold text-[var(--color-brand-cardinal)] hover:underline mt-1 inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />{STUDENT_ACADEMIC_PROFILE.advisor.email}
            </a>
          </div>
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Academic Standing</p>
            <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-800)] mt-1">{STUDENT_ACADEMIC_PROFILE.advisor.standing}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GraduationProgressSection() {
  const pct = Math.round((EARNED_CREDITS / TOTAL_REQUIRED) * 100);
  const doneCount = DEGREE_REQUIREMENTS.filter((r) => r.done).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Degree Completion</h3>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-0.5">{STUDENT_ACADEMIC_PROFILE.degree}</p>
          </div>
          <span className="text-[var(--text-2xl)] font-bold text-[var(--color-brand-cardinal)] tabular-nums">{pct}%</span>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
            <motion.div className="h-full rounded-full bg-[var(--color-brand-cardinal)]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-xs)] text-[var(--color-neutral-500)]">{EARNED_CREDITS} credits earned · {IN_PROGRESS_CREDITS} in progress</span>
            <span className="text-[var(--text-xs)] text-[var(--color-neutral-400)]">{TOTAL_REQUIRED} required</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-[var(--color-border-default)]/50">
          {[
            { label: 'Current GPA', value: GPA.toFixed(2) },
            { label: 'Semesters Left', value: '1' },
            { label: 'Academic Standing', value: 'Good' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">{label}</p>
              <p className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-800)] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)]">Degree Requirements</h3>
            <span className="text-[var(--text-sm)] text-[var(--color-neutral-400)]">{doneCount} / {DEGREE_REQUIREMENTS.length} completed</span>
          </div>
          <div className="space-y-0.5">
            {DEGREE_REQUIREMENTS.map((req, i) => (
              <motion.div key={req.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--color-neutral-50)] transition-colors">
                <div className="flex items-center gap-2.5">
                  {req.done ? <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-cardinal)]" /> : <Circle className="w-4 h-4 text-[var(--color-neutral-300)]" />}
                  <div>
                    <p className={cn('text-[var(--text-base)] font-medium', req.done ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-neutral-800)]')}>{req.label}</p>
                    <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">{req.earned}</p>
                  </div>
                </div>
                <span className={cn('text-[var(--text-xs)] font-semibold tabular-nums', req.done ? 'text-[var(--color-neutral-400)]' : 'text-[var(--color-neutral-700)]')}>{req.earned}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden px-6 py-5">
          <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)] mb-3">Remaining</h3>
          <div className="space-y-2.5">
            {REMAINING.map((course, i) => (
              <motion.div key={course.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="rounded-xl border border-[var(--color-border-default)]/50 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[var(--text-sm)] font-bold text-[var(--color-brand-cardinal)]">{course.code}</p>
                  <span className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-500)] tabular-nums">{course.credits} credits</span>
                </div>
                <p className="text-[var(--text-base)] font-medium text-[var(--color-neutral-800)] mt-1">{course.name}</p>
                <p className="text-[var(--text-sm)] text-[var(--color-neutral-400)] mt-1">{course.status}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type SectionId = 'academic' | 'graduation';

export default function StudentProfile() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const activeSection: SectionId = useMemo(() => {
    if (sectionParam === 'graduation') return 'graduation';
    return 'academic';
  }, [sectionParam]);

  return (
    <DashboardLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        <motion.div variants={fadeUp}><ProfileHero /></motion.div>
        <motion.div variants={fadeUp} key={activeSection}>
          {activeSection === 'academic' && <AcademicInfoSection />}
          {activeSection === 'graduation' && <GraduationProgressSection />}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
