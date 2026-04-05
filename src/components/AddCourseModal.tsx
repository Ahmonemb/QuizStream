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
import { uploadVideoFile } from "@/lib/videoApi";

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
  const [isUploading, setIsUploading] = useState(false);
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
        if (nextTypes.size > 1) {
          nextTypes.delete(id);
        }
      } else {
        nextTypes.add(id);
      }

      return nextTypes;
    });
  };

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

  const handleCreateCourse = async () => {
    if (!selectedFile) {
      setUploadError("Choose an MP4 file before creating a course.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedVideo = await uploadVideoFile(selectedFile);
      const quizSetup = normalizeCourseQuizSetup({
        questionTypes: Array.from(selectedQuestionTypes),
        questionTarget: questionTarget[0],
        sessionOptions,
      });

      saveCourseQuizSetup(uploadedVideo.id, quizSetup);
      await refreshCourses(uploadedVideo.id);
      onCourseCreated?.();
      onOpenChange(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-[860px] overflow-y-auto rounded-3xl border-border/70 p-0">
        <div className="bg-card">
          <DialogHeader className="space-y-1.5 border-b border-border px-4 py-3.5 text-left sm:px-5">
            <DialogTitle className="text-xl">Add a course to {firstName}&apos;s library</DialogTitle>
            <DialogDescription>
              Import an MP4, choose the quiz style you want, and QuizStream will create a playable course using the current backend upload flow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-7 text-center transition-all sm:p-8 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="file"
                accept="video/mp4,.mp4"
                onChange={handleFileSelect}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                    <FileVideo className="h-7 w-7 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">Click or drag a new recording to replace it.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Drop a lecture recording here</p>
                  <p className="text-xs text-muted-foreground">or click to browse for an MP4 lesson clip</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-tertiary" />
                <h2 className="text-base font-semibold text-foreground">Question mix</h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {sessionQuestionTypes.map((questionType) => (
                  <button
                    key={questionType.id}
                    onClick={() => toggleQuestionType(questionType.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedQuestionTypes.has(questionType.id)
                        ? "border-primary bg-accent ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <questionType.icon className="mb-1.5 h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{questionType.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{questionType.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
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

            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning" />
                <h2 className="text-base font-semibold text-foreground">Session options</h2>
              </div>

              {[
                { key: "explanations" as const, label: "Include coach explanations", description: "Show short answer feedback after each checkpoint." },
                { key: "hints" as const, label: "Offer a hint before reveal", description: "Give learners one nudge before they commit to an answer." },
                { key: "queueReview" as const, label: "Queue spaced review", description: "Send missed checkpoints into the follow-up review list." },
                { key: "allowRetakes" as const, label: "Allow one retry", description: "Let learners take a second attempt on incorrect answers." },
              ].map((sessionOption) => (
                <div key={sessionOption.key} className="flex items-center justify-between gap-4 py-0.5">
                  <div>
                    <Label className="text-sm font-medium text-foreground">{sessionOption.label}</Label>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{sessionOption.description}</p>
                  </div>
                  <Switch
                    checked={sessionOptions[sessionOption.key]}
                    onCheckedChange={() => toggleSessionOption(sessionOption.key)}
                  />
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
                Prototype note: the MP4 still uploads through the existing local backend, and the selected quiz setup is saved in localStorage for this course.
              </p>
              <Button onClick={handleCreateCourse} disabled={isUploading || !selectedFile} className="rounded-xl">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating course...
                  </>
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

  function resetForm() {
    setIsDragging(false);
    setSelectedFile(null);
    setSelectedQuestionTypes(new Set(DEFAULT_COURSE_QUIZ_SETUP.questionTypes));
    setQuestionTarget([DEFAULT_COURSE_QUIZ_SETUP.questionTarget]);
    setSessionOptions(DEFAULT_COURSE_QUIZ_SETUP.sessionOptions);
    setIsUploading(false);
    setUploadError(null);
  }
};

export default AddCourseModal;
