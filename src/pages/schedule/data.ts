import { COMPLETED_COURSES, TOTAL_REQUIRED } from '@/lib/student';

export type WorkloadLevel = 'low' | 'moderate' | 'high';

export interface ScheduledCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  instructor: string;
  location: string;
  workload: WorkloadLevel;
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[];
  startHour: number;   // 24h format, e.g. 9 = 9:00 AM
  startMin: number;
  endHour: number;
  endMin: number;
  color: string;       // CSS var reference
  prerequisites: string[];
}

export interface Semester {
  id: string;
  label: string;
  year: number;
  courses: ScheduledCourse[];
}

export interface PrerequisiteStatus {
  courseCode: string;
  prerequisite: string;
  met: boolean;
}

export interface GraduationCategory {
  label: string;
  current: number;
  required: number;
  complete: boolean;
}

const WORKLOAD_CONFIG: Record<WorkloadLevel, { bg: string; border: string; text: string; label: string }> = {
  low:      { bg: 'bg-[var(--color-success-light)]',  border: 'border-[var(--color-success)]/30', text: 'text-[var(--color-success)]', label: 'Low' },
  moderate: { bg: 'bg-[var(--color-warning-light)]',  border: 'border-[var(--color-warning)]/30', text: 'text-[var(--color-warning)]', label: 'Moderate' },
  high:     { bg: 'bg-[var(--color-error-light)]',    border: 'border-[var(--color-error)]/30',   text: 'text-[var(--color-error)]',   label: 'High' },
};

export function getWorkloadConfig(level: WorkloadLevel) {
  return WORKLOAD_CONFIG[level];
}

export const SEMESTERS: Semester[] = [
  {
    id: 'spring-2026',
    label: 'Spring 2026',
    year: 2026,
    courses: [
      {
        id: 'hci5750-sp26',
        code: 'HCI 5750',
        name: 'Computational Perception',
        credits: 3,
        instructor: 'Dr. James Oliver',
        location: 'Hoover 1213',
        workload: 'high',
        days: ['Tue', 'Thu'],
        startHour: 9, startMin: 0,
        endHour: 10, endMin: 20,
        color: 'var(--color-brand-cardinal)',
        prerequisites: ['HCI 5210'],
      },
      {
        id: 'hci5300x-sp26',
        code: 'HCI 5300X',
        name: 'Perspectives in HCI',
        credits: 3,
        instructor: 'Dr. Stephen Gilbert',
        location: 'Pearson 1105',
        workload: 'moderate',
        days: ['Mon', 'Wed'],
        startHour: 10, startMin: 0,
        endHour: 11, endMin: 20,
        color: 'var(--color-warning)',
        prerequisites: [],
      },
      {
        id: 'hci5220-sp26',
        code: 'HCI 5220',
        name: 'Scientific Methods in HCI',
        credits: 3,
        instructor: 'Dr. Liang Shan',
        location: 'Pearson 2145',
        workload: 'moderate',
        days: ['Mon', 'Wed', 'Fri'],
        startHour: 13, startMin: 0,
        endHour: 13, endMin: 50,
        color: 'var(--color-info)',
        prerequisites: ['HCI 5790X'],
      },
    ],
  },
  {
    id: 'fall-2026',
    label: 'Fall 2026',
    year: 2026,
    courses: [
      {
        id: 'hci5990-fa26',
        code: 'HCI 5990',
        name: 'Creative Component',
        credits: 3,
        instructor: 'Dr. Stephen Gilbert',
        location: 'By Arrangement',
        workload: 'high',
        days: ['Fri'],
        startHour: 10, startMin: 0,
        endHour: 12, endMin: 50,
        color: 'var(--color-brand-cardinal)',
        prerequisites: ['HCI 5300X', 'HCI 5220'],
      },
    ],
  },
];

export function getPrerequisiteStatuses(courses: ScheduledCourse[]): PrerequisiteStatus[] {
  const statuses: PrerequisiteStatus[] = [];
  for (const course of courses) {
    for (const prereq of course.prerequisites) {
      statuses.push({
        courseCode: course.code,
        prerequisite: prereq,
        met: COMPLETED_COURSES.includes(prereq),
      });
    }
  }
  return statuses;
}

export interface TimeConflict {
  courseA: string;
  courseB: string;
  day: string;
  overlapStart: string;
  overlapEnd: string;
}

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function detectTimeConflicts(courses: ScheduledCourse[]): TimeConflict[] {
  const conflicts: TimeConflict[] = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];
      const sharedDays = a.days.filter((d) => b.days.includes(d));
      for (const day of sharedDays) {
        const aStart = a.startHour * 60 + a.startMin;
        const aEnd = a.endHour * 60 + a.endMin;
        const bStart = b.startHour * 60 + b.startMin;
        const bEnd = b.endHour * 60 + b.endMin;
        if (aStart < bEnd && bStart < aEnd) {
          const overlapStart = Math.max(aStart, bStart);
          const overlapEnd = Math.min(aEnd, bEnd);
          conflicts.push({
            courseA: a.code,
            courseB: b.code,
            day,
            overlapStart: formatTime(Math.floor(overlapStart / 60), overlapStart % 60),
            overlapEnd: formatTime(Math.floor(overlapEnd / 60), overlapEnd % 60),
          });
        }
      }
    }
  }
  return conflicts;
}

export function getGraduationRequirements(allSemesters: Semester[]): GraduationCategory[] {
  const allCourses = allSemesters.flatMap((s) => s.courses);
  const allCodes = [...COMPLETED_COURSES, ...allCourses.map((c) => c.code)];
  const uniqueCodes = [...new Set(allCodes)];

  const coreHCI = ['HCI 5210', 'ARTGR 5300', 'HCI 5840', 'HCI 5790X', 'HCI 5890'];
  const coreCompleted = coreHCI.filter((c) => uniqueCodes.includes(c)).length;

  const electives = ['HCI 5900', 'STAT 5010', 'HCI 5260'];
  const electivesTaken = electives.filter((c) => uniqueCodes.includes(c)).length;

  const researchCourses = ['HCI 5040', 'HCI 5220'];
  const researchTaken = researchCourses.filter((c) => uniqueCodes.includes(c)).length;

  const totalCreditsEarned = COMPLETED_COURSES.length * 3;
  const totalCreditsPlanned = allCourses.length * 3;
  const total = totalCreditsEarned + totalCreditsPlanned;

  return [
    { label: 'Core HCI Courses', current: coreCompleted, required: 5, complete: coreCompleted >= 5 },
    { label: 'Technical Electives', current: Math.min(electivesTaken, 3), required: 3, complete: electivesTaken >= 3 },
    { label: 'Research Credits', current: Math.min(researchTaken * 3, 3), required: 3, complete: researchTaken >= 1 },
    { label: 'Total Credits', current: Math.min(total, TOTAL_REQUIRED), required: TOTAL_REQUIRED, complete: total >= TOTAL_REQUIRED },
  ];
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

export function formatHour(h: number): string {
  if (h === 0 || h === 12) return '12:00';
  return h > 12 ? `${h - 12}:00` : `${h}:00`;
}

export function formatHourAmPm(h: number): string {
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${ampm}`;
}
