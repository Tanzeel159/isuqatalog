export type CourseCategory = 'Design Core' | 'Implementation Core' | 'Phenomena Core' | 'Evaluation Core' | 'Elective';

export interface Offering {
  term: string;
  instructor?: string;
  rating?: number;
  difficulty?: number;
  wouldTakeAgain?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  category: CourseCategory;
  credits: string;
  delivery: string;
  crossListed?: string;
  offerings: Offering[];
}

export const DEPARTMENT_LIST = [
  { id: 'hci', code: 'HCI', name: 'Human-Computer Interaction', accent: '#C8102E' },
  { id: 'ae', code: 'AE', name: 'Aerospace Engineering', accent: '#006BA6' },
  { id: 'ba', code: 'BA', name: 'Business Administration', accent: '#76881D' },
  { id: 'psych', code: 'PSYCH', name: 'Psychology', accent: '#9A3324' },
  { id: 'art', code: 'ART', name: 'Art & Design', accent: '#BE531C' },
  { id: 'idd', code: 'IDD', name: 'Interdisciplinary Design', accent: '#003D4C' },
] as const;

export const DEPARTMENTS: Record<string, string> = Object.fromEntries(
  DEPARTMENT_LIST.map((d) => [d.id, d.code]),
);

export const ALL_CATEGORIES: CourseCategory[] = [
  'Design Core',
  'Implementation Core',
  'Phenomena Core',
  'Evaluation Core',
  'Elective',
];

export const CATEGORY_CONFIG: Record<
  CourseCategory,
  { label: string; bgClass: string; textClass: string; color: string }
> = {
  'Design Core': { label: 'Design Core', bgClass: 'bg-[var(--color-brand-cardinal-light)]', textClass: 'text-[var(--color-brand-cardinal)]', color: 'var(--color-brand-cardinal)' },
  'Implementation Core': { label: 'Implementation Core', bgClass: 'bg-[var(--color-info-light)]', textClass: 'text-[var(--color-info)]', color: 'var(--color-info)' },
  'Phenomena Core': { label: 'Phenomena Core', bgClass: 'bg-[var(--color-warning-light)]', textClass: 'text-[var(--color-warning)]', color: 'var(--color-warning)' },
  'Evaluation Core': { label: 'Evaluation Core', bgClass: 'bg-[var(--color-success-light)]', textClass: 'text-[var(--color-success)]', color: 'var(--color-success)' },
  Elective: { label: 'Elective', bgClass: 'bg-[var(--color-neutral-50)]', textClass: 'text-[var(--color-neutral-500)]', color: 'var(--color-neutral-400)' },
};

export const LEVELS = ['Undergraduate', 'Graduate'] as const;
export const SEMESTERS = ['ALL', 'FALL 2025', 'SPRING 2026'] as const;
export const DELIVERY_MODES = ['ALL', 'Online', 'In-Person', 'In-Person & Online'] as const;

export function courseLevel(code: string): 'Undergraduate' | 'Graduate' {
  const num = parseInt(code.replace(/[^\d]/g, ''));
  return num >= 5000 ? 'Graduate' : 'Undergraduate';
}

