import { Target, Clock, Flame, TrendingUp, BookOpen, Award, Calendar } from "lucide-react";

const weeklyLearningData = [
  { day: "Mon", minutes: 38 },
  { day: "Tue", minutes: 54 },
  { day: "Wed", minutes: 27 },
  { day: "Thu", minutes: 71 },
  { day: "Fri", minutes: 49 },
  { day: "Sat", minutes: 18 },
  { day: "Sun", minutes: 12 },
];

const courseProgressCards = [
  { title: "Introduction to Cognitive Psychology", progress: 74, quizzes: 19, accuracy: 91 },
  { title: "Learning and Memory Lab", progress: 100, quizzes: 26, accuracy: 94 },
  { title: "Behavioral Neuroscience Basics", progress: 41, quizzes: 9, accuracy: 82 },
  { title: "Research Methods for Mind Science", progress: 23, quizzes: 5, accuracy: 88 },
];

const achievementMilestones = [
  { icon: Flame, label: "7-day streak", unlocked: true },
  { icon: Target, label: "90% accuracy", unlocked: true },
  { icon: BookOpen, label: "3 lessons completed", unlocked: true },
  { icon: Clock, label: "5 focused hours", unlocked: false },
  { icon: Award, label: "Top quiz session", unlocked: true },
  { icon: TrendingUp, label: "Weekly goal hit", unlocked: false },
];

const reviewQueue = [
  { topic: "Divided attention costs", course: "Introduction to Cognitive Psychology", dueLabel: "Apr 4", urgent: true },
  { topic: "Chunking strategies", course: "Learning and Memory Lab", dueLabel: "Apr 5", urgent: false },
  { topic: "fMRI versus EEG tradeoffs", course: "Behavioral Neuroscience Basics", dueLabel: "Apr 7", urgent: false },
];

const Progress = () => {
  const maxMinutes = Math.max(...weeklyLearningData.map((entry) => entry.minutes));

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track how your QuizStream sessions are compounding over time.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Lessons completed", value: "12", icon: Award, color: "text-tertiary", bg: "bg-tertiary/10" },
          { label: "Accuracy", value: "91%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Streak", value: "6 days", icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Study time", value: "14h 20m", icon: Clock, color: "text-secondary", bg: "bg-secondary/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 card-shadow">
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Weekly activity</h2>
          </div>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {weeklyLearningData.map((entry) => (
            <div key={entry.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative flex-1 flex items-end">
                <div
                  className="w-full bg-primary/20 rounded-lg relative overflow-hidden transition-all"
                  style={{ height: maxMinutes > 0 ? `${(entry.minutes / maxMinutes) * 100}%` : "0%", minHeight: entry.minutes > 0 ? "8px" : "4px" }}
                >
                  <div className="absolute inset-0 bg-primary rounded-lg" style={{ opacity: entry.minutes > 0 ? 0.7 : 0.1 }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{entry.day}</span>
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
          {courseProgressCards.map((course) => (
            <div key={course.title} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{course.title}</p>
                <span className="text-xs font-semibold text-primary">{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
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
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Achievements</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {achievementMilestones.map((achievement) => (
            <div
              key={achievement.label}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                achievement.unlocked ? "border-border bg-muted/30" : "border-border opacity-40 grayscale"
              }`}
            >
              <achievement.icon className="h-6 w-6 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{achievement.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-tertiary" />
          <h2 className="text-base font-semibold text-foreground">Upcoming reviews</h2>
        </div>
        {reviewQueue.map((review) => (
          <div key={review.topic} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
            <div className={`h-2 w-2 rounded-full shrink-0 ${review.urgent ? "bg-destructive" : "bg-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{review.topic}</p>
              <p className="text-xs text-muted-foreground">{review.course}</p>
            </div>
            <span className={`text-xs font-medium ${review.urgent ? "text-destructive" : "text-muted-foreground"}`}>{review.dueLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progress;
