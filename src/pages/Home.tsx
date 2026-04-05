import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Upload, FileVideo, Sparkles, ChevronRight, BookOpen, Clock, 
  Zap, Loader2, Target, Flame, TrendingUp, Award, Calendar 
} from "lucide-react";
import axios from "axios";
import { useAppState } from "@/context/AppStateContext";
import { createPersonalizedCheckpoints, formatUploadDate } from "@/lib/coursePresentation";
import { uploadVideoFile, analyzeVideo } from "@/lib/videoApi";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Home = () => {
  const navigate = useNavigate();
  const { user, courses, selectedCourse } = useAppState();
  
  // -- HEAD Branch: AI Pipeline State --
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState([10]);
  const [prompt, setPrompt] = useState("Give me a general overview of the important information that is covered, with time intervals of when the information is given. Make sure the time intervals are in seconds.");
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);

  // -- Origin Branch: Dashboard Computed Data --
  const firstName = user?.name.split(" ")[0] ?? "there";
  const weeklyLearningData = weekDays.map((day, index) => ({
    day,
    minutes: courses.length > 0 ? Math.max(12, courses.length * 9 + (index % 3) * 7 + index * 3) : index === 0 ? 0 : 6 + index * 2,
  }));
  const maxMinutes = Math.max(1, ...weeklyLearningData.map((entry) => entry.minutes));
  const courseProgressCards = courses.map((course, index) => ({
    id: course.id,
    title: course.title,
    progress: Math.min(100, 48 + index * 13),
    quizzes: createPersonalizedCheckpoints(course).length,
    accuracy: Math.min(99, 84 + index * 3),
  }));
  const achievementMilestones = [
    { icon: Flame, label: "Profile created", unlocked: Boolean(user) },
    { icon: Target, label: "First upload", unlocked: courses.length >= 1 },
    { icon: BookOpen, label: "Two lessons added", unlocked: courses.length >= 2 },
    { icon: Clock, label: "Library growing", unlocked: courses.length >= 3 },
    { icon: Award, label: "Active session selected", unlocked: Boolean(selectedCourse) },
    { icon: TrendingUp, label: "Personalized workspace", unlocked: Boolean(user && courses.length > 0) },
  ];
  const reviewQueue = createPersonalizedCheckpoints(selectedCourse).slice(1, 4).map((checkpoint, index) => ({
    topic: checkpoint.label,
    course: selectedCourse?.title ?? "No lesson selected",
    dueLabel: courses[index]?.uploadedAt ? formatUploadDate(courses[index].uploadedAt) : "Queue after upload",
    urgent: index === 0,
  }));

  // -- HEAD Branch: AI Pipeline Functions --
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".mp4")) {
      setFileName(file.name);
      setVideoFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".mp4")) {
      setFileName(file.name);
      setVideoFile(file);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!videoFile) throw new Error("Please select a video file first.");

      const formData = new FormData();
      formData.append("video", videoFile);

      setStatusText("Uploading video...");

      const uploadRes = await axios.post('http://localhost:5001/api/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const uploadData = await uploadRes.data;
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");

      const { videoId: newVideoId, taskId } = uploadData;
      setUploadProgress(0); 
      setStatusText("AI is watching your video... (This usually takes 1-3 minutes)");
      
      const checkIndexingStatus = async () => {
        try {
          const statusRes = await fetch(`http://localhost:5001/api/task-status/${taskId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'ready') {
            setStatusText("Video indexed! Generating quiz questions...");
            await generateQuizQuestions(newVideoId);
          } else if (statusData.status === 'failed') {
            throw new Error("Twelve Labs failed to index the video.");
          } else {
            setTimeout(checkIndexingStatus, 5000);
          }
        } catch (pollError: any) {
          setError("Error checking video status: " + pollError.message);
          setIsLoading(false);
        }
      };

      checkIndexingStatus();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const generateQuizQuestions = async (currentVideoId: string) => {
    try {
      setStatusText("Analyzing video concepts and writing questions...");

      const response = await fetch('http://localhost:5001/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideoId,
          questionCount: questionCount[0],
          geminiPrompt: `Turn this video timeline into ${questionCount[0]} multiple-choice questions. 
          Respond ONLY with a valid JSON array of objects in this exact format, with no markdown tags:
          [
            {
              "time": 45,
              "question": "What is...",
              "answers": ["Option A", "Option B", "Option C", "Option D"],
              "correct": 0
            }
          ]`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const cleanJsonString = data.geminiFinalOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedQuizzes = JSON.parse(cleanJsonString);
        
        setQuizzes(parsedQuizzes); 
        setVideoId(currentVideoId);
        setStatusText("Complete!");
        setIsLoading(false);
        navigate(`/courses/${currentVideoId}`); 
      } else {
        throw new Error(data.error || "Failed to analyze video");
      }
    } catch (genError: any) {
      setError("Error generating quiz: " + genError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Home</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track how your QuizStream workspace is evolving as new lesson uploads turn into interactive study sessions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Lessons uploaded", value: `${courses.length}`, icon: Award, color: "text-tertiary", bg: "bg-tertiary/10" },
          { label: "Accuracy", value: `${courses.length > 0 ? 89 + Math.min(courses.length, 6) : 0}%`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Streak", value: `${Math.max(1, Math.min(courses.length + 1, 7))} days`, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Study time", value: `${courses.length * 9}m`, icon: Clock, color: "text-secondary", bg: "bg-secondary/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 card-shadow">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Pipeline Card (Merged from HEAD) */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4 border-2 border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Generate New Session</h2>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging ? "border-primary bg-primary/5" : fileName ? "border-success bg-success/5" : "border-border hover:border-primary/40"
          }`}
        >
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {fileName ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <FileVideo className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ready for AI Processing</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Drop a video file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">MP4 format, up to 1GB</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={!fileName || loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 overflow-hidden relative"
        >
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div 
              className="absolute left-0 top-0 bottom-0 bg-success/20 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          )}

          {loading ? (
            <div className="flex flex-col items-center relative z-10 w-full">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uploadProgress > 0 && uploadProgress < 100 
                    ? `Uploading... ${uploadProgress}%` 
                    : "Processing..."}
                </span>
              </div>
              {statusText && <span className="text-[10px] opacity-80 font-normal mt-1">{statusText}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 relative z-10">
              <Sparkles className="h-4 w-4" />
              Generate Quiz Session
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </button>
      </div>

      {/* Grid Layout for remaining components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Weekly activity</h2>
            </div>
          </div>
          <div className="flex h-40 items-end gap-3">
            {weeklyLearningData.map((entry) => (
              <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="relative w-full overflow-hidden rounded-lg bg-primary/20 transition-all"
                    style={{ height: maxMinutes > 0 ? `${(entry.minutes / maxMinutes) * 100}%` : "0%", minHeight: entry.minutes > 0 ? "8px" : "4px" }}
                  >
                    <div className="absolute inset-0 rounded-lg bg-primary" style={{ opacity: entry.minutes > 0 ? 0.7 : 0.1 }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{entry.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-secondary" />
            <h2 className="text-base font-semibold text-foreground">Course progress</h2>
          </div>
          <div className="space-y-4">
            {courseProgressCards.length > 0 ? courseProgressCards.map((course) => (
              <div key={course.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <span className="text-xs font-semibold text-primary">{course.progress}%</span>
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${course.progress === 100 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{course.quizzes} quizzes</span>
                  <span>{course.accuracy}% accuracy</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Generate a session to build your progress.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;