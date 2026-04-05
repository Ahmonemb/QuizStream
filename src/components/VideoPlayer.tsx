import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Checkpoint } from "@/lib/app-types";

interface VideoPlayerProps {
  lessonTitle: string;
  lessonSubtitle: string;
  videoUrl: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  checkpoints: Checkpoint[];
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

const VideoPlayer = ({
  lessonTitle,
  lessonSubtitle,
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  checkpoints,
  onTimeUpdate,
  onDurationChange,
  onPlayingChange,
}: VideoPlayerProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<Checkpoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.volume = volume;
    video.muted = isMuted;
  }, [isMuted, volume]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoUrl) {
      return;
    }

    if (Math.abs(video.currentTime - currentTime) > 0.75) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoUrl) {
      return;
    }

    if (isPlaying) {
      void video.play().catch(() => {
        setVideoError("Playback could not start automatically. Press play to try again.");
        onPlayingChange(false);
      });
      return;
    }

    if (!video.paused) {
      video.pause();
    }
  }, [isPlaying, onPlayingChange, videoUrl]);

  useEffect(() => {
    setVideoError(null);
    setHoveredCheckpoint(null);
  }, [videoUrl]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const seekToTime = (nextTime: number) => {
    const video = videoRef.current;
    const boundedTime = Math.max(0, Math.min(nextTime, duration || nextTime));

    if (video && Number.isFinite(boundedTime)) {
      video.currentTime = boundedTime;
    }

    onTimeUpdate(boundedTime);
  };

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) {
      return;
    }

    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const progressPercent = (event.clientX - timelineBounds.left) / timelineBounds.width;
    seekToTime(progressPercent * duration);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value) / 100;

    setVolume(nextVolume);

    if (nextVolume > 0) {
      setLastVolume(nextVolume);
      setIsMuted(false);
      return;
    }

    setIsMuted(true);
  };

  const handleMuteToggle = () => {
    if (isMuted || volume === 0) {
      setIsMuted(false);
      setVolume(lastVolume || 1);
      return;
    }

    setIsMuted(true);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;

    if (!videoUrl || !video) {
      return;
    }

    if (video.paused) {
      setVideoError(null);
      void video.play().catch(() => {
        setVideoError("Playback could not start. Try pressing play again.");
      });
      return;
    }

    video.pause();
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current.requestFullscreen?.();
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
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-foreground/95 card-shadow">
      <div
        className="group relative aspect-video cursor-pointer overflow-hidden bg-black"
        onClick={handlePlayPause}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full bg-black object-contain"
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              setVideoError(null);
              onDurationChange(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0);
            }}
            onTimeUpdate={(event) => {
              onTimeUpdate(event.currentTarget.currentTime);
            }}
            onPlay={() => onPlayingChange(true)}
            onPause={() => onPlayingChange(false)}
            onEnded={() => onPlayingChange(false)}
            onError={() => {
              setVideoError("This video could not be played. Try uploading another MP4 file.");
              onPlayingChange(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-5 py-4">
          <h3 className="text-xl font-semibold text-primary-foreground">{lessonTitle}</h3>
          <p className="text-sm text-primary-foreground/70">{lessonSubtitle}</p>
        </div>

        {!videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h3 className="mb-2 text-xl font-semibold text-primary-foreground">{lessonTitle}</h3>
            <p className="max-w-md text-sm text-primary-foreground/70">
              Upload an MP4 on this page, then pick it from the library to start playback here.
            </p>
          </div>
        )}

        {videoUrl && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 transition-transform group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 text-primary-foreground" />
            </div>
          </div>
        )}

        {videoError && (
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-destructive/40 bg-background/95 px-4 py-3 text-sm text-destructive shadow-lg">
            {videoError}
          </div>
        )}
      </div>

      <div className="bg-card px-4 pb-4 pt-3">
        <div
          ref={timelineRef}
          className={`relative mb-3 h-2 rounded-full bg-muted ${duration > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          onClick={handleTimelineClick}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />

          {checkpoints.map((checkpoint) => {
            const position = duration > 0 ? (checkpoint.time / duration) * 100 : 0;

            return (
              <button
                key={checkpoint.id}
                type="button"
                className="absolute top-1/2 z-10 -translate-y-1/2"
                style={{ left: `${position}%` }}
                onClick={(event) => {
                  event.stopPropagation();
                  seekToTime(checkpoint.time);
                }}
                onMouseEnter={() => {
                  setHoveredCheckpoint(checkpoint);
                  setTooltipPosition(position);
                }}
                onMouseLeave={() => setHoveredCheckpoint(null)}
              >
                <span
                  className={`block h-3 w-3 -translate-x-1/2 rounded-full border-2 border-card transition-transform hover:scale-150 ${getCheckpointColor(checkpoint.status)}`}
                />
              </button>
            );
          })}

          {hoveredCheckpoint && (
            <div
              className="absolute -top-12 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background animate-fade-in"
              style={{ left: `${tooltipPosition}%` }}
            >
              <span className="font-medium">{hoveredCheckpoint.label}</span>
              <span className="ml-2 opacity-70">{formatTime(hoveredCheckpoint.time)}</span>
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={!videoUrl}
              className="text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={handleMuteToggle}
              disabled={!videoUrl}
              className="text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : Math.round(volume * 100)}
              onChange={handleVolumeChange}
              disabled={!videoUrl}
              className="h-2 w-28 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Volume"
            />

            <span className="font-mono text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFullscreen}
              disabled={!videoUrl}
              className="text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
