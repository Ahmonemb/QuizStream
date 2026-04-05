import { useState, type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  FileVideo,
  Sparkles,
  ChevronRight,
  BookOpen,
  Zap,
  Brain,
  PenLine,
  ListOrdered,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const sessionQuestionTypes = [
  { id: "checkpoint", label: "Checkpoint Quiz", description: "Pause at key concepts with a quick multiple-choice check", icon: Brain },
  { id: "reflection", label: "Short Reflection", description: "Capture a one-sentence takeaway after a segment", icon: PenLine },
  { id: "ordering", label: "Sequence Recall", description: "Rebuild a process or model in the correct order", icon: ListOrdered },
  { id: "truefalse", label: "True or False", description: "Use fast confidence checks between explanations", icon: CheckCircle2 },
  { id: "term-recall", label: "Key Term Recall", description: "Prompt learners to complete an important definition", icon: FileText },
];

const recentLearningSessions = [
  { title: "Introduction to Cognitive Psychology", questionCount: 6, activityLabel: "Started 2 hours ago", progress: 68 },
  { title: "Learning and Memory Lab", questionCount: 8, activityLabel: "Reviewed yesterday", progress: 100 },
  { title: "Behavioral Neuroscience Basics", questionCount: 5, activityLabel: "Queued 3 days ago", progress: 42 },
];

const Home = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideoName, setSelectedVideoName] = useState<string | null>(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<Set<string>>(new Set(["checkpoint", "truefalse"]));
  const [questionTarget, setQuestionTarget] = useState([8]);
  const [sessionOptions, setSessionOptions] = useState({
    explanations: true,
    hints: true,
    queueReview: true,
    allowRetakes: true,
  });

  const toggleQuestionType = (id: string) => {
    setSelectedQuestionTypes((previousTypes) => {
      const nextTypes = new Set(previousTypes);

      if (nextTypes.has(id)) {
        if (nextTypes.size > 1) nextTypes.delete(id);
      } else {
        nextTypes.add(id);
      }

      return nextTypes;
    });
  };

  const toggleSessionOption = (key: keyof typeof sessionOptions) => {
    setSessionOptions((previousOptions) => ({ ...previousOptions, [key]: !previousOptions[key] }));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith(".mp4")) {
      setSelectedVideoName(file.name);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedVideoName(file.name);
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create a learning session</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a lecture recording and tune how QuizStream places AI-guided checkpoints.</p>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : selectedVideoName
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
        {selectedVideoName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
              <FileVideo className="h-7 w-7 text-success" />
            </div>
            <p className="text-sm font-semibold text-foreground">{selectedVideoName}</p>
            <p className="text-xs text-muted-foreground">Click or drag a new recording to replace it.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Drop a lecture recording here</p>
            <p className="text-xs text-muted-foreground">or click to browse for an MP4 lesson clip</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-tertiary" />
          <h2 className="text-base font-semibold text-foreground">Question mix</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sessionQuestionTypes.map((questionType) => (
            <button
              key={questionType.id}
              onClick={() => toggleQuestionType(questionType.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedQuestionTypes.has(questionType.id)
                  ? "border-primary bg-accent ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <questionType.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">{questionType.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{questionType.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Question target</h2>
          <span className="text-2xl font-bold text-primary">{questionTarget[0]}</span>
        </div>
        <Slider
          value={questionTarget}
          onValueChange={setQuestionTarget}
          min={3}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 prompts</span>
          <span>20 prompts</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Session options</h2>
        </div>

        {[
          { key: "explanations" as const, label: "Include coach explanations", description: "Show short answer feedback after each checkpoint." },
          { key: "hints" as const, label: "Offer a hint before reveal", description: "Give learners one nudge before they commit to an answer." },
          { key: "queueReview" as const, label: "Queue spaced review", description: "Send missed checkpoints into the follow-up review list." },
          { key: "allowRetakes" as const, label: "Allow one retry", description: "Let learners take a second attempt on incorrect answers." },
        ].map((sessionOption) => (
          <div key={sessionOption.key} className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm font-medium text-foreground">{sessionOption.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{sessionOption.description}</p>
            </div>
            <Switch checked={sessionOptions[sessionOption.key]} onCheckedChange={() => toggleSessionOption(sessionOption.key)} />
          </div>
        ))}
      </div>

      <button
        disabled={!selectedVideoName}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        Create learning session
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Recent sessions</h2>
        {recentLearningSessions.map((session) => (
          <div key={session.title} className="bg-card rounded-xl p-4 card-shadow-hover flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
              <p className="text-xs text-muted-foreground">{session.questionCount} checkpoints | {session.activityLabel}</p>
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
