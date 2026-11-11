export type MetricsGame = "neonflow" | "tetrilogic";
export interface MetricsFilter {
  from: string;
  to: string;
  group: string;
  grade: string;
  game: MetricsGame | "";
  student: string;
}

export interface MetricsOptions {
  institution: boolean;
  groups: { id: string; name: string }[];
  students: { id: string; name: string; grade: string; groups: string[] }[];
}

export interface MetricsSummary {
  students: number;
  active: number;
  stars: number;
  averageStars: number | null;
  achievements: number;
  averageAchievements: number | null;
  initiated: number;
  completed: number;
  completionRate: number | null;
  averageAttempts: number | null;
  sessions: number;
  successfulSessions: number;
  averageSessionSeconds: number | null;
  studentsWithProgress: number;
  studentsCompletingInPeriod: number;
  completedStudentRate: number | null;
  averageActiveDays: number | null;
}

export interface MetricsStudent {
  id: string;
  name: string;
  grade: string;
  days: number;
  stars: number;
  achievements: number;
  sessions: number;
  initiated: number;
  completed: number;
  advice: number;
  completionRate: number | null;
  averageAttempts: number | null;
  averageSessionSeconds: number | null;
  neonflowLevels: number;
  tetrilogicLevels: number;
}

export interface MetricsComparison {
  kind: "classroom" | "grade";
  id: string;
  name: string;
  students: number;
  active: number;
  stars: number;
  average_stars: number;
  achievements: number;
  average_achievements: number;
  completed: number;
  initiated: number;
  completion_rate: number | null;
}

export interface MetricsCourse {
  game: MetricsGame;
  name: string;
  sessions: number;
  initiated: number;
  completed: number;
  students_with_progress: number;
  active: number;
  progress: number | null;
}

export interface MetricsDimension {
  dimension: string;
  initiated: number;
  solved: number;
  completion_rate: number | null;
  average_attempts: number | null;
  average_stars: number | null;
  solved_per_student: number | null;
  average_seconds: number | null;
  timeline: { day: string; sessions: number; solved: number; completion_rate: number }[];
  comparisons: { kind: MetricsComparison["kind"]; id: string; name: string; initiated: number; solved: number;
    completion_rate: number; average_attempts: number | null; average_stars: number | null }[];
}

export interface MetricsReport {
  from: string;
  to: string;
  bucket: "day" | "week";
  summary: MetricsSummary;
  students: MetricsStudent[];
  comparisons: MetricsComparison[];
  courses: MetricsCourse[];
  timeline: { day: string; game: MetricsGame; sessions: number; solved: number; active: number }[];
  dimensions: MetricsDimension[];
  unclassifiedAttempts: number;
  tutor: {
    total: number;
    average: number | null;
    fixed: number;
    generated: number;
    contextual: number;
    unclassified: number;
    extra: number;
    studentsUsingAi: number;
    aiStudentRate: number | null;
    studentsOverFreeLimit: number;
    victories: { with_advice: boolean; victories: number; average_stars: number }[];
  };
  starDistribution: { stars: number; count: number }[];
  achievementDistribution: { achievements: number; count: number }[];
}
