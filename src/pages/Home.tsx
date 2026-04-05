import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileVideo, Sparkles, ChevronRight, BookOpen, Clock, Zap, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import axios from "axios"; // Add this at the top



const questionTypes = [
  { id: "mcq", label: "Multiple Choice", description: "Classic A/B/C/D format", icon: "🔘" },
  { id: "free", label: "Free Response", description: "Open-ended text answers", icon: "✍️" },
  { id: "ordering", label: "Ordering", description: "Arrange items in sequence", icon: "📋" },
  { id: "truefalse", label: "True / False", description: "Binary choice questions", icon: "✅" },
  { id: "fillin", label: "Fill in the Blank", description: "Complete the sentence", icon: "📝" },
];

const Home = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["mcq"]));
  const [questionCount, setQuestionCount] = useState([10]);
  const [prompt, setPrompt] = useState("Give me a general overview of the important information that is covered, with time intervals of when the information is given. Make sure the time intervals are in seconds.");
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // NEW: Added missing state variables so your generator doesn't crash!
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);

  const [toggles, setToggles] = useState({
    explanations: true,
    hints: false,
    scheduleReview: true,
    allowRetakes: true,
  });
  
  const navigate = useNavigate();

  const toggleType = (id: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".mp4")) {
      setFileName(file.name);
      setVideoFile(file); // Saves the actual file for upload
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".mp4")) {
      setFileName(file.name);
      setVideoFile(file); // Saves the actual file for upload
    }
  };

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // FIX 1: Validate and build the FormData object dynamically!
      if (!videoFile) {
        throw new Error("Please select a video file first.");
      }

      const formData = new FormData();
      formData.append("video", videoFile);

      setStatusText("Uploading video...");

      const uploadRes = await axios.post('http://localhost:5001/api/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // Calculate the percentage
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const uploadData = await uploadRes.data;
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      const { videoId: newVideoId, taskId } = uploadData;
      console.log(`Upload complete. Task ID: ${taskId}`);

      setUploadProgress(0); 
      setStatusText("AI is watching your video... (This usually takes 1-3 minutes)");
      
      const checkIndexingStatus = async () => {
        try {
          const statusRes = await fetch(`http://localhost:5001/api/task-status/${taskId}`);
          const statusData = await statusRes.json();

          console.log(`Current AI Status: ${statusData.status}`);

          if (statusData.status === 'ready') {
            setStatusText("Video indexed! Generating quiz questions...");
            await generateQuizQuestions(newVideoId);
            
          } else if (statusData.status === 'failed') {
            throw new Error("Twelve Labs failed to index the video.");
          } else {
            // Check again in 5 seconds
            setTimeout(checkIndexingStatus, 5000);
          }
        } catch (pollError: any) {
          console.error("Polling error:", pollError);
          setError("Error checking video status: " + pollError.message);
          setIsLoading(false);
        }
      };

      checkIndexingStatus();

    } catch (err: any) {
      console.error("Pipeline failed:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // ==========================================
  // HELPER FUNCTION: Called only when AI is ready
  // ==========================================
  const generateQuizQuestions = async (currentVideoId: string) => {
    try {
      setStatusText("Analyzing video concepts and writing questions...");

      // 1. Call your AI Chain route!
      const response = await fetch('http://localhost:5001/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideoId,
          questionCount: questionCount[0], // <-- SEND IT HERE!
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
        console.log("🧠 Twelve Labs Raw Summary:", data.twelveLabsRawOutput);
        console.log("✨ Gemini Final Output:", data.geminiFinalOutput);
        
        // 2. Gemini returns a string (sometimes with ```json markdown blocks).
        // We need to clean it and parse it into an actual JavaScript array.
        const cleanJsonString = data.geminiFinalOutput
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
          
        const parsedQuizzes = JSON.parse(cleanJsonString);
        
        // 3. Update your React state with the final data!
        setQuizzes(parsedQuizzes); 
        setVideoId(currentVideoId);
        
        setStatusText("Complete!");
        setIsLoading(false);

        // 4. Send the user to the dashboard to watch the video!
        navigate(`/courses/${currentVideoId}`); 
        
      } else {
        throw new Error(data.error || "Failed to analyze video");
      }
    } catch (genError: any) {
      console.error("Generation error:", genError);
      setError("Error generating quiz: " + genError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Session</h1>
        <p className="text-sm text-muted-foreground mt-1">Import a lecture video and configure your quiz experience</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Import Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : fileName
            ? "border-success bg-success/5"
            : "border-border hover:border-primary/40"
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
            <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
              <FileVideo className="h-7 w-7 text-success" />
            </div>
            <p className="text-sm font-semibold text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Drop your MP4 file here</p>
            <p className="text-xs text-muted-foreground">or click to browse · supports .mp4</p>
          </div>
        )}
      </div>

      {/* Custom Prompt */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-3">
        <label className="text-sm font-semibold text-foreground">Quiz Generation Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="Describe what type of questions to generate..."
        />
      </div>

      {/* Question Types */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-tertiary" />
          <h2 className="text-base font-semibold text-foreground">Question Types</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {questionTypes.map((qt) => (
            <button
              key={qt.id}
              onClick={() => toggleType(qt.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTypes.has(qt.id)
                  ? "border-primary bg-accent ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-xl mb-2 block">{qt.icon}</span>
              <p className="text-sm font-semibold text-foreground">{qt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Number of Questions</h2>
          <span className="text-2xl font-bold text-primary">{questionCount[0]}</span>
        </div>
        <Slider
          value={questionCount}
          onValueChange={setQuestionCount}
          min={3}
          max={30}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 questions</span>
          <span>30 questions</span>
        </div>
      </div>

      {/* Quiz Generation Toggles */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Quiz Options</h2>
        </div>

        {[
          { key: "explanations" as const, label: "Include Explanations", desc: "Show detailed explanations after answering" },
          { key: "hints" as const, label: "Include Hints", desc: "Offer optional hints before submitting" },
          { key: "scheduleReview" as const, label: "Schedule for Review", desc: "Add to spaced repetition queue" },
          { key: "allowRetakes" as const, label: "Allow Retakes", desc: "Let students retry incorrect questions" },
        ].map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm font-medium text-foreground">{toggle.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{toggle.desc}</p>
            </div>
            <Switch checked={toggles[toggle.key]} onCheckedChange={() => handleToggle(toggle.key)} />
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateQuiz}
        disabled={!fileName || loading}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 overflow-hidden relative"
      >
        {/* The green background fill that grows as the file uploads */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div 
            className="absolute left-0 top-0 bottom-0 bg-success/20 transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        )}

        {loading ? (
          <div className="flex flex-col items-center relative z-10 w-full">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {uploadProgress > 0 && uploadProgress < 100 
                  ? `Uploading... ${uploadProgress}%` 
                  : "Processing..."}
              </span>
            </div>
            {statusText && <span className="text-xs opacity-80 font-normal mt-1">{statusText}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-2 relative z-10">
            <Sparkles className="h-5 w-5" />
            Generate Quiz
            <ChevronRight className="h-5 w-5" />
          </div>
        )}
      </button>

      {/* Recent Sessions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Recent Sessions</h2>
        {[
          { title: "JavaScript Fundamentals", questions: 5, date: "2 hours ago", progress: 60 },
          { title: "React Hooks Deep Dive", questions: 8, date: "Yesterday", progress: 100 },
          { title: "CSS Grid & Flexbox", questions: 6, date: "3 days ago", progress: 33 },
        ].map((session, i) => (
          <div key={i} className="bg-card rounded-xl p-4 card-shadow-hover flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
              <p className="text-xs text-muted-foreground">{session.questions} questions · {session.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${session.progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{session.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;