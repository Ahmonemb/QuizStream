import { useState, useRef, useEffect, type MouseEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, CheckCircle2, XCircle } from "lucide-react";
import { Checkpoint } from "@/data/courseData"; // Importing your exact interface!

interface VideoPlayerProps {
  videoId: string;
  lessonTitle: string;
  lessonSubtitle: string;
  checkpoints: Checkpoint[];
  onTimeUpdate?: (time: number) => void;                               // NEW
  onCheckpointStatusChange?: (updatedCheckpoints: Checkpoint[]) => void; // NEW
}

const FULLSCREEN_CONTROLS_TIMEOUT_MS = 2200;

const VideoPlayer = ({
  videoId,
  lessonTitle,
  lessonSubtitle,
  checkpoints: initialCheckpoints,
  onTimeUpdate,              // <-- ADD THIS HERE
  onCheckpointStatusChange
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // -- Video State --
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // -- UI State --
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<Checkpoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);

  // -- Quiz Interactive State --
  // We keep a local copy of checkpoints so we can update their status (upcoming -> completed)
  const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(initialCheckpoints);
  const [activeQuiz, setActiveQuiz] = useState<Checkpoint | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Sync props to local state when AI finishes loading
  useEffect(() => {
    setLocalCheckpoints(initialCheckpoints);
  }, [initialCheckpoints]);

  // ==========================================
  // VIDEO CONTROLS
  // ==========================================
  const togglePlay = () => {
    if (!videoRef.current || activeQuiz) return; // Don't allow play if quiz is open
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    if (onTimeUpdate) {
      onTimeUpdate(current); 
    }

    // AI QUIZ TRIGGER LOGIC
    // Find if there is an 'upcoming' checkpoint right at this second
    const triggeredQuiz = localCheckpoints.find(
      (cp) => cp.status === "upcoming" && Math.abs(current - cp.time) < 0.5
    );

    if (triggeredQuiz && !activeQuiz) {
      videoRef.current.pause();
      setIsPlaying(false);
      setActiveQuiz(triggeredQuiz); // Open the modal!
    }
  };

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || activeQuiz) return;
    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const progressPercent = (event.clientX - timelineBounds.left) / timelineBounds.width;
    const newTime = progressPercent * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // ==========================================
  // QUIZ HANDLING LOGIC
  // ==========================================
  const submitQuiz = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    
    setHasSubmitted(true);
    const isCorrect = selectedAnswer === activeQuiz.correctIndex;
    
    // 1. Update the local checkpoints
    const updatedCheckpoints = localCheckpoints.map(cp => 
      cp.id === activeQuiz.id 
        ? { ...cp, status: isCorrect ? "completed" : "incorrect" as "completed" | "incorrect" }
        : cp
    );
    setLocalCheckpoints(updatedCheckpoints);

    // 2. PING THE PARENT: "Hey Courses.tsx, here are the new quiz scores!"
    if (onCheckpointStatusChange) {
      onCheckpointStatusChange(updatedCheckpoints);
    }
  };

  const continueVideo = () => {
    setActiveQuiz(null);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    
    // Slight delay to ensure state clears before playing
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCheckpointColor = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return "bg-success";
      case "active": return "bg-primary";
      case "incorrect": return "bg-destructive";
      default: return "bg-warning";
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full rounded-xl overflow-hidden bg-foreground/95 card-shadow group">
      
      <div className="relative aspect-video bg-black flex items-center justify-center">
        
        <video
          ref={videoRef}
          src={`http://localhost:5001/api/video/${videoId}`}
          className="absolute inset-0 w-full h-full z-0 cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* INITIAL PLAY OVERLAY */}
        {!isPlaying && !activeQuiz && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40" />
            <div className="text-center z-20 mb-6">
              <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-md">{lessonTitle}</h3>
              <p className="text-white/90 text-sm font-medium drop-shadow-md">{lessonSubtitle}</p>
            </div>
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 pointer-events-auto cursor-pointer" onClick={togglePlay}>
              <Play className="h-10 w-10 text-primary-foreground ml-2" />
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* THE QUIZ MODAL OVERLAY */}
        {/* ========================================== */}
        {activeQuiz && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border flex flex-col max-h-full overflow-y-auto">
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">{activeQuiz.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{formatTime(activeQuiz.time)}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-6 leading-tight">
                {activeQuiz.question}
              </h3>

              <div className="space-y-3 mb-6">
                {activeQuiz.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectAnswer = idx === activeQuiz.correctIndex;
                  
                  // Determine button styling based on submission state
                  let btnStyle = "border-border hover:border-primary/50 hover:bg-muted";
                  if (isSelected && !hasSubmitted) btnStyle = "border-primary bg-primary/10 text-primary";
                  if (hasSubmitted) {
                    if (isCorrectAnswer) btnStyle = "border-success bg-success/10 text-success";
                    else if (isSelected && !isCorrectAnswer) btnStyle = "border-destructive bg-destructive/10 text-destructive";
                    else btnStyle = "border-border opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasSubmitted}
                      onClick={() => setSelectedAnswer(idx)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="font-medium text-sm">{opt}</span>
                      {hasSubmitted && isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-success" />}
                      {hasSubmitted && isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {!hasSubmitted ? (
                <button
                  disabled={selectedAnswer === null}
                  onClick={submitQuiz}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={continueVideo}
                  className="w-full py-3 rounded-xl bg-foreground text-background font-semibold transition-all hover:brightness-110"
                >
                  Continue Video
                </button>
              )}
            </div>
          </div>
        )}

        {videoError && (
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-destructive/40 bg-background/95 px-4 py-3 text-sm text-destructive shadow-lg">
            {videoError}
          </div>
        )}

        {overlay && (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            {overlay}
          </div>
        )}
      </div>

      {/* TIMELINE & CONTROLS (Untouched) */}
      <div className="px-4 pb-3 pt-2 bg-card relative z-30">
        <div ref={timelineRef} className="relative h-2 bg-muted rounded-full cursor-pointer mb-3 group" onClick={handleTimelineClick}>
          <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />

          {localCheckpoints.map((checkpoint) => {
            const position = (checkpoint.time / duration) * 100;
            return (
              <div
                key={checkpoint.id}
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{ left: `${position}%` }}
                onMouseEnter={() => { setHoveredCheckpoint(checkpoint); setTooltipPosition(position); }}
                onMouseLeave={() => setHoveredCheckpoint(null)}
              >
                <div className={`h-3 w-3 rounded-full ${getCheckpointColor(checkpoint.status)} border-2 border-card -translate-x-1/2 transition-transform hover:scale-150 cursor-pointer`} />
              </div>
            );
          })}

          {hoveredCheckpoint && (
            <div className="absolute -top-12 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20" style={{ left: `${tooltipPosition}%` }}>
              <span className="font-medium">{hoveredCheckpoint.label}</span>
              <span className="ml-2 opacity-70">{formatTime(hoveredCheckpoint.time)}</span>
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-foreground hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => { if(videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }} className="text-foreground hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
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
            <button className="text-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button className="text-foreground hover:text-primary transition-colors" onClick={() => document.querySelector('.aspect-video')?.requestFullscreen()}>
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;