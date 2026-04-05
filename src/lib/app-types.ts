import type { UploadedVideo } from "@/lib/videoApi";

export interface Checkpoint {
  id: string;
  time: number;
  label: string;
  question: string;
  options: string[];
  correctIndex: number;
  status: "upcoming" | "active" | "completed" | "incorrect";
}

export interface NavItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

export interface AppUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
}

export interface TranscriptSegment {
  time: number;
  text: string;
}

export interface NoteEntry {
  id: string;
  time: number;
  title: string;
  content: string;
}

export interface CourseSessionOptions {
  explanations: boolean;
  hints: boolean;
  queueReview: boolean;
  allowRetakes: boolean;
}

export interface CourseQuizSetup {
  questionTypes: string[];
  questionTarget: number;
  sessionOptions: CourseSessionOptions;
}

export interface CourseRecord extends UploadedVideo {
  quizSetup: CourseQuizSetup;
}

export const DEFAULT_COURSE_QUIZ_SETUP: CourseQuizSetup = {
  questionTypes: ["checkpoint"],
  questionTarget: 8,
  sessionOptions: {
    explanations: false,
    hints: false,
    queueReview: false,
    allowRetakes: false,
  },
};

export function normalizeCourseQuizSetup(
  setup?: Partial<CourseQuizSetup> | null,
): CourseQuizSetup {
  return {
    questionTypes:
      setup?.questionTypes && setup.questionTypes.length > 0
        ? setup.questionTypes
        : DEFAULT_COURSE_QUIZ_SETUP.questionTypes,
    questionTarget:
      typeof setup?.questionTarget === "number"
        ? setup.questionTarget
        : DEFAULT_COURSE_QUIZ_SETUP.questionTarget,
    sessionOptions: {
      ...DEFAULT_COURSE_QUIZ_SETUP.sessionOptions,
      ...setup?.sessionOptions,
    },
  };
}
