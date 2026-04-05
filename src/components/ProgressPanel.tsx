import { Target, CheckCircle2, Clock, Flame, Circle } from "lucide-react";
import { Checkpoint } from "@/data/courseData";

interface ProgressPanelProps {
  checkpoints: Checkpoint[];
  accuracy: number;
  answered: number;
  streak: number;
  timeWatched: string;
}

const ProgressPanel = ({ checkpoints, accuracy, answered, streak, timeWatched }: ProgressPanelProps) => {
  const stats = [
    { label: "Accuracy", value: `${accuracy}%`, icon: Target, color: "text-primary" },
    { label: "Answered", value: `${answered}/${checkpoints.length}`, icon: CheckCircle2, color: "text-success" },
    { label: "Streak", value: `${streak}🔥`, icon: Flame, color: "text-warning" },
    { label: "Watched", value: timeWatched, icon: Clock, color: "text-secondary" },
  ];

  const getStatusIcon = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "active": return <Circle className="h-4 w-4 text-primary fill-primary" />;
      case "incorrect": return <Circle className="h-4 w-4 text-destructive fill-destructive" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">Done</span>;
      case "active": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">Next</span>;
      case "incorrect": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Retry</span>;
      default: return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Upcoming</span>;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 h-screen sticky top-0 overflow-y-auto border-l border-border bg-card p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Progress</h3>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-muted/50 rounded-xl p-3 card-shadow-hover">
            <s.icon className={`h-4 w-4 mb-1.5 ${s.color}`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Checkpoints */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Quiz Checkpoints</h4>
        <div className="space-y-2">
          {checkpoints.map((cp) => (
            <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
              <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{formatTime(cp.time)}</span>
              {getStatusIcon(cp.status)}
              <span className="text-sm text-foreground flex-1 truncate">{cp.label}</span>
              {getStatusBadge(cp.status)}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ProgressPanel;
