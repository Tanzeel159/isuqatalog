export type CourseCategory =
  | 'Design Core'
  | 'Implementation Core'
  | 'Phenomena Core'
  | 'Evaluation Core'
  | 'Elective';

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

export interface CompletedCourseRecord extends CourseEntry {
  semester: string;
  grade: string;
  category: CourseCategory;
}

export interface CurrentCourseRecord extends CourseEntry {
  semester: string;
  category: CourseCategory;
}

export interface SavedCourseRecord {
  code: string;
  targetSemester: string;
  savedReason: string;
}

export interface StudentAcademicProfile {
  major: string;
  minor: string;
  academicLevel: string;
  degree: string;
  degreeTrack: string;
  concentration: string;
  year: string;
  expectedGraduation: string;
  interests: string[];
  advisor: {
    name: string;
    email: string;
    standing: string;
  };
  qatalogId: string;
}

export const STUDENT_ACADEMIC_PROFILE: StudentAcademicProfile = {
  major: 'Human-Computer Interaction',
  minor: 'Psychology & Cognitive Science',
  academicLevel: 'Graduate',
  degree: 'M.S. in Human-Computer Interaction',
  degreeTrack: 'Creative Component',
  concentration: 'UX Research & Design',
  year: 'Year 1',
  expectedGraduation: 'May 2027',
  interests: [
    'UX Research',
    'Interaction Design',
    'Learning Technologies',
    'Accessibility',
    'XR / Immersive Interfaces',
    'Design Systems',
  ],
  advisor: {
    name: 'Dr. Stephen Gilbert',
    email: 's.gilbert@iastate.edu',
    standing: 'Good Standing',
  },
  qatalogId: 'ISU-HCI-24017',
};

export const COMPLETED_COURSE_HISTORY: CompletedCourseRecord[] = [
  { code: 'HCI 5210', name: 'Cognitive Psychology of HCI', semester: 'Fall 2025', grade: 'A', credits: 3, category: 'Design Core' },
  { code: 'HCI 5840', name: 'Python Application Development', semester: 'Fall 2025', grade: 'A-', credits: 3, category: 'Implementation Core' },
  { code: 'HCI 5040', name: 'Evaluating Tech-based Learning Env.', semester: 'Fall 2025', grade: 'A', credits: 3, category: 'Evaluation Core' },
];

export const CURRENT_ENROLLMENTS: CurrentCourseRecord[] = [
  { code: 'ARTGR 5300', name: 'User Engagement', credits: 3, category: 'Design Core', semester: 'Spring 2026' },
  { code: 'HCI 5890', name: 'Design and Ethics', credits: 3, category: 'Phenomena Core', semester: 'Spring 2026' },
  { code: 'HCI 5260', name: 'Design Ethnography', credits: 3, category: 'Elective', semester: 'Spring 2026' },
];

export const SAVED_COURSES: SavedCourseRecord[] = [
  { code: 'HCI 6550', targetSemester: 'Fall 2026', savedReason: 'Saved from AI suggestion: completes the phenomena core with an organizational HCI focus' },
  { code: 'HCI 5400X', targetSemester: 'Fall 2026', savedReason: 'Saved from AI suggestion: matches your XR & machine learning interest' },
  { code: 'PSYCH 5010', targetSemester: 'Fall 2026', savedReason: 'Saved from catalog: strengthens evaluation methodology' },
  { code: 'HCI 6030', targetSemester: 'Spring 2027', savedReason: 'Saved from AI suggestion: aligns with learning environments focus' },
  { code: 'HCI 5990', targetSemester: 'Spring 2027', savedReason: 'Capstone placeholder for the creative component semester' },
];

export const CURRENT_COURSES: CourseEntry[] = CURRENT_ENROLLMENTS.map(({ code, name, credits }) => ({
  code,
  name,
  credits,
}));

const GRADE_MAP: Record<string, number> = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
};

function computeGpa(courses: CompletedCourseRecord[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const course of courses) {
    const points = GRADE_MAP[course.grade];
    if (points !== undefined) {
      totalPoints += points * course.credits;
      totalCredits += course.credits;
    }
  }
  return totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(2) : 0;
}

// ─── Graduation Progress ─────────────────────────────────────────────

