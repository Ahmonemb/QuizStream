import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import ProgressPanel from "@/components/ProgressPanel";
import TranscriptTabs from "@/components/TranscriptTabs";
import { checkpoints as initialCheckpoints, featuredCourse, Checkpoint } from "@/data/courseData";
import { Share2, Tag } from "lucide-react";

const SESSION_DURATION_SECONDS = 540;

const Courses = () => {
  const [currentTime, setCurrentTime] = useState(206);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionCheckpoints, setSessionCheckpoints] = useState<Checkpoint[]>(initialCheckpoints);
  const [activeQuiz, setActiveQuiz] = useState<Checkpoint | null>(null);
  const [triggeredCheckpointIds, setTriggeredCheckpointIds] = useState<Set<string>>(new Set(["q1", "q2"]));

  // --- Real State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(featuredCourse.title);
  
  // State driven by the VideoPlayer
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionCheckpoints, setSessionCheckpoints] = useState<Checkpoint[]>([]);

  // Fetch the AI data on mount
  useEffect(() => {
    if (!isPlaying || activeQuiz) return;

    const interval = setInterval(() => {
      setCurrentTime((time) => {
        const nextTime = time + 1;

        if (nextTime >= SESSION_DURATION_SECONDS) {
          setIsPlaying(false);
          return SESSION_DURATION_SECONDS;
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, activeQuiz]);

  useEffect(() => {
    if (activeQuiz) return;

    const nextCheckpoint = sessionCheckpoints.find(
      (checkpoint) =>
        Math.abs(currentTime - checkpoint.time) < 1.5 &&
        !triggeredCheckpointIds.has(checkpoint.id) &&
        checkpoint.status !== "completed"
    );

    if (nextCheckpoint) {
      setIsPlaying(false);
      setActiveQuiz(nextCheckpoint);
      setTriggeredCheckpointIds((previousIds) => new Set(previousIds).add(nextCheckpoint.id));
    }
  }, [currentTime, activeQuiz, sessionCheckpoints, triggeredCheckpointIds]);

  const handleQuizClose = useCallback((correct: boolean) => {
    if (!activeQuiz) return;

    setSessionCheckpoints((previousCheckpoints) =>
      previousCheckpoints.map((checkpoint) =>
        checkpoint.id === activeQuiz.id ? { ...checkpoint, status: correct ? "completed" : "incorrect" } : checkpoint
      )
    );
    setActiveQuiz(null);
    setIsPlaying(true);
  }, [activeQuiz]);

  const correctCheckpointCount = sessionCheckpoints.filter((checkpoint) => checkpoint.status === "completed").length;
  const answeredCheckpointCount = sessionCheckpoints.filter(
    (checkpoint) => checkpoint.status === "completed" || checkpoint.status === "incorrect"
  ).length;
  const accuracy = answeredCheckpointCount > 0 ? Math.round((correctCheckpointCount / answeredCheckpointCount) * 100) : 0;

  return (
    <div className="flex flex-1 min-w-0">
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="max-w-[960px] mx-auto px-4 py-6 lg:px-8">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{featuredCourse.moduleLabel}</p>
            <h1 className="text-2xl font-bold text-foreground">{featuredCourse.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{featuredCourse.summary}</p>
          </div>

          {/* THE REAL VIDEO PLAYER */}
          <VideoPlayer
            lessonTitle={featuredCourse.title}
            lessonSubtitle={featuredCourse.moduleTitle}
            currentTime={currentTime}
            duration={SESSION_DURATION_SECONDS}
            isPlaying={isPlaying}
            checkpoints={sessionCheckpoints}
            onTimeUpdate={setCurrentTime}
            onPlayPause={() => setIsPlaying(!isPlaying)}
          />

          <div className="mt-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{featuredCourse.moduleTitle}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{featuredCourse.instructor} • {featuredCourse.courseCode} • {featuredCourse.durationLabel}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {featuredCourse.tags.map((tag) => (
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

          {/* TRANSCRIPTS: Now syncing with the real HTML5 video time! */}
          <TranscriptTabs
            currentTime={currentTime}
            checkpoints={sessionCheckpoints}
            onSeek={setCurrentTime}
          />
        </div>
      </div>

      {/* PROGRESS PANEL: Now tracking real AI quiz completions! */}
      <ProgressPanel
        checkpoints={sessionCheckpoints}
        accuracy={accuracy}
        answered={answeredCheckpointCount}
        currentStreak={correctCheckpointCount}
        timeWatched={`${Math.floor(currentTime / 60)}m ${Math.floor(currentTime % 60)}s`}
      />

    </div>
  );
};

export default Courses;