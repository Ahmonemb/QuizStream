import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { Checkpoint } from "@/lib/app-types";

interface QuizResponse {
  videoId: string;
  fileName: string;
  quizzes: Checkpoint[];
  uploadedAt: string;
}

const Watch = () => {
  const { videoId } = useParams<{ videoId: string }>();

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [fileName, setFileName] = useState("Video Lesson");

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!videoId) return;

      try {
        const res = await fetch(`/api/quiz/${videoId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch quiz");
        }

        const data: QuizResponse = await res.json();

        if (data.fileName) setFileName(data.fileName);
        setCheckpoints(Array.isArray(data.quizzes) ? data.quizzes : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [videoId]);

  if (!videoId)
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-destructive">Video not found</p>
      </div>
    );
  if (loading)
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-muted-foreground">Loading quiz data...</p>
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );

  return (
    <div className="container mx-auto py-8 max-w-[1000px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Interactive Session
        </h1>
        <p className="text-muted-foreground mt-2">
          {checkpoints.length > 0
            ? `${checkpoints.length} AI questions generated`
            : "No quizzes available"}
        </p>
      </div>

      <VideoPlayer
        videoId={videoId}
        lessonTitle={fileName}
        lessonSubtitle="AI Generated Quiz"
        videoUrl={null} 
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        checkpoints={checkpoints}
        onTimeUpdate={(time) => setCurrentTime(time)}
        onDurationChange={(dur) => setDuration(dur)}
        onPlayingChange={(playing) => setIsPlaying(playing)}
        onCheckpointStatusChange={(updatedCheckpoints) =>
          setCheckpoints(updatedCheckpoints)
        }
      />
    </div>
  );
};

export default Watch;
