import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Pencil,
  Mail,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { staggerContainer, fadeUp } from '@/lib/motion';

type CourseCategory = 'Design Core' | 'Implementation Core' | 'Phenomena Core' | 'Evaluation Core' | 'Elective';

interface CompletedCourse {
  code: string;
  name: string;
  semester: string;
  grade: string;
  credits: number;
  category: CourseCategory;
}

const CATEGORY_STYLE: Record<CourseCategory, { bg: string; text: string }> = {
  'Design Core':         { bg: 'bg-[var(--color-brand-cardinal)]/8',  text: 'text-[var(--color-brand-cardinal)]' },
  'Implementation Core': { bg: 'bg-[var(--color-info)]/8',            text: 'text-[var(--color-info)]' },
  'Phenomena Core':      { bg: 'bg-[var(--color-warning)]/10',        text: 'text-[var(--color-warning)]' },
  'Evaluation Core':     { bg: 'bg-[var(--color-success)]/10',        text: 'text-[var(--color-success)]' },
  Elective:              { bg: 'bg-[var(--color-neutral-100)]',        text: 'text-[var(--color-neutral-500)]' },
};

const GRADE_MAP: Record<string, number> = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7 };

const COMPLETED_COURSES: CompletedCourse[] = [
  { code: 'HCI 5210',   name: 'Cognitive Psychology of HCI',              semester: 'Fall 2024',   grade: 'A',  credits: 3, category: 'Design Core' },
  { code: 'ARTGR 5300', name: 'User Engagement',                          semester: 'Fall 2024',   grade: 'A-', credits: 3, category: 'Design Core' },
  { code: 'HCI 5900',   name: 'Managing UX Teams & Design Systems',       semester: 'Fall 2024',   grade: 'A',  credits: 3, category: 'Elective' },
  { code: 'HCI 5840',   name: 'Python Application Development',           semester: 'Spring 2025', grade: 'A',  credits: 3, category: 'Implementation Core' },
  { code: 'HCI 5790X',  name: 'Methods for Interdisciplinary Research',   semester: 'Spring 2025', grade: 'B+', credits: 3, category: 'Evaluation Core' },
  { code: 'STAT 5010',  name: 'Applied Statistics',                       semester: 'Spring 2025', grade: 'B+', credits: 3, category: 'Elective' },
  { code: 'HCI 5890',   name: 'Design and Ethics',                        semester: 'Fall 2025',   grade: 'A',  credits: 3, category: 'Phenomena Core' },
  { code: 'HCI 5040',   name: 'Evaluating Tech-based Learning Env.',      semester: 'Fall 2025',   grade: 'A-', credits: 3, category: 'Evaluation Core' },
  { code: 'HCI 5260',   name: 'Design Ethnography',                       semester: 'Fall 2025',   grade: 'A',  credits: 3, category: 'Elective' },
];

const CURRENT_COURSES = [
  { code: 'HCI 5750',  name: 'Computational Perception',    credits: 3, category: 'Implementation Core' as CourseCategory },
  { code: 'HCI 5300X', name: 'Perspectives in HCI',         credits: 3, category: 'Phenomena Core' as CourseCategory },
  { code: 'HCI 5220',  name: 'Scientific Methods in HCI',   credits: 3, category: 'Evaluation Core' as CourseCategory },
];

const TOTAL_REQUIRED = 36;

function computeGpa(courses: CompletedCourse[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const pts = GRADE_MAP[c.grade];
    if (pts !== undefined) {
      totalPoints += pts * c.credits;
      totalCredits += c.credits;
    }
  }
  return totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(2) : 0;
}

const EARNED_CREDITS = COMPLETED_COURSES.reduce((s, c) => s + c.credits, 0);
const IN_PROGRESS_CREDITS = CURRENT_COURSES.reduce((s, c) => s + c.credits, 0);
const GPA = computeGpa(COMPLETED_COURSES);

const GRAD_REQUIREMENTS = [
  { label: 'Core HCI Courses',           earned: '4/4',   credits: '1 from each area',  done: true },
  { label: 'Technical Electives',         earned: '9/9',   credits: '9 credits',         done: true },
  { label: 'Research Methods',            earned: '3/6',   credits: '6 credits',         done: false },
  { label: 'Creative Component / Thesis', earned: '0/3',   credits: '3 credits',         done: false },
  { label: 'Total Credits',              earned: `${EARNED_CREDITS}/${TOTAL_REQUIRED}`, credits: `${TOTAL_REQUIRED} required`, done: EARNED_CREDITS >= TOTAL_REQUIRED },
];

