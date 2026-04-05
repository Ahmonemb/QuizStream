import { useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { Checkpoint } from "@/data/courseData";

interface QuizModalProps {
  checkpoint: Checkpoint;
  onClose: (correct: boolean) => void;
}

const QuizModal = ({ checkpoint, onClose }: QuizModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === checkpoint.correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    onClose(isCorrect);
  };

  const getOptionClasses = (index: number) => {
    const base = "w-full p-4 rounded-xl border text-left text-sm font-medium transition-all";
    if (!submitted) {
      if (selected === index) return `${base} border-primary bg-accent text-accent-foreground`;
      return `${base} border-border hover:border-primary/50 text-foreground`;
    }
    if (index === checkpoint.correctIndex) return `${base} border-success bg-success/10 text-foreground`;
    if (selected === index && !isCorrect) return `${base} border-destructive bg-destructive/10 text-foreground`;
    return `${base} border-border text-muted-foreground`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={handleContinue} />

      <div className="relative w-full max-w-[520px] mx-4 bg-card rounded-2xl p-8 animate-modal-in" style={{ boxShadow: "var(--shadow-xl)" }}>
        <button onClick={handleContinue} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="inline-flex items-center gap-2 bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <span className="h-2 w-2 rounded-full bg-tertiary" />
          Checkpoint Quiz
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-6">{checkpoint.question}</h2>

        <div className="space-y-3 mb-6">
          {checkpoint.options.map((option, index) => (
            <button
              key={option}
              disabled={submitted}
              onClick={() => setSelected(index)}
              className={getOptionClasses(index)}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {submitted && index === checkpoint.correctIndex && (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                )}
                {submitted && selected === index && !isCorrect && index !== checkpoint.correctIndex && (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}>
              {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {isCorrect ? "Correct. The concept is ready for review later." : "Not quite. Keep the idea in mind for the next explanation."}
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;
