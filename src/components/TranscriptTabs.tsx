import { useState } from "react";
import { noteEntries, transcriptSegments, Checkpoint } from "@/data/courseData";

interface TranscriptTabsProps {
  currentTime: number;
  checkpoints: Checkpoint[];
  onSeek: (time: number) => void;
}

const tabs = ["Transcript", "Notes", "Quiz Review"] as const;

const TranscriptTabs = ({ currentTime, checkpoints, onSeek }: TranscriptTabsProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Transcript");

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-5 bg-card rounded-xl card-shadow overflow-hidden">
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

      <div className="p-5 max-h-64 overflow-y-auto">
        {activeTab === "Transcript" && (
          <div className="space-y-1">
            {transcriptSegments.map((segment, index) => {
              const nextTime = transcriptSegments[index + 1]?.time ?? Infinity;
              const isActive = currentTime >= segment.time && currentTime < nextTime;

              return (
                <button
                  key={segment.time}
                  onClick={() => onSeek(segment.time)}
                  className={`w-full text-left flex gap-3 p-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent border-l-4 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-10 shrink-0 pt-0.5">{formatTime(segment.time)}</span>
                  <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {segment.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="space-y-3">
            {noteEntries.map((note) => (
              <button
                key={note.id}
                onClick={() => onSeek(note.time)}
                className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{note.title}</p>
                  <span className="text-xs font-mono text-muted-foreground">{formatTime(note.time)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{note.content}</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === "Quiz Review" && (
          <div className="space-y-3">
            {checkpoints.filter((checkpoint) => checkpoint.status === "completed" || checkpoint.status === "incorrect").map((checkpoint) => (
              <div key={checkpoint.id} className="p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${checkpoint.status === "completed" ? "bg-success" : "bg-destructive"}`} />
                  <span className="text-sm font-medium text-foreground">{checkpoint.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatTime(checkpoint.time)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{checkpoint.question}</p>
                <p className="text-xs mt-1 text-success font-medium">Answer: {checkpoint.options[checkpoint.correctIndex]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptTabs;
