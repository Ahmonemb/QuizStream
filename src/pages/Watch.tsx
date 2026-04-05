import { useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { Checkpoint } from "@/data/courseData";

// Define what the AI quiz object looks like
export interface Quiz {
  time: number;
  question: string;
  answers: string[];
  correct: number;
}

interface QuizResponse {
  videoId: string;
  fileName: string;
  quizzes: Quiz[];
  uploadedAt: string;
}

const Watch = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const location = useLocation();
  
  // -- State --
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [fileName, setFileName] = useState("Video Lesson");
  const [currentTime, setCurrentTime] = useState(0); // Added to track time
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!videoId) return;

      try {
        const res = await fetch(`http://localhost:5001/api/quiz/${videoId}`);
        if (!res.ok) throw new Error("Failed to fetch quiz");

        const data: QuizResponse = await res.json();
        
        setQuizzes(data.quizzes || []);
        if (data.fileName) setFileName(data.fileName);

        // Map the AI quizzes into your UI Checkpoint format
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
            setCheckpoints(mappedCheckpoints);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [videoId]);

  if (!videoId) return <div className="container mx-auto py-8 text-center"><p className="text-destructive">Video not found</p></div>;
  if (loading) return <div className="container mx-auto py-8 text-center"><p className="text-muted-foreground">Loading quiz data...</p></div>;
  if (error) return <div className="container mx-auto py-8 text-center"><p className="text-destructive">Error: {error}</p></div>;

  return (
    <div className="container mx-auto py-8 max-w-[1000px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Interactive Session</h1>
        <p className="text-muted-foreground mt-2">
          {quizzes.length > 0 ? `${quizzes.length} AI questions generated` : "No quizzes available"}
        </p>
      </div>

      <VideoPlayer 
        videoId={videoId}
        lessonTitle={fileName} 
        lessonSubtitle="AI Generated Quiz" 
        checkpoints={checkpoints} 
        // 1. Listen for time updates from the player
        onTimeUpdate={(time) => setCurrentTime(time)}
        // 2. Keep the Watch.tsx checkpoints perfectly in sync when a user answers a question!
        onCheckpointStatusChange={(updatedCheckpoints) => setCheckpoints(updatedCheckpoints)}
      />
    </div>
  );
};

export default Watch;