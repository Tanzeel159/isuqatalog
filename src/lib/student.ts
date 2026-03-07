export interface CourseEntry {
  code: string;
  name: string;
  credits: number;
}

export interface DegreeRequirement {
  label: string;
  earned: string;
  done: boolean;
  courses?: CourseEntry[];
}

export interface SemesterPlan {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'planned';
  credits: number;
  courses: string[];
}

// ─── Current Semester ────────────────────────────────────────────────

export const CURRENT_COURSES: CourseEntry[] = [
  { code: 'HCI 5300', name: 'Perspectives of HCI', credits: 3 },
  { code: 'ARTGR 540', name: 'User Methodologies', credits: 3 },
  { code: 'HCI 5750', name: 'Usability Engineering', credits: 3 },
  { code: 'STAT 5010', name: 'Applied Statistics', credits: 3 },
];

// ─── Graduation Progress ─────────────────────────────────────────────

export const EARNED_CREDITS = 20;
export const TOTAL_REQUIRED = 36;
export const IN_PROGRESS_COUNT = 3;
export const GPA = 4.0;
export const ESTIMATED_GRAD = 'Spring 2027';
export const COMPLETION_PCT = Math.round((EARNED_CREDITS / TOTAL_REQUIRED) * 100);

// ─── Degree Requirements ─────────────────────────────────────────────

export const DEGREE_REQUIREMENTS: DegreeRequirement[] = [
  {
    label: 'Major Core requirements',
    earned: '8/8 credits',
    done: true,
    courses: [
      { code: 'HCI 5210', name: 'Cognitive Psychology of HCI', credits: 3 },
      { code: 'HCI 5840', name: 'Python Application Development', credits: 3 },
      { code: 'HCI 5790X', name: 'Methods for Interdisciplinary Research', credits: 3 },
      { code: 'HCI 5890', name: 'Design and Ethics', credits: 3 },
    ],
  },
  {
    label: 'Electives',
    earned: '6/12 credits',
    done: false,
    courses: [
      { code: 'HCI 5900', name: 'Managing UX Teams & Design Systems', credits: 3 },
      { code: 'STAT 5010', name: 'Applied Statistics', credits: 3 },
    ],
  },
  {
    label: 'Research Methods',
    earned: '3/6 credits',
    done: false,
    courses: [{ code: 'HCI 5040', name: 'Evaluating Tech-based Learning Env.', credits: 3 }],
  },
  {
    label: 'Capstone/Thesis',
    earned: '0/3 credits',
    done: false,
    courses: [],
  },
];

// ─── Semester Timeline ───────────────────────────────────────────────

export const TIMELINE_SEMESTERS: SemesterPlan[] = [
  {
    id: 'fall-2025',
    label: 'Fall 2025',
    status: 'completed',
    credits: 9,
    courses: ['HCI 560', 'STAT', 'CS'],
  },
  {
    id: 'spring-2026',
    label: 'Spring 2026',
    status: 'current',
    credits: 9,
    courses: ['HCI 5750', 'HCI 5300X', 'HCI 5220'],
  },
  {
    id: 'fall-2026',
    label: 'Fall 2026',
    status: 'planned',
    credits: 0,
    courses: [],
  },
  {
    id: 'spring-2027',
    label: 'Spring 2027',
    status: 'planned',
    credits: 0,
    courses: [],
  },
];

// ─── Computed helpers ────────────────────────────────────────────────

export const COMPLETED_COURSES = DEGREE_REQUIREMENTS.flatMap(
  (r) => r.courses?.map((c) => c.code) ?? [],
);

export const IN_PROGRESS_COURSES = TIMELINE_SEMESTERS
  .filter((s) => s.status === 'current')
  .flatMap((s) => s.courses);

/**
 * Serialized student profile for AI context.
 * Sent with every chat message so GPT knows who it's advising.
 */
export function getStudentContext(): string {
  const completedList = DEGREE_REQUIREMENTS
    .flatMap((r) => r.courses ?? [])
    .map((c) => `${c.code} — ${c.name}`)
    .join(', ');

  const currentList = CURRENT_COURSES.map((c) => `${c.code} — ${c.name}`).join(', ');

  const reqSummary = DEGREE_REQUIREMENTS
    .map((r) => `${r.label}: ${r.earned} (${r.done ? 'complete' : 'in progress'})`)
    .join('; ');

  return [
    `Student Profile:`,
    `- Program: MS in HCI (Human-Computer Interaction), Iowa State University`,
    `- GPA: ${GPA}`,
    `- Credits: ${EARNED_CREDITS}/${TOTAL_REQUIRED} earned (${COMPLETION_PCT}% complete)`,
    `- Estimated graduation: ${ESTIMATED_GRAD}`,
    `- Currently enrolled (Spring 2026): ${currentList}`,
    `- Completed courses: ${completedList}`,
    `- Degree requirements: ${reqSummary}`,
    `- Remaining: ${TOTAL_REQUIRED - EARNED_CREDITS} credits needed (electives, research, capstone)`,
  ].join('\n');
}