const REMAINING = [
  { code: 'HCI 5220', name: 'Scientific Methods in HCI', credits: 3, status: 'In Progress — Spring 2026' },
  { code: 'HCI 5990', name: 'Creative Component',        credits: 3, status: 'Planned — Fall 2026' },
];

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
                <MapPin className="w-3.5 h-3.5 shrink-0" />HCI — Human-Computer Interaction
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />M.S. · Expected Fall '26
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
  const semesters = useMemo(() => {
    const map = new Map<string, CompletedCourse[]>();
    for (const c of COMPLETED_COURSES) {
      const list = map.get(c.semester) ?? [];
      list.push(c);
      map.set(c.semester, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Major & Degree */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
          <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Major & Degree</h3>
        </div>
        <div className="grid grid-cols-2">
          {[
            { label: 'Major', value: 'Human-Computer Interaction' },
            { label: 'Minor', value: 'Psychology & Cognitive Science' },
            { label: 'Academic Level', value: 'Graduate (Year 2)' },
            { label: 'Expected Graduation', value: 'December 2026' },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-[var(--color-border-default)] px-6 py-4 even:border-l border-[var(--color-border-default)]/60">
              <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{label}</p>
              <p className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mt-1.5 leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Enrolled */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
          <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Currently Enrolled</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-cardinal)]/6 text-[var(--color-brand-cardinal)] text-[var(--text-2xs)] font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand-cardinal)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-brand-cardinal)]" />
            </span>
            Spring 2026
          </span>
        </div>

        {/* Header row — labels like Major & Degree */}
        <div className="grid grid-cols-[minmax(88px,100px)_1fr_minmax(120px,160px)_minmax(72px,88px)] gap-4 px-6 py-3 bg-[var(--color-neutral-100)] border-b border-[var(--color-border-default)]">
          {['Course Code', 'Course Name', 'Category', 'Credits'].map((h) => (
            <span key={h} className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{h}</span>
          ))}
        </div>

        {CURRENT_COURSES.map((course, i) => {
          const cat = CATEGORY_STYLE[course.category];
          return (
            <div
              key={course.code}
              className={cn(
                'grid grid-cols-[minmax(88px,100px)_1fr_minmax(120px,160px)_minmax(72px,88px)] gap-4 items-center px-6 py-3.5 border-b border-[var(--color-border-default)] transition-colors hover:bg-[var(--color-neutral-50)]/80',
                i === CURRENT_COURSES.length - 1 && 'border-b-0',
              )}
            >
              <span className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-800)] truncate min-w-0">{course.code}</span>
              <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)] truncate min-w-0">{course.name}</span>
              <div className="min-w-0">
                <span className={cn('inline-block text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', cat.bg, cat.text)} title={course.category.replace(' Core', '')}>
                  {course.category.replace(' Core', '')}
                </span>
              </div>
              <span className="text-[var(--text-sm)] text-[var(--color-neutral-500)] tabular-nums whitespace-nowrap shrink-0">{course.credits} credits</span>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border-default)]/50 bg-[var(--color-neutral-50)]/40">
          <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)]">Semester Total</span>
          <span className="text-[var(--text-base)] font-bold text-[var(--color-neutral-800)] tabular-nums">{IN_PROGRESS_CREDITS} credits</span>
        </div>
      </div>

      {/* Completed Courses — flat table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
          <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Completed Courses</h3>
          <span className="text-[var(--text-sm)] text-[var(--color-neutral-400)]">
            {COMPLETED_COURSES.length} courses · {EARNED_CREDITS} credits · GPA {GPA.toFixed(2)}
          </span>
        </div>

        {/* Header row — labels like Major & Degree */}
        <div className="grid grid-cols-[minmax(88px,100px)_1fr_minmax(120px,160px)_minmax(82px,100px)_minmax(44px,56px)_minmax(72px,88px)] gap-4 px-6 py-3 bg-[var(--color-neutral-100)] border-b border-[var(--color-border-default)]">
          {['Course Code', 'Course Name', 'Category', 'Semester', 'Grade', 'Credits'].map((h) => (
            <span key={h} className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{h}</span>
          ))}
        </div>

        {/* Rows grouped by semester */}
        {semesters.map(([semester, courses], si) => (
          <div key={semester}>
            {courses.map((course, ci) => {
              const cat = CATEGORY_STYLE[course.category];
              const isLast = si === semesters.length - 1 && ci === courses.length - 1;
              return (
                <div
                  key={course.code}
                  className={cn(
                    'grid grid-cols-[minmax(88px,100px)_1fr_minmax(120px,160px)_minmax(82px,100px)_minmax(44px,56px)_minmax(72px,88px)] gap-4 items-center px-6 py-3.5 border-b border-[var(--color-border-default)] transition-colors hover:bg-[var(--color-neutral-50)]/80',
                    isLast && 'border-b-0',
                  )}
                >
                  <span className="text-[var(--text-sm)] font-bold text-[var(--color-neutral-800)] truncate min-w-0">{course.code}</span>
                  <span className="text-[var(--text-sm)] text-[var(--color-neutral-600)] truncate min-w-0">{course.name}</span>
                  <div className="min-w-0">
                    <span className={cn('inline-block text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', cat.bg, cat.text)} title={course.category.replace(' Core', '')}>
                      {course.category.replace(' Core', '')}
                    </span>
                  </div>
                  <span className="text-[var(--text-sm)] text-[var(--color-neutral-500)] whitespace-nowrap shrink-0">{course.semester}</span>
                  <span className="text-[var(--text-sm)] font-bold text-[var(--color-brand-cardinal)] tabular-nums shrink-0">{course.grade}</span>
                  <span className="text-[var(--text-sm)] text-[var(--color-neutral-500)] tabular-nums whitespace-nowrap shrink-0">{course.credits} credits</span>
                </div>
              );
            })}
          </div>
        ))}

        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border-default)]/50 bg-[var(--color-neutral-50)]/40">
          <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)]">Total Earned</span>
          <span className="text-[var(--text-base)] font-bold text-[var(--color-neutral-800)] tabular-nums">{EARNED_CREDITS} credits</span>
        </div>
      </div>

      {/* Advisor */}
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)] mb-5">Advisor Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Assigned Advisor</p>
            <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-800)] mt-1">Dr. Stephen Gilbert</p>
          </div>
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Contact</p>
            <a href="mailto:s.gilbert@iastate.edu" className="text-[var(--text-base)] font-semibold text-[var(--color-brand-cardinal)] hover:underline mt-1 inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />s.gilbert@iastate.edu
            </a>
          </div>
          <div>
            <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-wider">Academic Standing</p>
            <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-800)] mt-1">Good Standing</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AIPreferencesSection() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [courseRecs, setCourseRecs] = useState(true);
  const [studyPlan, setStudyPlan] = useState(false);
  const [noTraining, setNoTraining] = useState(true);
  const [anonymize, setAnonymize] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">AI Assistance</h3>
          <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-0.5">Enable AI-powered features across the portal to help with your studies.</p>
        </div>
        <Toggle checked={aiEnabled} onChange={setAiEnabled} />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)] mb-1">Features</h3>
        <div className="divide-y divide-[var(--color-border-default)]/40">
          {[
            { label: 'Course Recommendations', desc: 'Personalized course suggestions based on your progress and interests.', checked: courseRecs, onChange: setCourseRecs },
            { label: 'Study Plan Generation', desc: 'Automatically create optimized semester schedules.', checked: studyPlan, onChange: setStudyPlan },
          ].map(({ label, desc, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between py-4">
              <div className="pr-6">
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]">{label}</p>
                <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] mt-0.5">{desc}</p>
              </div>
              <Toggle checked={checked} onChange={onChange} disabled={!aiEnabled} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <h3 className="text-[var(--text-md)] font-bold text-[var(--color-neutral-900)] mb-1">Data Privacy</h3>
        <div className="divide-y divide-[var(--color-border-default)]/40">
          {[
            { label: 'Do not use my data for training', desc: 'Your academic data will never be used to improve underlying AI models.', checked: noTraining, onChange: setNoTraining },
            { label: 'Anonymize data exports', desc: 'Remove personal identifiers when sending queries to external partners.', checked: anonymize, onChange: setAnonymize },
          ].map(({ label, desc, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between py-4">
              <div className="pr-6">
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]">{label}</p>
                <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] mt-0.5">{desc}</p>
              </div>
              <Toggle checked={checked} onChange={onChange} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GraduationProgressSection() {
  const pct = Math.round((EARNED_CREDITS / TOTAL_REQUIRED) * 100);
  const doneCount = GRAD_REQUIREMENTS.filter((r) => r.done).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="glass-panel rounded-2xl overflow-hidden px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Degree Completion</h3>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-0.5">M.S. in Human-Computer Interaction</p>
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
            <span className="text-[var(--text-sm)] text-[var(--color-neutral-400)]">{doneCount} / {GRAD_REQUIREMENTS.length} completed</span>
          </div>
          <div className="space-y-0.5">
            {GRAD_REQUIREMENTS.map((req, i) => (
              <motion.div key={req.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--color-neutral-50)] transition-colors">
                <div className="flex items-center gap-2.5">
                  {req.done ? <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-cardinal)]" /> : <Circle className="w-4 h-4 text-[var(--color-neutral-300)]" />}
                  <div>
                    <p className={cn('text-[var(--text-base)] font-medium', req.done ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-neutral-800)]')}>{req.label}</p>
                    <p className="text-[var(--text-2xs)] text-[var(--color-neutral-400)]">{req.credits}</p>
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

type SectionId = 'academic' | 'ai' | 'graduation';

export default function StudentProfile() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const activeSection: SectionId = useMemo(() => {
    if (sectionParam === 'ai') return 'ai';
    if (sectionParam === 'graduation') return 'graduation';
    return 'academic';
  }, [sectionParam]);

  return (
    <DashboardLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        <motion.div variants={fadeUp}><ProfileHero /></motion.div>
        <motion.div variants={fadeUp} key={activeSection}>
          {activeSection === 'academic' && <AcademicInfoSection />}
          {activeSection === 'ai' && <AIPreferencesSection />}
          {activeSection === 'graduation' && <GraduationProgressSection />}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