export const TOTAL_REQUIRED = 30;
export const EARNED_CREDITS = COMPLETED_COURSE_HISTORY.reduce((sum, c) => sum + c.credits, 0);
export const IN_PROGRESS_CREDITS = CURRENT_ENROLLMENTS.reduce((sum, c) => sum + c.credits, 0);
export const IN_PROGRESS_COUNT = CURRENT_ENROLLMENTS.length;
export const GPA = computeGpa(COMPLETED_COURSE_HISTORY);
export const ESTIMATED_GRAD = STUDENT_ACADEMIC_PROFILE.expectedGraduation;
export const COMPLETION_PCT = Math.round((EARNED_CREDITS / TOTAL_REQUIRED) * 100);

// ─── Degree Requirements ─────────────────────────────────────────────

export const DEGREE_REQUIREMENTS: DegreeRequirement[] = [
  {
    label: 'Major Core requirements',
    earned: '6/15 credits',
    done: false,
    courses: [
      { code: 'HCI 5210', name: 'Cognitive Psychology of HCI', credits: 3 },
      { code: 'ARTGR 5300', name: 'User Engagement', credits: 3 },
      { code: 'HCI 5840', name: 'Python Application Development', credits: 3 },
      { code: 'HCI 5890', name: 'Design and Ethics', credits: 3 },
      { code: 'HCI 6550', name: 'Organizational and Social Implications of HCI', credits: 3 },
    ],
  },
  {
    label: 'Electives',
    earned: '0/9 credits',
    done: false,
    courses: [
      { code: 'HCI 5260', name: 'Design Ethnography', credits: 3 },
      { code: 'STAT 5010', name: 'Applied Statistics', credits: 3 },
      { code: 'PSYCH 5010', name: 'Foundations of Behavioral Research', credits: 3 },
    ],
  },
  {
    label: 'Research Methods',
    earned: '3/3 credits',
    done: true,
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
    courses: ['HCI 5210', 'HCI 5840', 'HCI 5040'],
  },
  {
    id: 'spring-2026',
    label: 'Spring 2026',
    status: 'current',
    credits: 9,
    courses: ['ARTGR 5300', 'HCI 5890', 'HCI 5260'],
  },
  {
    id: 'fall-2026',
    label: 'Fall 2026',
    status: 'planned',
    credits: 9,
    courses: ['HCI 6550', 'HCI 5400X', 'PSYCH 5010'],
  },
  {
    id: 'spring-2027',
    label: 'Spring 2027',
    status: 'planned',
    credits: 3,
    courses: ['HCI 5990'],
  },
];

// ─── Computed helpers ────────────────────────────────────────────────

export const COMPLETED_COURSES = COMPLETED_COURSE_HISTORY.map((course) => course.code);

export const IN_PROGRESS_COURSES = CURRENT_ENROLLMENTS.map((course) => course.code);

/**
 * Serialized student profile for AI context.
 * Sent with every chat message so GPT knows who it's advising.
 */
export function getStudentContext(): string {
  const completedList = COMPLETED_COURSE_HISTORY
    .map((c) => `${c.code} — ${c.name} (${c.grade}, ${c.semester})`)
    .join(', ');

  const currentList = CURRENT_ENROLLMENTS
    .map((c) => `${c.code} — ${c.name} (${c.semester})`)
    .join(', ');

  const reqSummary = DEGREE_REQUIREMENTS
    .map((r) => `${r.label}: ${r.earned} (${r.done ? 'complete' : 'in progress'})`)
    .join('; ');

  return [
    'Student Profile:',
    `- Program: ${STUDENT_ACADEMIC_PROFILE.degree}, Iowa State University`,
    `- Major: ${STUDENT_ACADEMIC_PROFILE.major}`,
    `- Minor: ${STUDENT_ACADEMIC_PROFILE.minor}`,
    `- Level: ${STUDENT_ACADEMIC_PROFILE.academicLevel} (${STUDENT_ACADEMIC_PROFILE.year})`,
    `- Degree track: ${STUDENT_ACADEMIC_PROFILE.degreeTrack}`,
    `- Concentration: ${STUDENT_ACADEMIC_PROFILE.concentration}`,
    `- Interests: ${STUDENT_ACADEMIC_PROFILE.interests.join(', ')}`,
    `- GPA: ${GPA}`,
    `- Credits: ${EARNED_CREDITS}/${TOTAL_REQUIRED} earned (${COMPLETION_PCT}% complete)`,
    `- Estimated graduation: ${ESTIMATED_GRAD}`,
    `- Currently enrolled: ${currentList}`,
    `- Completed courses: ${completedList}`,
    `- Degree requirements: ${reqSummary}`,
    `- Saved courses: ${SAVED_COURSES.map((c) => `${c.code} (${c.savedReason})`).join(', ')}`,
    `- Remaining: ${TOTAL_REQUIRED - EARNED_CREDITS} credits needed`,
  ].join('\n');
}
