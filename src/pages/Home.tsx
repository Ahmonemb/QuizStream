import { useState } from "react";
import { Upload, FileVideo, Sparkles, ChevronRight, BookOpen, Clock, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["mcq"]));
  const [questionCount, setQuestionCount] = useState([10]);
  const [toggles, setToggles] = useState({
    explanations: true,
    hints: false,
    scheduleReview: true,
    allowRetakes: true,
  });

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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Session</h1>
        <p className="text-sm text-muted-foreground mt-1">Import a lecture video and configure your quiz experience</p>
      </div>

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
        disabled={!fileName}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        Generate Quiz
        <ChevronRight className="h-5 w-5" />
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
