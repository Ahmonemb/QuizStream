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

export interface LearnerProfile {
  name: string;
  initials: string;
  email: string;
  plan: string;
}

export interface CourseSummary {
  title: string;
  moduleTitle: string;
  moduleLabel: string;
  summary: string;
  instructor: string;
  courseCode: string;
  durationLabel: string;
  tags: string[];
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

export const learnerProfile: LearnerProfile = {
  name: "Alex Morgan",
  initials: "AM",
  email: "alex@quizstream.app",
  plan: "Demo Workspace",
};

export const featuredCourse: CourseSummary = {
  title: "Introduction to Cognitive Psychology",
  moduleTitle: "Attention, Working Memory, and Recall",
  moduleLabel: "Module 2",
  summary: "Learn how attention, cognitive load, and retrieval practice shape the way people absorb video lessons.",
  instructor: "Dr. Maya Patel",
  courseCode: "PSYCH 210",
  durationLabel: "9 min lesson",
  tags: ["Cognitive Psychology", "Attention", "Memory", "Study Skills"],
};

export const navItems: NavItem[] = [
  { id: "home", title: "Home", icon: "Home", path: "/" },
  { id: "courses", title: "Courses", icon: "BookOpen", path: "/courses" },
  { id: "progress", title: "Progress", icon: "BarChart3", path: "/progress" },
  { id: "settings", title: "Settings", icon: "Settings", path: "/settings" },
];

export const checkpoints: Checkpoint[] = [
  {
    id: "q1",
    time: 52,
    label: "Selective Attention",
    question: "Which example best shows selective attention during a lecture?",
    options: [
      "Focusing on the instructor's explanation while ignoring background chatter",
      "Trying to memorize every word on the slide at once",
      "Taking notes without listening to the speaker",
      "Pausing the video after every sentence",
    ],
    correctIndex: 0,
    status: "completed",
  },
  {
    id: "q2",
    time: 144,
    label: "Working Memory",
    question: "Why do instructors break complex topics into shorter chunks?",
    options: [
      "It reduces pressure on working memory",
      "It removes the need for note-taking",
      "It guarantees perfect recall",
      "It replaces the need for quizzes",
    ],
    correctIndex: 0,
    status: "completed",
  },
  {
    id: "q3",
    time: 236,
    label: "Cognitive Load",
    question: "Which design choice most increases extraneous cognitive load?",
    options: [
      "Highlighting one key diagram at a time",
      "Explaining a concept with a clear visual example",
      "Showing dense text, animation, and narration all at once",
      "Pausing briefly before a checkpoint quiz",
    ],
    correctIndex: 2,
    status: "active",
  },
  {
    id: "q4",
    time: 338,
    label: "Encoding Strategy",
    question: "Which learner behavior is an example of elaborative encoding?",
    options: [
      "Repeating a definition without context",
      "Connecting a new idea to a real classroom example",
      "Skipping notes to watch faster",
      "Guessing before the instructor finishes",
    ],
    correctIndex: 1,
    status: "upcoming",
  },
  {
    id: "q5",
    time: 432,
    label: "Retrieval Practice",
    question: "Why does a quick checkpoint quiz improve retention?",
    options: [
      "It replaces the need to review later",
      "It encourages active retrieval of the concept",
      "It shortens the lecture automatically",
      "It removes difficult material from memory",
    ],
    correctIndex: 1,
    status: "upcoming",
  },
];

export const transcriptSegments: TranscriptSegment[] = [
  { time: 0, text: "Welcome back. In this lesson we will look at how attention and memory shape the way people learn from video." },
  { time: 24, text: "Selective attention helps learners focus on the speaker or the main visual, even when the screen contains distractions." },
  { time: 52, text: "That is why a clean interface matters. When a lesson highlights one important cue, the brain can prioritize it faster." },
  { time: 84, text: "Working memory is limited, so learners struggle when too many ideas arrive at the same time." },
  { time: 144, text: "Chunking a lecture into short segments lowers overload and gives students space to connect one idea before meeting the next." },
  { time: 196, text: "Cognitive load theory separates useful mental effort from extraneous load created by cluttered explanations." },
  { time: 236, text: "If we stack narration, heavy text, and animation together, learners spend effort sorting the format instead of understanding the idea." },
  { time: 284, text: "One way to improve encoding is to link a definition with a realistic example from class or daily life." },
  { time: 338, text: "That extra connection builds a richer memory trace, making the concept easier to retrieve later." },
  { time: 384, text: "Checkpoint questions are helpful because they require retrieval, not just recognition." },
  { time: 432, text: "Even a short pause to answer a question strengthens retention and reveals whether the explanation was clear." },
  { time: 498, text: "When combined, focused visuals, short segments, and retrieval practice create a lesson that feels easier to follow and easier to remember." },
];

export const noteEntries: NoteEntry[] = [
  {
    id: "note-1",
    time: 52,
    title: "Attention cue",
    content: "Clean visuals help learners focus on the main explanation instead of competing details.",
  },
  {
    id: "note-2",
    time: 236,
    title: "Extraneous load",
    content: "Too much motion and text at once increases effort without improving understanding.",
  },
  {
    id: "note-3",
    time: 432,
    title: "Why checkpoints work",
    content: "Retrieval practice is stronger than passive review because the learner has to reconstruct the answer.",
  },
];
