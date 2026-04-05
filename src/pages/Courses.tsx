import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  Share2,
  Tag,
  Trash2,
  Video,
} from "lucide-react";
import AddCourseModal from "@/components/AddCourseModal";
import VideoPlayer from "@/components/VideoPlayer";
import QuizModal from "@/components/QuizModal";
import ProgressPanel from "@/components/ProgressPanel";
import { Checkpoint } from "@/lib/app-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppStateContext";
import {
  buildCoursePresentation,
  createPersonalizedCheckpoints,
  formatUploadDate,
} from "@/lib/coursePresentation";

const syncCheckpointState = (previousCheckpoints: Checkpoint[], nextCheckpoints: Checkpoint[]) => {
  const statusMap = new Map(previousCheckpoints.map((checkpoint) => [checkpoint.id, checkpoint.status]));

  return nextCheckpoints.map((checkpoint) => ({
    ...checkpoint,
    status: statusMap.get(checkpoint.id) ?? checkpoint.status,
  }));
};

const updateCheckpointQueue = (checkpoints: Checkpoint[]) => {
  const nextPendingCheckpoint = checkpoints.find(
    (checkpoint) => checkpoint.status !== "completed" && checkpoint.status !== "incorrect",
  );

  return checkpoints.map((checkpoint) => {
    if (checkpoint.status === "completed" || checkpoint.status === "incorrect") {
      return checkpoint;
    }

    return {
      ...checkpoint,
      status: checkpoint.id === nextPendingCheckpoint?.id ? "active" : "upcoming",
    };
  });
};

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionCheckpoints, setSessionCheckpoints] = useState<Checkpoint[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Checkpoint | null>(null);
  const [triggeredCheckpointIds, setTriggeredCheckpointIds] = useState<Set<string>>(new Set());
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isLibraryView, setIsLibraryView] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const firstName = user?.name.split(" ")[0] ?? "there";
  const coursePresentation = buildCoursePresentation(selectedCourse, user, duration);

  useEffect(() => {
    if (courses.length === 0) {
      setIsLibraryView(true);
    }
  }, [courses.length]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setActiveQuiz(null);
    setTriggeredCheckpointIds(new Set());
    setSessionCheckpoints(createPersonalizedCheckpoints(selectedCourse));
  }, [selectedCourse?.id]);

  useEffect(() => {
    if (!selectedCourse || duration <= 0) {
      return;
    }

    setSessionCheckpoints((previousCheckpoints) =>
      syncCheckpointState(previousCheckpoints, createPersonalizedCheckpoints(selectedCourse, duration)),
    );
  }, [duration, selectedCourse]);

  useEffect(() => {
    if (activeQuiz) {
      return;
    }

    const nextCheckpoint = sessionCheckpoints.find(
      (checkpoint) =>
        Math.abs(currentTime - checkpoint.time) < 1 &&
        !triggeredCheckpointIds.has(checkpoint.id) &&
        checkpoint.status !== "completed" &&
        checkpoint.status !== "incorrect",
    );

    if (nextCheckpoint) {
      setIsPlaying(false);
      setActiveQuiz(nextCheckpoint);
      setTriggeredCheckpointIds((previousIds) => new Set(previousIds).add(nextCheckpoint.id));
    }
  }, [activeQuiz, currentTime, sessionCheckpoints, triggeredCheckpointIds]);

  const handleQuizClose = (correct: boolean) => {
    if (!activeQuiz) {
      return;
    }

    setSessionCheckpoints((previousCheckpoints) =>
      updateCheckpointQueue(
        previousCheckpoints.map((checkpoint) =>
          checkpoint.id === activeQuiz.id
            ? { ...checkpoint, status: correct ? "completed" : "incorrect" }
            : checkpoint,
        ),
      ),
    );
    setActiveQuiz(null);
    setIsPlaying(true);
  };

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

      if (selectedCourseId === courseId) {
        setIsLibraryView(true);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete this course.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  const correctCheckpointCount = sessionCheckpoints.filter((checkpoint) => checkpoint.status === "completed").length;
  const answeredCheckpointCount = sessionCheckpoints.filter(
    (checkpoint) => checkpoint.status === "completed" || checkpoint.status === "incorrect",
  ).length;
  const accuracy =
    answeredCheckpointCount > 0
      ? Math.round((correctCheckpointCount / answeredCheckpointCount) * 100)
      : 0;
  const showPlayerView = !isLibraryView && Boolean(selectedCourse && coursePresentation);

  return (
    <>
      <div className="flex min-w-0 flex-1">
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mx-auto max-w-[960px] px-4 py-6 lg:px-8">
            {showPlayerView && selectedCourse && coursePresentation ? (
              <>
                <div className="mb-5">
                  <Button variant="outline" onClick={() => setIsLibraryView(true)} className="rounded-xl">
                    <ArrowLeft className="h-4 w-4" />
                    Back to library
                  </Button>
                </div>

                <VideoPlayer
                  lessonTitle={selectedCourse.title}
                  lessonSubtitle={coursePresentation.moduleTitle}
                  videoUrl={selectedCourse.videoUrl}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  checkpoints={sessionCheckpoints}
                  overlay={
                    activeQuiz ? <QuizModal checkpoint={activeQuiz} onClose={handleQuizClose} /> : null
                  }
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  onPlayingChange={setIsPlaying}
                />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{coursePresentation.moduleTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {coursePresentation.instructor} / {coursePresentation.courseCode} / {coursePresentation.durationLabel} / Uploaded {formatUploadDate(selectedCourse.uploadedAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {coursePresentation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
                    <Share2 className="h-4 w-4" />
                    Share Session
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Course Library</p>
                    <h1 className="text-2xl font-bold text-foreground">
                      {courses.length > 0 ? `${firstName}'s courses` : `Start ${firstName}'s library`}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {courses.length > 0
                        ? "Select a course to open it in the player, or add a new MP4 with a custom quiz setup."
                        : "There are no courses yet. Add an MP4 to create the first playable lesson in this workspace."}
                    </p>
                  </div>

                  <Button onClick={() => setIsAddCourseOpen(true)} className="rounded-xl">
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
                          Uploaded lessons appear here automatically after they are created from the add-course modal.
                        </CardDescription>
                      </div>
                      {coursesError && (
                        <Button variant="outline" size="sm" onClick={() => void refreshCourses()}>
                          <RefreshCw className="h-4 w-4" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionError && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {actionError}
                      </div>
                    )}
                    {isLoadingCourses ? (
                      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                        Loading course library...
                      </div>
                    ) : coursesError ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
                        {coursesError}
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                          <Video className="h-7 w-7 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">Your course library is empty</p>
                          <p className="text-sm text-muted-foreground">
                            Add an MP4 to create a new course, save its quiz setup, and make it available in the player.
                          </p>
                        </div>
                        <Button onClick={() => setIsAddCourseOpen(true)} className="rounded-xl">
                          <Plus className="h-4 w-4" />
                          Add your first course
                        </Button>
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
                                  <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                                  <p className="mt-1 truncate text-xs text-muted-foreground">{course.filename}</p>
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDeleteCourse(course.id);
                                  }}
                                  disabled={isDeleting}
                                  className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>Uploaded {formatUploadDate(course.uploadedAt)}</span>
                                <span>/</span>
                                <span>{course.quizSetup.questionTarget} prompts</span>
                                <span>/</span>
                                <span>{course.quizSetup.questionTypes.join(", ")}</span>
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

        {showPlayerView && selectedCourse && (
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
