import {
  AppUser,
  Checkpoint,
  CourseRecord,
  CourseQuizSetup,
  DEFAULT_COURSE_QUIZ_SETUP,
  NoteEntry,
  TranscriptSegment,
  normalizeCourseQuizSetup,
} from "@/lib/app-types";

export interface CoursePresentation {
  title: string;
  moduleTitle: string;
  moduleLabel: string;
  summary: string;
  instructor: string;
  courseCode: string;
  durationLabel: string;
  tags: string[];
  transcriptSegments: TranscriptSegment[];
  noteEntries: NoteEntry[];
}

const questionTypeProfiles = {
  checkpoint: {
    label: "Checkpoint Quiz",
    question: (title: string) => `Which idea from ${title} should the learner be able to restate right now?`,
    options: (title: string) => [
      `The main concept introduced in ${title}`,
      "Only the upload timestamp",
      "A random production detail",
      "The last visible UI element",
    ],
    correctIndex: 0,
  },
  reflection: {
    label: "Short Reflection",
    question: (title: string) => `What would be the strongest one-line takeaway after this part of ${title}?`,
    options: (title: string) => [
      `${title} should leave the learner with one clear idea to restate`,
      "The best summary is to skip the next segment",
      "The player controls matter more than the lesson",
      "The answer should always be hidden",
    ],
    correctIndex: 0,
  },
  ordering: {
    label: "Sequence Recall",
    question: (title: string) => `What is the best order for engaging with this section of ${title}?`,
    options: () => [
      "Watch, pause at a checkpoint, answer, then continue",
      "Skip ahead, mute audio, then guess the answer",
      "Open fullscreen, then end the lesson immediately",
      "Answer before the lesson starts, then review later",
    ],
    correctIndex: 0,
  },
  truefalse: {
    label: "True or False",
    question: (title: string) => `True or false: QuizStream should use ${title} to create fast confidence checks during playback.`,
    options: () => [
      "True, because lightweight checks make the lesson feel interactive",
      "False, because checkpoints only work on text lessons",
      "False, because uploaded videos cannot be paused",
      "False, because review should wait until the next day",
    ],
    correctIndex: 0,
  },
  "term-recall": {
    label: "Key Term Recall",
    question: (title: string) => `What key term should QuizStream reinforce while ${title} is playing?`,
    options: () => [
      "The main concept currently being explained",
      "A random file extension",
      "The browser tab title only",
      "The settings page subtitle",
    ],
    correctIndex: 0,
  },
} satisfies Record<
  string,
  {
    label: string;
    question: (title: string) => string;
    options: (title: string) => string[];
    correctIndex: number;
  }
>;

