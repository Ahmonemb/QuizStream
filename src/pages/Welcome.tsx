import { useState, type FormEvent } from "react";
import { GraduationCap } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Welcome = () => {
  const navigate = useNavigate();
  const { user, createUser } = useAppState();
  const [formValues, setFormValues] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string } = {};

    if (!formValues.name.trim()) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!emailPattern.test(formValues.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createUser(formValues);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md rounded-3xl border-border/70 shadow-xl">
        <CardHeader className="space-y-4 pb-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">QuizStream</p>
            <CardTitle className="text-3xl">Create your learning profile</CardTitle>
            <CardDescription className="text-sm">
              Set up a lightweight profile so QuizStream can personalize your lesson library and study flow.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(event) => {
                  setFormValues((previous) => ({ ...previous, name: event.target.value }));
                  setErrors((previous) => ({ ...previous, name: undefined }));
                }}
                placeholder="Jordan Lee"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(event) => {
                  setFormValues((previous) => ({ ...previous, email: event.target.value }));
                  setErrors((previous) => ({ ...previous, email: undefined }));
                }}
                placeholder="jordan@quizstream.app"
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <Button type="submit" className="w-full rounded-xl">
              Create Account
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Prototype only. Your profile is saved locally in this browser so you can jump back in quickly.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
