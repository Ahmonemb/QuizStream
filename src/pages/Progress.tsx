import { Target, CheckCircle2, Clock, Flame, TrendingUp, BookOpen, Award, Calendar } from "lucide-react";

const weeklyData = [
  { day: "Mon", quizzes: 3, minutes: 45 },
  { day: "Tue", quizzes: 5, minutes: 62 },
  { day: "Wed", quizzes: 2, minutes: 30 },
  { day: "Thu", quizzes: 7, minutes: 85 },
  { day: "Fri", quizzes: 4, minutes: 50 },
  { day: "Sat", quizzes: 1, minutes: 15 },
  { day: "Sun", quizzes: 0, minutes: 0 },
];

const courseProgress = [
  { title: "JavaScript Fundamentals", progress: 72, quizzes: 18, accuracy: 88 },
  { title: "React Hooks Deep Dive", progress: 100, quizzes: 24, accuracy: 92 },
  { title: "CSS Grid & Flexbox", progress: 33, quizzes: 8, accuracy: 75 },
  { title: "TypeScript Essentials", progress: 15, quizzes: 4, accuracy: 80 },
];

const achievements = [
  { icon: "🔥", label: "7-Day Streak", unlocked: true },
  { icon: "🎯", label: "Perfect Score", unlocked: true },
  { icon: "📚", label: "50 Quizzes", unlocked: true },
  { icon: "⚡", label: "Speed Demon", unlocked: false },
  { icon: "🏆", label: "Course Complete", unlocked: true },
  { icon: "🌟", label: "100 XP", unlocked: false },
];

const Progress = () => {
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes));

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: "1,240", icon: Award, color: "text-tertiary", bg: "bg-tertiary/10" },
          { label: "Accuracy", value: "86%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Streak", value: "7 days", icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Time Spent", value: "12h 30m", icon: Clock, color: "text-secondary", bg: "bg-secondary/10" },
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

      {/* Weekly Activity Chart */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Weekly Activity</h2>
          </div>
          <span className="text-xs text-muted-foreground">This Week</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {weeklyData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative flex-1 flex items-end">
                <div
                  className="w-full bg-primary/20 rounded-lg relative overflow-hidden transition-all"
                  style={{ height: maxMinutes > 0 ? `${(d.minutes / maxMinutes) * 100}%` : "0%", minHeight: d.minutes > 0 ? "8px" : "4px" }}
                >
                  <div className="absolute inset-0 bg-primary rounded-lg" style={{ opacity: d.minutes > 0 ? 0.7 : 0.1 }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Course Progress */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-semibold text-foreground">Course Progress</h2>
        </div>
        <div className="space-y-4">
          {courseProgress.map((course) => (
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

      {/* Achievements */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Achievements</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                a.unlocked ? "border-border bg-muted/30" : "border-border opacity-40 grayscale"
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Schedule */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-tertiary" />
          <h2 className="text-base font-semibold text-foreground">Upcoming Reviews</h2>
        </div>
        {[
          { topic: "Variables & Types", course: "JavaScript Fundamentals", due: "Today", urgent: true },
          { topic: "useEffect Hook", course: "React Hooks Deep Dive", due: "Tomorrow", urgent: false },
          { topic: "Grid Template Areas", course: "CSS Grid & Flexbox", due: "In 3 days", urgent: false },
        ].map((review, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
            <div className={`h-2 w-2 rounded-full shrink-0 ${review.urgent ? "bg-destructive" : "bg-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{review.topic}</p>
              <p className="text-xs text-muted-foreground">{review.course}</p>
            </div>
            <span className={`text-xs font-medium ${review.urgent ? "text-destructive" : "text-muted-foreground"}`}>{review.due}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progress;
