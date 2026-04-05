import { useState, useRef, type MouseEvent } from "react";
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
  lessonTitle: string;
  lessonSubtitle: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  checkpoints: Checkpoint[];
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
}

const VideoPlayer = ({
  lessonTitle,
  lessonSubtitle,
  currentTime,
  duration,
  isPlaying,
  checkpoints,
  onTimeUpdate,
  onPlayPause,
}: VideoPlayerProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<Checkpoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const progressPercent = (event.clientX - timelineBounds.left) / timelineBounds.width;
    onTimeUpdate(progressPercent * duration);
  };

  const getCheckpointColor = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "active":
        return "bg-primary";
      case "incorrect":
        return "bg-destructive";
      default:
        return "bg-tertiary";
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-foreground/95 card-shadow">
      <div className="relative aspect-video bg-foreground/90 flex items-center justify-center cursor-pointer group" onClick={onPlayPause}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        <div className="text-center z-10">
          <h3 className="text-primary-foreground text-xl font-semibold mb-1">{lessonTitle}</h3>
          <p className="text-primary-foreground/60 text-sm">{lessonSubtitle}</p>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-2 bg-card">
        <div
          ref={timelineRef}
          className="relative h-2 bg-muted rounded-full cursor-pointer mb-3 group"
          onClick={handleTimelineClick}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />

          {checkpoints.map((checkpoint) => {
            const position = (checkpoint.time / duration) * 100;

            return (
              <div
                key={checkpoint.id}
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{ left: `${position}%` }}
                onMouseEnter={() => {
                  setHoveredCheckpoint(checkpoint);
                  setTooltipPosition(position);
                }}
                onMouseLeave={() => setHoveredCheckpoint(null)}
              >
                <div
                  className={`h-3 w-3 rounded-full ${getCheckpointColor(checkpoint.status)} border-2 border-card -translate-x-1/2 transition-transform hover:scale-150 cursor-pointer`}
                />
              </div>
            );
          })}

          {hoveredCheckpoint && (
            <div
              className="absolute -top-12 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20 animate-fade-in"
              style={{ left: `${tooltipPosition}%` }}
            >
              <span className="font-medium">{hoveredCheckpoint.label}</span>
              <span className="ml-2 opacity-70">{formatTime(hoveredCheckpoint.time)}</span>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 h-2 w-2 bg-foreground" />
            </div>
          )}
        </div>

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
