import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX, CheckCircle2, XCircle, Minimize2, MessageSquareText } from "lucide-react";
import { Checkpoint } from "@/lib/app-types";
import { type ReactNode } from "react";
import { useAppState } from "@/context/AppStateContext";
import { PLAYBACK_SPEED_OPTIONS, type PlaybackSpeed } from "@/lib/playbackSpeed";

interface VideoPlayerProps {
  videoId: string;
  lessonTitle: string;
  lessonSubtitle: string;
  videoUrl: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  checkpoints: Checkpoint[];
  overlay?: ReactNode;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onCheckpointStatusChange?: (updatedCheckpoints: Checkpoint[]) => void;
}

const FULLSCREEN_CONTROLS_TIMEOUT_MS = 2200;
const TITLE_OVERLAY_TIMEOUT_MS = 2000;

const VideoPlayer = ({
  videoId,
  lessonTitle,
  lessonSubtitle,
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  checkpoints: initialCheckpoints,
  overlay,
  onTimeUpdate,
  onDurationChange,
  onPlayingChange,
  onCheckpointStatusChange,
}: VideoPlayerProps) => {
  const { playbackSpeed, setPlaybackSpeed } = useAppState();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<Checkpoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [showTitleOverlay, setShowTitleOverlay] = useState(true);
  
  // -- AI Internal State --
  const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(initialCheckpoints);
  const [activeQuiz, setActiveQuiz] = useState<Checkpoint | null>(null);
  const [deferredQuizzes, setDeferredQuizzes] = useState<Checkpoint[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isQuizMinimized, setIsQuizMinimized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const hideTitleTimeoutRef = useRef<number | null>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isQuizVisible = Boolean(activeQuiz) && !isQuizMinimized;
  const hasOverlay = isQuizVisible;
  const shouldShowControls = !isFullscreen || showFullscreenControls || !isPlaying || hasOverlay;

  useEffect(() => {
    setLocalCheckpoints(initialCheckpoints);
    setDeferredQuizzes((previousQuizzes) =>
      previousQuizzes
        .map((queuedQuiz) =>
          initialCheckpoints.find((checkpoint) => checkpoint.id === queuedQuiz.id) ?? queuedQuiz,
        )
        .filter((queuedQuiz) => queuedQuiz.status === "upcoming"),
    );
  }, [initialCheckpoints]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) { video.volume = volume; video.muted = isMuted; }
  }, [isMuted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = Number(playbackSpeed);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && videoUrl && Math.abs(video.currentTime - currentTime) > 0.75) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    if (isPlaying && !isQuizVisible) {
      void video.play().catch(() => {
        setVideoError("Playback could not start automatically.");
        onPlayingChange(false);
      });
    } else if (!video.paused) {
      video.pause();
    }
  }, [isPlaying, isQuizVisible, onPlayingChange, videoUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isPlayerFullscreen = Boolean(containerRef.current && document.fullscreenElement === containerRef.current);
      setIsFullscreen(isPlayerFullscreen);
      setShowFullscreenControls(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
    if (!isFullscreen || !isPlaying || hasOverlay) {
      setShowFullscreenControls(true);
      return;
    }
    hideControlsTimeoutRef.current = window.setTimeout(() => setShowFullscreenControls(false), FULLSCREEN_CONTROLS_TIMEOUT_MS);
    return () => { if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current); };
  }, [hasOverlay, isFullscreen, isPlaying]);

  useEffect(() => {
    if (hideTitleTimeoutRef.current) window.clearTimeout(hideTitleTimeoutRef.current);
    if (!isPlaying || hasOverlay) {
      setShowTitleOverlay(true);
      return;
    }
    hideTitleTimeoutRef.current = window.setTimeout(() => {
      setShowTitleOverlay(false);
    }, TITLE_OVERLAY_TIMEOUT_MS);
    return () => {
      if (hideTitleTimeoutRef.current) window.clearTimeout(hideTitleTimeoutRef.current);
    };
  }, [hasOverlay, isPlaying]);

  const revealFullscreenControls = () => {
    if (isFullscreen) setShowFullscreenControls(true);
  };

  const revealTitleOverlay = () => {
    setShowTitleOverlay(true);
    if (hideTitleTimeoutRef.current) window.clearTimeout(hideTitleTimeoutRef.current);
    if (isPlaying && !hasOverlay) {
      hideTitleTimeoutRef.current = window.setTimeout(() => {
        setShowTitleOverlay(false);
      }, TITLE_OVERLAY_TIMEOUT_MS);
    }
  };

  const handleMouseActivity = () => {
    revealFullscreenControls();
    revealTitleOverlay();
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const seekToTime = (nextTime: number) => {
    if (isQuizVisible) return;
    const boundedTime = Math.max(0, Math.min(nextTime, duration || nextTime));
    if (videoRef.current && Number.isFinite(boundedTime)) videoRef.current.currentTime = boundedTime;
    onTimeUpdate(boundedTime);
  };

  const activateQuiz = (quiz: Checkpoint) => {
    setActiveQuiz(quiz);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setIsQuizMinimized(false);
  };

  const queueQuiz = (quiz: Checkpoint) => {
    setDeferredQuizzes((previousQuizzes) => {
      if (previousQuizzes.some((queuedQuiz) => queuedQuiz.id === quiz.id)) {
        return previousQuizzes;
      }

      return [...previousQuizzes, quiz];
    });
  };

  const resetQuizState = () => {
    setActiveQuiz(null);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setIsQuizMinimized(false);
  };

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0 || isQuizVisible) return;
    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const progressPercent = (event.clientX - timelineBounds.left) / timelineBounds.width;
    seekToTime(progressPercent * duration);
  };

  const handlePlaybackSpeedChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(event.target.value as PlaybackSpeed);
  };

  // AI Time Event Hook
  const handleTimeUpdateInternal = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = event.currentTarget.currentTime;
    onTimeUpdate(current);
    const canOpenNextQuiz = !activeQuiz || isQuizMinimized;

    // Trigger quiz logic
    const triggeredQuiz = localCheckpoints.find((cp) => cp.status === "upcoming" && Math.abs(current - cp.time) < 0.5);
    if (triggeredQuiz && canOpenNextQuiz) {
      onPlayingChange(false);
      if (activeQuiz && isQuizMinimized && !hasSubmitted) {
        queueQuiz(activeQuiz);
      }
      activateQuiz(triggeredQuiz);
      return;
    }

    const endOfVideoQuiz = localCheckpoints.find(
      (cp) =>
        cp.status === "upcoming" &&
        duration > 0 &&
        cp.time >= duration &&
        current >= duration - 0.5,
    );
    if (endOfVideoQuiz && canOpenNextQuiz) {
      onPlayingChange(false);
      if (activeQuiz && isQuizMinimized && !hasSubmitted) {
        queueQuiz(activeQuiz);
      }
      activateQuiz({ ...endOfVideoQuiz, time: duration });
    }
  };

  const submitQuiz = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    setHasSubmitted(true);
    const isCorrect = selectedAnswer === activeQuiz.correctIndex;
    
    const updatedCheckpoints = localCheckpoints.map((cp): Checkpoint => 
      cp.id === activeQuiz.id 
        ? { ...cp, status: isCorrect ? "completed" : "incorrect" } 
        : cp
    );

    setLocalCheckpoints(updatedCheckpoints);
    if (onCheckpointStatusChange) onCheckpointStatusChange(updatedCheckpoints);
  };

  const continueVideo = () => {
    resetQuizState();
    setTimeout(() => { if (videoRef.current) onPlayingChange(true); }, 100);
  };


  const minimizeQuiz = () => {
    if (hasSubmitted) {
      continueVideo();
      return;
    }

    if (!activeQuiz) {
      return;
    }

    queueQuiz(activeQuiz);
    resetQuizState();
  };

  const reopenQuiz = () => {
    const [nextQuiz, ...remainingQuizzes] = deferredQuizzes;
    if (nextQuiz) {
      setDeferredQuizzes(remainingQuizzes);
      activateQuiz(nextQuiz);
    }
  };

  const handlePlayPause = () => {
    if (!videoUrl || !videoRef.current || isQuizVisible) return;
    if (videoRef.current.paused) {
      setVideoError(null);
      void videoRef.current.play().catch(() => setVideoError("Playback could not start."));
      onPlayingChange(true);
    } else {
      videoRef.current.pause();
      onPlayingChange(false);
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current.requestFullscreen?.();
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
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl bg-foreground/95 card-shadow ${
        hasOverlay && !isFullscreen ? "overflow-visible" : "overflow-hidden"
      } ${isFullscreen ? "flex h-full flex-col justify-center bg-black" : ""}`}
      onMouseMove={handleMouseActivity}
    >
      <div
        className={`group relative cursor-pointer overflow-hidden bg-black ${
          isFullscreen ? "flex-1" : "aspect-video"
        }`}
        onClick={handlePlayPause}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl || `http://localhost:5001/api/video/${videoId}`}
            className="h-full w-full bg-black object-contain"
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              setVideoError(null);
              onDurationChange(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0);
            }}
            onTimeUpdate={handleTimeUpdateInternal}
            onPlay={() => onPlayingChange(true)}
            onPause={() => onPlayingChange(false)}
            onEnded={() => {
              onPlayingChange(false);
              const endOfVideoQuiz = localCheckpoints.find(
                (cp) =>
                  cp.status === "upcoming" &&
                  duration > 0 &&
                  cp.time >= duration,
              );
              if (endOfVideoQuiz && !activeQuiz) {
                setActiveQuiz({ ...endOfVideoQuiz, time: duration });
              }
            }}
            onError={() => {
              setVideoError("This video could not be played.");
              onPlayingChange(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}

        <div className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-5 py-4 transition-opacity duration-300 ${showTitleOverlay ? "opacity-100" : "opacity-0"}`}>
          <h3 className="text-xl font-semibold text-primary-foreground">{lessonTitle}</h3>
          <p className="text-sm text-primary-foreground/70">{lessonSubtitle}</p>
        </div>

        {/* AI QUIZ MODAL - Placed internally for perfect fullscreen support */}
        {activeQuiz && isQuizVisible && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fade-in pointer-events-auto"
            onClick={minimizeQuiz}
          >
            <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border flex flex-col max-h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">{activeQuiz.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{formatTime(activeQuiz.time)}</span>
                </div>
                <button
                  type="button"
                  onClick={minimizeQuiz}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </button>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-6 leading-tight">{activeQuiz.question}</h3>
              <div className="space-y-3 mb-6">
                {activeQuiz.options?.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectAnswer = idx === activeQuiz.correctIndex;
                  let btnStyle = "border-border hover:border-primary/50 hover:bg-muted";
                  if (isSelected && !hasSubmitted) btnStyle = "border-primary bg-primary/10 text-primary";
                  if (hasSubmitted) {
                    if (isCorrectAnswer) btnStyle = "border-success bg-success/10 text-success";
                    else if (isSelected) btnStyle = "border-destructive bg-destructive/10 text-destructive";
                    else btnStyle = "border-border opacity-50";
                  }
                  return (
                    <button key={idx} disabled={hasSubmitted} onClick={() => setSelectedAnswer(idx)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${btnStyle}`}>
                      <span className="font-medium text-sm">{opt}</span>
                      {hasSubmitted && isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-success" />}
                      {hasSubmitted && isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>
              {!hasSubmitted ? (
                <button disabled={selectedAnswer === null} onClick={submitQuiz} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all disabled:opacity-50 hover:brightness-110">
                  Check Answer
                </button>
              ) : (
                <>
                  <button onClick={continueVideo} className="w-full py-3 rounded-xl bg-foreground text-background font-semibold transition-all hover:brightness-110">
                    Continue Video
                  </button>
                  {/* <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer</span>
                        <button
                          type="button"
                          onClick={jumpToAnswerMoment}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          Jump to {activeQuiz.answerTimestamp || formatTime(activeQuiz.answerTime ?? activeQuiz.time)}
                        </button>
                      </div>
                      <p className="text-sm leading-6 text-foreground">
                        {activeQuiz.answer || activeQuiz.options[activeQuiz.correctIndex]}
                      </p>
                    </div>
                    <button onClick={continueVideo} className="w-full py-3 rounded-xl bg-foreground text-background font-semibold transition-all hover:brightness-110">
                      Continue Video
                    </button>
                  </div> */}
                </>
              )}
            </div>
          </div>
        )}

        {deferredQuizzes.length > 0 && (
          <div className="absolute right-3 top-3 z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={reopenQuiz}
              className="inline-flex max-w-[calc(100vw-3rem)] items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/75 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label={`Resume ${deferredQuizzes.length} deferred question${deferredQuizzes.length === 1 ? "" : "s"}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
                <MessageSquareText className="h-3.5 w-3.5" />
              </span>
              <span className="truncate pr-1">
                {deferredQuizzes.length === 1 ? "Resume question" : `Resume ${deferredQuizzes.length} questions`}
              </span>
            </button>
          </div>
        )}

        {(videoUrl || videoId) && !isPlaying && !hasOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
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

      <div className={`bg-card px-4 pb-4 pt-3 transition-all duration-300 ${shouldShowControls ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}>
        <div ref={timelineRef} className={`relative mb-3 h-2 rounded-full bg-muted ${duration > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`} onClick={handleTimelineClick}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          {localCheckpoints.map((checkpoint) => {
            const position =
              duration > 0
                ? Math.min((checkpoint.time / duration) * 100, 100)
                : 0;
            return (
              <button
                key={checkpoint.id}
                type="button"
                className="absolute top-1/2 z-10 -translate-y-1/2"
                style={{ left: `${position}%` }}
                onClick={(e) => { e.stopPropagation(); seekToTime(checkpoint.time); }}
                onMouseEnter={() => { setHoveredCheckpoint(checkpoint); setTooltipPosition(position); }}
                onMouseLeave={() => setHoveredCheckpoint(null)}
              >
                <span className={`block h-3 w-3 -translate-x-1/2 rounded-full border-2 border-card transition-transform hover:scale-150 ${getCheckpointColor(checkpoint.status)}`} />
              </button>
            );
          })}
          {hoveredCheckpoint && (
            <div className="absolute -top-12 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background animate-fade-in" style={{ left: `${tooltipPosition}%` }}>
              <span className="font-medium">{hoveredCheckpoint.label}</span>
              <span className="ml-2 opacity-70">{formatTime(hoveredCheckpoint.time)}</span>
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handlePlayPause} disabled={!videoUrl && !videoId} className="text-foreground transition-colors hover:text-primary disabled:opacity-40">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => { if(isMuted||volume===0){setIsMuted(false);setVolume(lastVolume||1);}else{setIsMuted(true);}}} disabled={!videoUrl && !videoId} className="text-foreground transition-colors hover:text-primary disabled:opacity-40">
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range" min="0" max="100" value={isMuted ? 0 : Math.round(volume * 100)}
              onChange={(e) => { const v = Number(e.target.value)/100; setVolume(v); if(v>0){setLastVolume(v);setIsMuted(false);}else{setIsMuted(true);} }}
              disabled={!videoUrl && !videoId} className="h-2 w-28 cursor-pointer accent-primary disabled:opacity-40" aria-label="Volume"
            />
            <span className="font-mono text-sm text-muted-foreground">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Speed</span>
              <select
                value={playbackSpeed}
                onChange={handlePlaybackSpeedChange}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
                disabled={!videoUrl && !videoId}
                aria-label="Playback speed"
              >
                {PLAYBACK_SPEED_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleFullscreen} disabled={!videoUrl && !videoId} className="text-foreground transition-colors hover:text-primary disabled:opacity-40">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {overlay && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          {overlay}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
