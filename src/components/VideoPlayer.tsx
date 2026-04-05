import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
} from "lucide-react";
import { Checkpoint } from "@/data/courseData";

interface VideoPlayerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  checkpoints: Checkpoint[];
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  onCheckpointHit: (checkpoint: Checkpoint) => void;
}

const VideoPlayer = ({
  currentTime,
  duration,
  isPlaying,
  checkpoints,
  onTimeUpdate,
  onPlayPause,
  onCheckpointHit,
}: VideoPlayerProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<Checkpoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onTimeUpdate(pct * duration);
  };

  const getCheckpointColor = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return "bg-success";
      case "active": return "bg-primary";
      case "incorrect": return "bg-destructive";
      default: return "bg-tertiary";
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-foreground/95 card-shadow">
      {/* Video area */}
      <div className="relative aspect-video bg-foreground/90 flex items-center justify-center cursor-pointer group" onClick={onPlayPause}>
        {/* Simulated video content */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        <div className="text-center z-10">
          <h3 className="text-primary-foreground text-xl font-semibold mb-1">JavaScript Fundamentals</h3>
          <p className="text-primary-foreground/60 text-sm">Chapter 3: Core Concepts</p>
        </div>

        {/* Big play button overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 pt-2 bg-card">
        {/* Timeline */}
        <div
          ref={timelineRef}
          className="relative h-2 bg-muted rounded-full cursor-pointer mb-3 group"
          onClick={handleTimelineClick}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Checkpoint markers */}
          {checkpoints.map((cp) => {
            const pos = (cp.time / duration) * 100;
            return (
              <div
                key={cp.id}
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{ left: `${pos}%` }}
                onMouseEnter={(e) => {
                  setHoveredCheckpoint(cp);
                  setTooltipPos(pos);
                }}
                onMouseLeave={() => setHoveredCheckpoint(null)}
              >
                <div
                  className={`h-3 w-3 rounded-full ${getCheckpointColor(cp.status)} border-2 border-card -translate-x-1/2 transition-transform hover:scale-150 cursor-pointer`}
                />
              </div>
            );
          })}
          {/* Tooltip */}
          {hoveredCheckpoint && (
            <div
              className="absolute -top-12 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20 animate-fade-in"
              style={{ left: `${tooltipPos}%` }}
            >
              <span className="font-medium">{hoveredCheckpoint.label}</span>
              <span className="ml-2 opacity-70">{formatTime(hoveredCheckpoint.time)}</span>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 h-2 w-2 bg-foreground" />
            </div>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onPlayPause} className="text-foreground hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="text-foreground hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <span className="text-sm text-muted-foreground font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button className="text-foreground hover:text-primary transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
