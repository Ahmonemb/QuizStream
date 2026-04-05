import { useState, useEffect, useCallback } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import QuizModal from "@/components/QuizModal";
import ProgressPanel from "@/components/ProgressPanel";
import TranscriptTabs from "@/components/TranscriptTabs";
import { checkpoints as initialCheckpoints, Checkpoint } from "@/data/courseData";
import { Share2, Tag } from "lucide-react";

const DURATION = 450;

const Courses = () => {
  const [currentTime, setCurrentTime] = useState(195);
  const [isPlaying, setIsPlaying] = useState(false);
  const [checkpointData, setCheckpointData] = useState<Checkpoint[]>(initialCheckpoints);
  const [activeQuiz, setActiveQuiz] = useState<Checkpoint | null>(null);
  const [hitCheckpoints, setHitCheckpoints] = useState<Set<string>>(new Set(["q1", "q2"]));

  useEffect(() => {
    if (!isPlaying || activeQuiz) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + 1;
        if (next >= DURATION) {
          setIsPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, activeQuiz]);

  useEffect(() => {
    if (activeQuiz) return;
    const cp = checkpointData.find(
      (c) => Math.abs(currentTime - c.time) < 1.5 && !hitCheckpoints.has(c.id) && c.status !== "completed"
    );
    if (cp) {
      setIsPlaying(false);
      setActiveQuiz(cp);
      setHitCheckpoints((s) => new Set(s).add(cp.id));
    }
  }, [currentTime, activeQuiz, checkpointData, hitCheckpoints]);

  const handleQuizClose = useCallback((correct: boolean) => {
    if (!activeQuiz) return;
    setCheckpointData((prev) =>
      prev.map((cp) =>
        cp.id === activeQuiz.id ? { ...cp, status: correct ? "completed" : "incorrect" } : cp
      )
    );
    setActiveQuiz(null);
    setIsPlaying(true);
  }, [activeQuiz]);

  const completedCount = checkpointData.filter((c) => c.status === "completed").length;
  const answeredCount = checkpointData.filter((c) => c.status === "completed" || c.status === "incorrect").length;
  const accuracy = answeredCount > 0 ? Math.round((completedCount / answeredCount) * 100) : 0;

  return (
    <div className="flex flex-1 min-w-0">
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="max-w-[960px] mx-auto px-4 py-6 lg:px-8">
          {/* Header */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Chapter 3</p>
            <h1 className="text-2xl font-bold text-foreground">JavaScript Fundamentals</h1>
            <p className="text-sm text-muted-foreground mt-1">Master the core building blocks of JavaScript programming</p>
          </div>

          <VideoPlayer
            currentTime={currentTime}
            duration={DURATION}
            isPlaying={isPlaying}
            checkpoints={checkpointData}
            onTimeUpdate={setCurrentTime}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onCheckpointHit={() => {}}
          />

          {/* Lecture info */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">JavaScript Fundamentals — Core Concepts</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Prof. Sarah Chen · Computer Science 101</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {["JavaScript", "Beginner", "Variables", "Functions"].map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              <Share2 className="h-4 w-4" />
              Share Session
            </button>
          </div>

          <TranscriptTabs
            currentTime={currentTime}
            checkpoints={checkpointData}
            onSeek={setCurrentTime}
          />
        </div>
      </div>

      <ProgressPanel
        checkpoints={checkpointData}
        accuracy={accuracy}
        answered={answeredCount}
        streak={completedCount}
        timeWatched={`${Math.floor(currentTime / 60)}m`}
      />

      {activeQuiz && <QuizModal checkpoint={activeQuiz} onClose={handleQuizClose} />}
    </div>
  );
};

export default Courses;
