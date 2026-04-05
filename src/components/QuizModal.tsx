import { useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { Checkpoint } from "@/lib/app-types";

interface QuizModalProps {
  checkpoint: Checkpoint;
  onClose: (correct: boolean) => void;
}

const QuizModal = ({ checkpoint, onClose }: QuizModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === checkpoint.correctIndex;

  const handleSubmit = () => {
    if (selected === null) {
      return;
    }

    setSubmitted(true);
  };

  const handleContinue = () => {
    onClose(isCorrect);
  };

  const getOptionClasses = (index: number) => {
    const base = "w-full rounded-xl border p-4 text-left text-sm font-medium transition-all";

    if (!submitted) {
      if (selected === index) {
        return `${base} border-primary bg-accent text-accent-foreground`;
      }

      return `${base} border-border text-foreground hover:border-primary/50`;
    }

    if (index === checkpoint.correctIndex) {
      return `${base} border-success bg-success/10 text-foreground`;
    }

    if (selected === index && !isCorrect) {
      return `${base} border-destructive bg-destructive/10 text-foreground`;
    }

    return `${base} border-border text-muted-foreground`;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-foreground/55 backdrop-blur-sm" onClick={handleContinue} />

      <div
        className="relative z-10 w-full max-w-[520px] max-h-[min(78vh,680px)] overflow-y-auto rounded-2xl bg-card p-5 sm:p-6 animate-modal-in"
        style={{ boxShadow: "var(--shadow-xl)" }}
      >
        <button
          type="button"
          onClick={handleContinue}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-3 py-1 text-xs font-semibold text-tertiary">
          <span className="h-2 w-2 rounded-full bg-tertiary" />
          Checkpoint Quiz
        </div>

        <h2 className="mb-6 text-lg font-semibold text-foreground">{checkpoint.question}</h2>

        <div className="mb-6 space-y-3">
          {checkpoint.options.map((option, index) => (
            <button
              key={option}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(index)}
              className={getOptionClasses(index)}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{option}</span>
                {submitted && index === checkpoint.correctIndex && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                )}
                {submitted && selected === index && !isCorrect && index !== checkpoint.correctIndex && (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>

        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
                isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {isCorrect
                ? "Correct. The concept is ready for review later."
                : "Not quite. Keep the idea in mind for the next explanation."}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
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
