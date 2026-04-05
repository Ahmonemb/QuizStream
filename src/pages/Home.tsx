import { 
  BookOpen, Clock, 
  Target, Flame, TrendingUp, Award
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { createPersonalizedCheckpoints, formatUploadDate } from "@/lib/coursePresentation";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Home = () => {
  const { user, courses, selectedCourse } = useAppState();

  // -- Origin Branch: Dashboard Computed Data --
  const firstName = user?.name.split(" ")[0] ?? "there";
  const weeklyLearningData = weekDays.map((day, index) => ({
    day,
    minutes: courses.length > 0 ? Math.max(12, courses.length * 9 + (index % 3) * 7 + index * 3) : index === 0 ? 0 : 6 + index * 2,
  }));
  const maxMinutes = Math.max(1, ...weeklyLearningData.map((entry) => entry.minutes));
  const courseProgressCards = courses.map((course, index) => ({
    id: course.id,
    title: course.title,
    progress: Math.min(100, 48 + index * 13),
    quizzes: createPersonalizedCheckpoints(course).length,
    accuracy: Math.min(99, 84 + index * 3),
  }));
  const achievementMilestones = [
    { icon: Flame, label: "Profile created", unlocked: Boolean(user) },
    { icon: Target, label: "First upload", unlocked: courses.length >= 1 },
    { icon: BookOpen, label: "Two lessons added", unlocked: courses.length >= 2 },
    { icon: Clock, label: "Library growing", unlocked: courses.length >= 3 },
    { icon: Award, label: "Active session selected", unlocked: Boolean(selectedCourse) },
    { icon: TrendingUp, label: "Personalized workspace", unlocked: Boolean(user && courses.length > 0) },
  ];
  const reviewQueue = createPersonalizedCheckpoints(selectedCourse).slice(1, 4).map((checkpoint, index) => ({
    topic: checkpoint.label,
    course: selectedCourse?.title ?? "No lesson selected",
    dueLabel: courses[index]?.uploadedAt ? formatUploadDate(courses[index].uploadedAt) : "Queue after upload",
    urgent: index === 0,
  }));

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Home</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track how your QuizStream workspace is evolving as new lesson uploads turn into interactive study sessions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Lessons uploaded", value: `${courses.length}`, icon: Award, color: "text-tertiary", bg: "bg-tertiary/10" },
          { label: "Accuracy", value: `${courses.length > 0 ? 89 + Math.min(courses.length, 6) : 0}%`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Streak", value: `${Math.max(1, Math.min(courses.length + 1, 7))} days`, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Study time", value: `${courses.length * 9}m`, icon: Clock, color: "text-secondary", bg: "bg-secondary/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 card-shadow">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grid Layout for remaining components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Weekly activity</h2>
            </div>
          </div>
          <div className="flex h-40 items-end gap-3">
            {weeklyLearningData.map((entry) => (
              <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="relative w-full overflow-hidden rounded-lg bg-primary/20 transition-all"
                    style={{ height: maxMinutes > 0 ? `${(entry.minutes / maxMinutes) * 100}%` : "0%", minHeight: entry.minutes > 0 ? "8px" : "4px" }}
                  >
                    <div className="absolute inset-0 rounded-lg bg-primary" style={{ opacity: entry.minutes > 0 ? 0.7 : 0.1 }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{entry.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-secondary" />
            <h2 className="text-base font-semibold text-foreground">Course progress</h2>
          </div>
          <div className="space-y-4">
            {courseProgressCards.length > 0 ? courseProgressCards.map((course) => (
              <div key={course.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <span className="text-xs font-semibold text-primary">{course.progress}%</span>
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${course.progress === 100 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{course.quizzes} quizzes</span>
                  <span>{course.accuracy}% accuracy</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Generate a session to build your progress.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;