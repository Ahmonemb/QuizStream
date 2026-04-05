import { useState } from "react";
import { transcriptSegments, Checkpoint } from "@/data/courseData";

interface TranscriptTabsProps {
  currentTime: number;
  checkpoints: Checkpoint[];
  onSeek: (time: number) => void;
}

const tabs = ["Transcript", "Notes", "Quiz Review"] as const;

const TranscriptTabs = ({ currentTime, checkpoints, onSeek }: TranscriptTabsProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Transcript");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-5 bg-card rounded-xl card-shadow overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 max-h-64 overflow-y-auto">
        {activeTab === "Transcript" && (
          <div className="space-y-1">
            {transcriptSegments.map((seg, i) => {
              const nextTime = transcriptSegments[i + 1]?.time ?? Infinity;
              const isActive = currentTime >= seg.time && currentTime < nextTime;
              return (
                <button
                  key={i}
                  onClick={() => onSeek(seg.time)}
                  className={`w-full text-left flex gap-3 p-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent border-l-4 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-10 shrink-0 pt-0.5">{formatTime(seg.time)}</span>
                  <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {seg.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Your notes will appear here.</p>
            <p className="text-muted-foreground text-xs mt-1">Click timestamps in the transcript to add notes.</p>
          </div>
        )}

        {activeTab === "Quiz Review" && (
          <div className="space-y-3">
            {checkpoints.filter((c) => c.status === "completed" || c.status === "incorrect").map((cp) => (
              <div key={cp.id} className="p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${cp.status === "completed" ? "bg-success" : "bg-destructive"}`} />
                  <span className="text-sm font-medium text-foreground">{cp.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatTime(cp.time)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{cp.question}</p>
                <p className="text-xs mt-1 text-success font-medium">Answer: {cp.options[cp.correctIndex]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptTabs;
