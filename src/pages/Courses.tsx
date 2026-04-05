import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import ProgressPanel from "@/components/ProgressPanel";
import TranscriptTabs from "@/components/TranscriptTabs";
import { featuredCourse, Checkpoint } from "@/data/courseData";
import { Share2, Tag, Loader2, AlertCircle } from "lucide-react";

// The shape of the data coming from your Node backend
interface QuizResponse {
  videoId: string;
  fileName: string;
  quizzes: {
    time: number;
    question: string;
    answers: string[];
    correct: number;
  }[];
  uploadedAt: string;
}

const Courses = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const location = useLocation();

  // --- Real State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(featuredCourse.title);
  
  // State driven by the VideoPlayer
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionCheckpoints, setSessionCheckpoints] = useState<Checkpoint[]>([]);

  // Fetch the AI data on mount
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!videoId) return;

      try {
        const res = await fetch(`http://localhost:5001/api/quiz/${videoId}`);
        if (!res.ok) throw new Error("Failed to load course data");

        const data: QuizResponse = await res.json();
        if (data.fileName) setFileName(data.fileName);

        // Map AI quizzes to your dashboard's Checkpoint format
        if (data.quizzes) {
          const mappedCheckpoints: Checkpoint[] = data.quizzes.map((q, idx) => ({
            id: `quiz-${idx}`,
            time: q.time,
            label: `Question ${idx + 1}`,
            question: q.question,
            options: q.answers,
            correctIndex: q.correct,
            status: "upcoming"
          }));
          setSessionCheckpoints(mappedCheckpoints);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [videoId]);


  // Calculate stats for the ProgressPanel
  const correctCount = sessionCheckpoints.filter((cp) => cp.status === "completed").length;
  const answeredCount = sessionCheckpoints.filter(
    (cp) => cp.status === "completed" || cp.status === "incorrect"
  ).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // --- Loading / Error States ---
  if (!videoId) return <div className="p-8 text-center text-destructive font-semibold">No video ID provided in URL.</div>;
  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>Loading your AI interactive session...</p>
    </div>
  );
  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-destructive gap-3">
      <AlertCircle className="h-8 w-8" />
      <p>Error: {error}</p>
    </div>
  );

  return (
    <div className="flex flex-1 min-w-0">
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="max-w-[960px] mx-auto px-4 py-6 lg:px-8">
          
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              {featuredCourse.moduleLabel}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{fileName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-Generated Interactive Session
            </p>
          </div>

          {/* THE REAL VIDEO PLAYER */}
          <VideoPlayer
            videoId={videoId}
            lessonTitle={fileName}
            lessonSubtitle={`${sessionCheckpoints.length} AI Checkpoints`}
            checkpoints={sessionCheckpoints}
            // Pass callbacks down so VideoPlayer can report back to the dashboard!
            onTimeUpdate={(time) => setCurrentTime(time)}
            onCheckpointStatusChange={(newCheckpoints) => setSessionCheckpoints(newCheckpoints)}
          />

          <div className="mt-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Session Details</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {featuredCourse.instructor} • {featuredCourse.courseCode}
              </p>
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
            // If users click the transcript, it should skip the video (will require passing a ref down eventually)
            onSeek={setCurrentTime} 
          />
        </div>
      </div>

      {/* PROGRESS PANEL: Now tracking real AI quiz completions! */}
      <ProgressPanel
        checkpoints={sessionCheckpoints}
        accuracy={accuracy}
        answered={answeredCount}
        currentStreak={correctCount}
        timeWatched={`${Math.floor(currentTime / 60)}m ${Math.floor(currentTime % 60)}s`}
      />

    </div>
  );
};

export default Courses;