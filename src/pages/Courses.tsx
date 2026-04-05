import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Video,
  AlertCircle,
} from "lucide-react";
import AddCourseModal from "@/components/AddCourseModal";
import VideoPlayer from "@/components/VideoPlayer";
import ProgressPanel from "@/components/ProgressPanel";
import { Checkpoint } from "@/lib/app-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppState } from "@/context/AppStateContext";

interface QuizResponse {
  videoId: string;
  fileName: string;
  quizzes: Checkpoint[];
  uploadedAt: string;
}

const formatVideoTitle = (title: string) => title.replace(/\.mp4$/i, "");

const Courses = () => {
  const {
    user,
    courses,
    selectedCourse,
    selectedCourseId,
    isLoadingCourses,
    coursesError,
    selectCourse,
    refreshCourses,
    deleteCourse,
  } = useAppState();

  // Combined State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionCheckpoints, setSessionCheckpoints] = useState<Checkpoint[]>(
    [],
  );

  // UI Toggles
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isLibraryView, setIsLibraryView] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // AI Fetching Status
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const firstName = user?.name.split(" ")[0] ?? "there";

  useEffect(() => {
    if (courses.length === 0) setIsLibraryView(true);
  }, [courses.length]);

  // When a course is selected, fetch the REAL AI checkpoints!
  useEffect(() => {
    if (!selectedCourse || isLibraryView) return;

    const fetchCourseData = async () => {
      setLoadingAI(true);
      setAiError(null);
      try {
        const res = await fetch(`/api/quiz/${selectedCourse.id}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Course data not found on AI server.",
          );
        }

        const data: QuizResponse = await res.json();

        if (data && Array.isArray(data.quizzes)) {
          setSessionCheckpoints(data.quizzes);
        } else {
          setSessionCheckpoints([]);
          console.warn(
            "Backend returned data, but quizzes is not an array:",
            data,
          );
        }
      } catch (err: unknown) {
        setAiError(
          err instanceof Error ? err.message : "Unable to load AI course data.",
        );
      } finally {
        setLoadingAI(false);
      }
    };

    fetchCourseData();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [selectedCourse?.id, isLibraryView]);

  const handleSelectCourse = (courseId: string) => {
    setActionError(null);
    selectCourse(courseId);
    setIsLibraryView(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    setDeletingCourseId(courseId);
    setActionError(null);
    try {
      await deleteCourse(courseId);
      if (selectedCourseId === courseId) setIsLibraryView(true);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete this course.",
      );
    } finally {
      setDeletingCourseId(null);
    }
  };

  const correctCheckpointCount = sessionCheckpoints.filter(
    (cp) => cp.status === "completed",
  ).length;
  const answeredCheckpointCount = sessionCheckpoints.filter(
    (cp) => cp.status === "completed" || cp.status === "incorrect",
  ).length;
  const accuracy =
    answeredCheckpointCount > 0
      ? Math.round((correctCheckpointCount / answeredCheckpointCount) * 100)
      : 0;
  const showPlayerView = !isLibraryView && Boolean(selectedCourse);

  return (
    <>
      <div className="flex min-w-0 flex-1">
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mx-auto max-w-[960px] px-4 py-6 lg:px-8">
            {showPlayerView && selectedCourse ? (
              <>
                <div className="mb-5">
                  <Button
                    variant="outline"
                    onClick={() => setIsLibraryView(true)}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to library
                  </Button>
                </div>

                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 bg-card rounded-2xl border border-border">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Loading AI interactive session...
                    </p>
                  </div>
                ) : aiError ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 bg-destructive/5 rounded-2xl border border-destructive/30">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-destructive font-medium">{aiError}</p>
                  </div>
                ) : (
                  <>
                    <VideoPlayer
                      videoId={selectedCourse.id}
                      lessonTitle={formatVideoTitle(selectedCourse.title)}
                      lessonSubtitle={`${sessionCheckpoints.length} AI Checkpoints`}
                      videoUrl={selectedCourse.videoUrl}
                      currentTime={currentTime}
                      duration={duration}
                      isPlaying={isPlaying}
                      checkpoints={sessionCheckpoints}
                      onTimeUpdate={setCurrentTime}
                      onDurationChange={setDuration}
                      onPlayingChange={setIsPlaying}
                      onCheckpointStatusChange={setSessionCheckpoints}
                    />
                    <div className="mt-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {formatVideoTitle(selectedCourse.title)}
                      </h2>
                    </div>
                  </>
                )}
              </>
            ) : (
              // --- LIBRARY VIEW ---
              <>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                      Course Library
                    </p>
                    <h1 className="text-2xl font-bold text-foreground">
                      {courses.length > 0
                        ? `${firstName}'s courses`
                        : `Start ${firstName}'s library`}
                    </h1>
                  </div>
                  <Button
                    onClick={() => setIsAddCourseOpen(true)}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Add course
                  </Button>
                </div>

                <Card className="mb-5 card-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Video className="h-4 w-4 text-secondary" />
                          Course Library
                        </CardTitle>
                        <CardDescription>
                          Select an AI lesson to begin an interactive session.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                          <Video className="h-7 w-7 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            Your course library is empty
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {courses.map((course) => {
                          const isDeleting = deletingCourseId === course.id;
                          return (
                            <div
                              key={course.id}
                              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleSelectCourse(course.id)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {formatVideoTitle(course.title)}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {course.filename}
                                  </p>
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteCourse(course.id);
                                  }}
                                  disabled={isDeleting}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {showPlayerView && selectedCourse && !loadingAI && (
          <ProgressPanel
            checkpoints={sessionCheckpoints}
            accuracy={accuracy}
            answered={answeredCheckpointCount}
            currentStreak={correctCheckpointCount}
            timeWatched={`${Math.floor(currentTime / 60)}m ${Math.floor(currentTime % 60)}s`}
          />
        )}
      </div>

      <AddCourseModal
        open={isAddCourseOpen}
        onOpenChange={setIsAddCourseOpen}
        onCourseCreated={() => {
          setActionError(null);
          setIsLibraryView(false);
        }}
      />
    </>
  );
};

export default Courses;