export const formatDurationLabel = (seconds: number) => {
  if (!seconds || !Number.isFinite(seconds)) {
    return "Duration pending";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};

export function createPersonalizedCheckpoints(
  course: CourseRecord | null,
  duration = 540,
): Checkpoint[] {
  if (!course) {
    return [];
  }

  const quizSetup = normalizeCourseQuizSetup(course.quizSetup ?? DEFAULT_COURSE_QUIZ_SETUP);
  const selectedTypes =
    quizSetup.questionTypes.length > 0
      ? quizSetup.questionTypes
      : DEFAULT_COURSE_QUIZ_SETUP.questionTypes;
  const checkpointCount = Math.max(3, Math.min(quizSetup.questionTarget, 12));
  const safeDuration = Math.max(duration, 90);

  return Array.from({ length: checkpointCount }, (_, index) => {
    const questionTypeId = selectedTypes[index % selectedTypes.length] ?? "checkpoint";
    const profile = questionTypeProfiles[questionTypeId] ?? questionTypeProfiles.checkpoint;
    const ratio = (index + 1) / (checkpointCount + 1);

    return {
      id: `${course.id}-${questionTypeId}-${index + 1}`,
      time: Math.min(Math.round(safeDuration * ratio), safeDuration - 5),
      label: `${profile.label} ${index + 1}`,
      question: applyQuestionOptions(profile.question(course.title), quizSetup),
      options: profile.options(course.title),
      correctIndex: profile.correctIndex,
      status: index === 0 ? "active" : "upcoming",
    };
  });
}

export function buildCoursePresentation(
  course: CourseRecord | null,
  user: AppUser | null,
  duration = 0,
): CoursePresentation | null {
  if (!course) {
    return null;
  }

  const quizSetup = normalizeCourseQuizSetup(course.quizSetup ?? DEFAULT_COURSE_QUIZ_SETUP);
  const firstName = user?.name.split(" ")[0] || "there";
  const courseCode = `QS-${course.id.slice(0, 4).toUpperCase()}`;
  const enabledOptionLabels = getEnabledOptionLabels(quizSetup);
  const titleKeywords = course.title
    .split(/[\s-_]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3)
    .slice(0, 2);

  return {
    title: course.title,
    moduleTitle: "Interactive lesson stream",
    moduleLabel: "Personal Library",
    summary: `${firstName}, this lesson is driven by a real upload from your workspace and tuned for ${quizSetup.questionTarget} prompts across ${quizSetup.questionTypes.length} question styles.`,
    instructor: `${user?.name || "Your"} workspace`,
    courseCode,
    durationLabel: formatDurationLabel(duration),
    tags: ["Uploaded", "MP4", ...titleKeywords, ...enabledOptionLabels.slice(0, 2)],
    transcriptSegments: buildTranscriptSegments(course.title, firstName, quizSetup, duration),
    noteEntries: buildNoteEntries(course, firstName, quizSetup, duration),
  };
}

export function formatUploadDate(isoTimestamp: string) {
  return new Date(isoTimestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildTranscriptSegments(
  title: string,
  firstName: string,
  quizSetup: CourseQuizSetup,
  duration: number,
): TranscriptSegment[] {
  const safeDuration = duration > 0 ? duration : 540;
  const selectedTypes = quizSetup.questionTypes.join(", ");

  return [
    {
      time: 0,
      text: `Welcome back, ${firstName}. QuizStream is using ${title} as the active lesson in your library today.`,
    },
    {
      time: Math.round(safeDuration * 0.16),
      text: `${title} is paired with ${quizSetup.questionTarget} generated prompts, using ${selectedTypes} as the active question mix.`,
    },
    {
      time: Math.round(safeDuration * 0.34),
      text: quizSetup.sessionOptions.hints
        ? "Hints are enabled, so the learner can get a small nudge before committing to an answer."
        : "Hints are off, so the learner will answer each checkpoint without a prompt.",
    },
    {
      time: Math.round(safeDuration * 0.52),
      text: quizSetup.sessionOptions.explanations
        ? "Coach explanations are enabled, which makes each checkpoint feel a little more guided."
        : "Coach explanations are off, keeping the experience fast and lightweight.",
    },
    {
      time: Math.round(safeDuration * 0.72),
      text: quizSetup.sessionOptions.allowRetakes
        ? "One retry is available, so missed concepts can be reinforced before the lesson moves on."
        : "Retakes are disabled, so each checkpoint becomes a single confidence check.",
    },
    {
      time: Math.round(safeDuration * 0.9),
      text: quizSetup.sessionOptions.queueReview
        ? "Missed ideas can be queued for later review, helping this upload feel more like a real study flow."
        : "Review queueing is off, so the session stays focused on the live playback experience.",
    },
  ];
}

function buildNoteEntries(
  course: CourseRecord,
  firstName: string,
  quizSetup: CourseQuizSetup,
  duration: number,
): NoteEntry[] {
  const safeDuration = duration > 0 ? duration : 540;

  return [
    {
      id: `${course.id}-note-1`,
      time: Math.round(safeDuration * 0.18),
      title: "Personal library",
      content: `This session comes from ${course.filename}, giving ${firstName} a lesson that feels specific to their own workspace.`,
    },
    {
      id: `${course.id}-note-2`,
      time: Math.round(safeDuration * 0.48),
      title: "Quiz setup",
      content: `This lesson uses ${quizSetup.questionTarget} prompts and the ${quizSetup.questionTypes.join(", ")} question mix.`,
    },
    {
      id: `${course.id}-note-3`,
      time: Math.round(safeDuration * 0.78),
      title: "Study flow",
      content: `${quizSetup.sessionOptions.queueReview ? "Review queueing is on" : "Review queueing is off"}, and ${quizSetup.sessionOptions.allowRetakes ? "one retry is available." : "retakes are disabled."}`,
    },
  ];
}

function applyQuestionOptions(question: string, quizSetup: CourseQuizSetup) {
  if (quizSetup.sessionOptions.hints && quizSetup.sessionOptions.explanations) {
    return `${question} Use the available hint and explanation flow if needed.`;
  }

  if (quizSetup.sessionOptions.hints) {
    return `${question} A hint can appear before the answer is revealed.`;
  }

  if (quizSetup.sessionOptions.explanations) {
    return `${question} A short explanation can follow the answer.`;
  }

  return question;
}

function getEnabledOptionLabels(quizSetup: CourseQuizSetup) {
  return [
    quizSetup.sessionOptions.explanations ? "Coach explanations" : "Fast review",
    quizSetup.sessionOptions.hints ? "Hints on" : "Hints off",
    quizSetup.sessionOptions.allowRetakes ? "Retry enabled" : "Single attempt",
    quizSetup.sessionOptions.queueReview ? "Review queue" : "Live only",
  ];
}