export function getWorkload(course: Course): number {
  const diffs = course.offerings
    .map((o) => o.difficulty)
    .filter((d): d is number => d != null);
  if (diffs.length === 0) return 3;
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

export function getAvgRating(course: Course): number | null {
  const ratings = course.offerings
    .map((o) => o.rating)
    .filter((r): r is number => r != null);
  if (ratings.length === 0) return null;
  return +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}

export const HCI_COURSES: Course[] = [
  { id: 'hci5210', code: 'HCI 5210', name: 'Cognitive Psychology of Human Computer Interaction', description: 'Biological, behavioral, perceptual, cognitive and social issues relevant to human computer interactions.', category: 'Design Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'PSYCH', offerings: [{ term: 'FALL 2025', instructor: 'Racheal Ruble', rating: 4.5, difficulty: 1.8, wouldTakeAgain: '100%' }] },
  { id: 'artgr5300', code: 'ARTGR 5300', name: 'User Engagement', description: 'The exploration and design of interface/interaction with products, systems, and technologies.', category: 'Design Core', credits: '3', delivery: 'In-Person', offerings: [{ term: 'FALL 2025', instructor: 'Aaron Yang' }] },
  { id: 'ie5720', code: 'IE 5720', name: 'Design and Evaluation of Human-Computer Interaction', description: 'Human factors methods applied to interface requirements, design, prototyping, and evaluation of a wide variety of interfaces.', category: 'Design Core', credits: '3', delivery: 'In-Person & Online', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5840', code: 'HCI 5840', name: 'Python Application Development in HCI', description: "Implement Python code and write design documents in development of a large Python project of the student's choosing.", category: 'Implementation Core', credits: '3', delivery: 'Online', offerings: [{ term: 'FALL 2025', instructor: 'Chris Harding', rating: 4.8, difficulty: 1.5, wouldTakeAgain: '100%' }] },
  { id: 'hci5400x', code: 'HCI 5400X', name: 'Internet-Based Methods, XR, and Machine Learning', description: 'Developing and deploying internet-based computational resources. Extended reality technologies and ML/AI for internet-based solutions.', category: 'Implementation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'ME', offerings: [{ term: 'FALL 2025', instructor: 'Eliot Winer', rating: 3.9, difficulty: 2.5, wouldTakeAgain: '88%' }] },
  { id: 'hci5800', code: 'HCI 5800', name: 'Virtual Environments, Virtual Worlds, and Application', description: 'A systematic introduction to Virtual Environments, Virtual Worlds, advanced displays and immersive technologies.', category: 'Implementation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'ME', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5750', code: 'HCI 5750', name: 'Computational Perception', description: 'Statistical and algorithmic methods for sensing, recognizing, and interpreting the activities of people by a computer.', category: 'Implementation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'COMS/CPRE', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5250', code: 'HCI 5250', name: 'Optimization Methods for Complex Designs', description: 'Review of optimization methods from traditional nonlinear to modern evolutionary methods such as Genetic algorithms.', category: 'Implementation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'ME', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'me5570', code: 'ME 5570', name: 'Computer Graphics and Geometric Modeling', description: 'Fundamentals of computer graphics technology. Data structures. Parametric curve and surface modeling. Applications in engineering.', category: 'Implementation Core', credits: '3', delivery: 'In-Person', crossListed: 'COMS/CPRE', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5890', code: 'HCI 5890', name: 'Design and Ethics', description: 'Issues in ethics and decision-making as they relate to technology, design, design research, HCI, and the design industry.', category: 'Phenomena Core', credits: '3', delivery: 'Online', crossListed: 'ARTGR', offerings: [{ term: 'FALL 2025', instructor: 'Tina Rice' }, { term: 'SPRING 2026' }] },
  { id: 'hci6550', code: 'HCI 6550', name: 'Organizational and Social Implications of HCI', description: 'Examine opportunities and implications of information technologies and HCI on social and organizational systems.', category: 'Phenomena Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'MIS', offerings: [{ term: 'FALL 2025', instructor: 'Ronit Nayak' }, { term: 'SPRING 2026' }] },
  { id: 'hci5300x', code: 'HCI 5300X', name: 'Perspectives in HCI', description: 'Inclusive and humane design; the intersection of technology and race, gender, age, and class; technology around the world.', category: 'Phenomena Core', credits: '3', delivery: 'Online', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'artgr5400', code: 'ARTGR 5400', name: 'Design for Behavioral Change', description: 'The exploration and design of educational experiences and artifacts as they relate to social, emotional, and behavioral aspects.', category: 'Phenomena Core', credits: '3', delivery: 'In-Person', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5040', code: 'HCI 5040', name: 'Evaluating Technology-based Learning Environments', description: 'Principles and procedures to plan, design, and conduct effective evaluation studies (formative, summative, usability).', category: 'Evaluation Core', credits: '3', delivery: 'Online', crossListed: 'EDUC', offerings: [{ term: 'FALL 2025', instructor: 'Evrim Baran' }] },
  { id: 'hci5790x', code: 'HCI 5790X', name: 'Methods for Interdisciplinary Research', description: 'Introduction to qualitative, quantitative, and experimental methods for interdisciplinary research.', category: 'Evaluation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'ARCH', offerings: [{ term: 'FALL 2025', instructor: 'Kimberly Zarecor', rating: 3.0, difficulty: 3.3, wouldTakeAgain: '67%' }] },
  { id: 'psych5010', code: 'PSYCH 5010', name: 'Foundations of Behavioral Research', description: 'Ethical issues, research design, sampling design, measurement issues, power and precision analysis.', category: 'Evaluation Core', credits: '3', delivery: 'In-Person', offerings: [{ term: 'FALL 2025', instructor: 'Marcus Crede' }] },
  { id: 'hci5220', code: 'HCI 5220', name: 'Scientific Methods in Human Computer Interaction', description: 'Hypothesis testing, experimental design, analysis and interpretation of data, and ethical principles of human research in HCI.', category: 'Evaluation Core', credits: '3', delivery: 'In-Person & Online', crossListed: 'PSYCH', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5230x', code: 'HCI 5230X', name: 'Qualitative Research Methods in HCI', description: 'Introduction to qualitative research methods specific to HCI and UX research, from academic and industry perspectives.', category: 'Evaluation Core', credits: '3', delivery: 'In-Person & Online', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5900', code: 'HCI 5900', name: 'Special Topics: Managing UX Teams & Design Systems', description: 'Problem solving in digital transformation space and design systems. Students take the role of "head of product design".', category: 'Elective', credits: '3', delivery: 'Online', offerings: [{ term: 'FALL 2025', instructor: 'Mridu Kashyap' }] },
  { id: 'hci5260', code: 'HCI 5260', name: 'Design Ethnography', description: 'Hands-on introduction to ethnographic methods with a focus on design, HCI, user research, and applied domains.', category: 'Elective', credits: '3', delivery: 'In-Person & Online', crossListed: 'ANTHR', offerings: [{ term: 'FALL 2025', instructor: 'Ritwik Banerji' }] },
  { id: 'hci5960', code: 'HCI 5960', name: 'Emerging Practices in Human Computer Interaction', description: 'Innovative or newly emerging ideas within the HCI research field or applied industry practice.', category: 'Elective', credits: '3', delivery: 'Online', offerings: [{ term: 'FALL 2025', instructor: 'Ella Sympson' }] },
  { id: 'hci5100', code: 'HCI 5100', name: 'Foundations of Game-Based Learning', description: 'Theories, principles and best practices of utilizing games in educational environments.', category: 'Elective', credits: '3', delivery: 'Online', crossListed: 'EDUC', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci6030', code: 'HCI 6030', name: 'Advanced Learning Environments Design', description: 'Advanced aspects of the learning environments design process. Focus on current trends and production of educational technology.', category: 'Elective', credits: '3', delivery: 'Online', crossListed: 'EDUC', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5740', code: 'HCI 5740', name: 'Computational Implementation and Prototyping', description: 'Fundamental concepts of software programming and Python. Intended for graduate students without prior background.', category: 'Elective', credits: '3', delivery: 'In-Person & Online', offerings: [{ term: 'SPRING 2026' }] },
  { id: 'hci5500x', code: 'HCI 5500X', name: 'User Experience Methodologies', description: 'Fundamentals of lean user experience design, discovery and process.', category: 'Elective', credits: '3', delivery: 'Online', crossListed: 'ARTGR', offerings: [{ term: 'SPRING 2026' }] },
];
