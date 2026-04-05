import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  FileVideo,
  Sparkles,
  Brain,
  PenLine,
  ListOrdered,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/AppStateContext";
import {
  DEFAULT_COURSE_QUIZ_SETUP,
  normalizeCourseQuizSetup,
} from "@/lib/app-types";
// Ensure these three functions are exported in your videoApi.ts
import { uploadVideoFile, getTaskStatus, analyzeVideo } from "@/lib/videoApi";

const sessionQuestionTypes = [
  { id: "checkpoint", label: "Checkpoint Quiz", description: "Pause at key concepts with a quick multiple-choice check", icon: Brain },
  { id: "reflection", label: "Short Reflection", description: "Capture a one-sentence takeaway after a segment", icon: PenLine },
  { id: "ordering", label: "Sequence Recall", description: "Rebuild a process or model in the correct order", icon: ListOrdered },
  { id: "truefalse", label: "True or False", description: "Use fast confidence checks between explanations", icon: CheckCircle2 },
  { id: "term-recall", label: "Key Term Recall", description: "Prompt learners to complete an important definition", icon: FileText },
];

interface AddCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated?: () => void;
}

const AddCourseModal = ({ open, onOpenChange, onCourseCreated }: AddCourseModalProps) => {
  const { user, refreshCourses, saveCourseQuizSetup } = useAppState();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<Set<string>>(
    new Set(DEFAULT_COURSE_QUIZ_SETUP.questionTypes),
  );
  const [questionTarget, setQuestionTarget] = useState([DEFAULT_COURSE_QUIZ_SETUP.questionTarget]);
  const [sessionOptions, setSessionOptions] = useState(DEFAULT_COURSE_QUIZ_SETUP.sessionOptions);
  
  // Pipeline UI States
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const firstName = user?.name.split(" ")[0] ?? "there";

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

  const handleCreateCourse = async () => {
    if (!selectedFile) {
      setUploadError("Choose an MP4 file before creating a course.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setStatusText("Uploading to Twelve Labs...");

    try {
      // 1. Upload Video to Node Backend (which sends to Twelve Labs)
      const uploadRes = await uploadVideoFile(selectedFile);
      const { videoId, taskId } = uploadRes;

      // 2. Poll for Indexing Status
      const checkStatus = async () => {
        try {
          const statusData = await getTaskStatus(taskId);
          
          if (statusData.status === 'ready') {
            setStatusText("AI is generating your quiz questions...");
            
            // 3. Trigger Gemini Analysis
            await analyzeVideo(
              videoId, 
              questionTarget[0], 
              `Turn this video into ${questionTarget[0]} high-quality multiple-choice questions. 
               Focus on these styles: ${Array.from(selectedQuestionTypes).join(", ")}.`
            );

            // 4. Save the UI setup and Refresh the Context
            const quizSetup = normalizeCourseQuizSetup({
              questionTypes: Array.from(selectedQuestionTypes),
              questionTarget: questionTarget[0],
              sessionOptions,
            });

            saveCourseQuizSetup(videoId, quizSetup);
            await refreshCourses(videoId);
            
            onCourseCreated?.();
            onOpenChange(false);
          } else if (statusData.status === 'failed') {
            throw new Error("Twelve Labs failed to index the video.");
          } else {
            // Still indexing... update status and check again in 5 seconds
            setStatusText(`AI is watching your video... (${statusData.status})`);
            setTimeout(checkStatus, 5000);
          }
        } catch (pollErr: any) {
          setUploadError(pollErr.message);
          setIsUploading(false);
        }
      };

      checkStatus();

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  // ... (Keep handleDrop, handleFileSelect, resetForm, and toggleSessionOption from your code)
  const toggleSessionOption = (key: keyof typeof sessionOptions) => {
    setSessionOptions((previousOptions) => ({
      ...previousOptions,
      [key]: !previousOptions[key],
    }));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError(null);
  };

  function resetForm() {
    setIsDragging(false);
    setSelectedFile(null);
    setSelectedQuestionTypes(new Set(DEFAULT_COURSE_QUIZ_SETUP.questionTypes));
    setQuestionTarget([DEFAULT_COURSE_QUIZ_SETUP.questionTarget]);
    setSessionOptions(DEFAULT_COURSE_QUIZ_SETUP.sessionOptions);
    setIsUploading(false);
    setStatusText(null);
    setUploadError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-[860px] overflow-y-auto rounded-3xl border-border/70 p-0">
        <div className="bg-card">
          <DialogHeader className="space-y-1.5 border-b border-border px-4 py-3.5 text-left sm:px-5">
            <DialogTitle className="text-xl">Add a course to {firstName}&apos;s library</DialogTitle>
            <DialogDescription>
              Import an MP4, choose the quiz style you want, and QuizStream AI will handle the rest.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            {/* File Dropzone */}
            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-7 text-center transition-all sm:p-8 ${
                isDragging ? "border-primary bg-primary/5" : selectedFile ? "border-success bg-success/5" : "border-border hover:border-primary/40"
              }`}
            >
              <input type="file" accept="video/mp4" onChange={handleFileSelect} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2.5">
                  <FileVideo className="h-7 w-7 text-success" />
                  <p className="text-sm font-semibold">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <Upload className="h-7 w-7 text-primary" />
                  <p className="text-sm font-semibold">Drop a lecture recording here</p>
                </div>
              )}
            </div>

            {/* Question Mix & Target Sliders (Keep your existing UI) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-tertiary" />
                <h2 className="text-base font-semibold text-foreground">Question mix</h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {sessionQuestionTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleQuestionType(type.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedQuestionTypes.has(type.id) ? "border-primary bg-accent ring-1 ring-primary/20" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <type.icon className="mb-1.5 h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{type.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Question target</h2>
                <span className="text-2xl font-bold text-primary">{questionTarget[0]}</span>
              </div>
              <Slider value={questionTarget} onValueChange={setQuestionTarget} min={3} max={20} step={1} className="w-full" />
            </div>

            {/* Options List (Keep your existing UI) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning" />
                <h2 className="text-base font-semibold text-foreground">Session options</h2>
              </div>
              {[
                { key: "explanations" as const, label: "Include coach explanations" },
                { key: "hints" as const, label: "Offer a hint before reveal" },
                { key: "queueReview" as const, label: "Queue spaced review" },
                { key: "allowRetakes" as const, label: "Allow one retry" },
              ].map((opt) => (
                <div key={opt.key} className="flex items-center justify-between gap-4 py-0.5">
                  <Label className="text-sm font-medium">{opt.label}</Label>
                  <Switch checked={sessionOptions[opt.key]} onCheckedChange={() => toggleSessionOption(opt.key)} />
                </div>
              ))}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="pr-2 text-xs text-muted-foreground">
                AI Pipeline: Video is indexed by Twelve Labs before Gemini generates your interactive quiz.
              </p>
              <Button onClick={handleCreateCourse} disabled={isUploading || !selectedFile} className="rounded-xl min-w-[160px]">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                    {statusText && <span className="text-[10px] font-normal opacity-80 mt-1">{statusText}</span>}
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create course
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;