import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AppUser,
  CourseQuizSetup,
  CourseRecord,
  DEFAULT_COURSE_QUIZ_SETUP,
  normalizeCourseQuizSetup,
} from "@/lib/app-types";
import { UploadedVideo, deleteVideoFile, listUploadedVideos } from "@/lib/videoApi";

const USER_STORAGE_KEY = "quizstream.user";
const SELECTED_COURSE_STORAGE_KEY = "quizstream.selectedCourseId";
const VIDEO_CACHE_STORAGE_KEY = "quizstream.videoCache";
const COURSE_QUIZ_SETUP_STORAGE_KEY = "quizstream.courseQuizSetups";
const THEME_STORAGE_KEY = "quizstream.theme";

export type AppTheme = "light" | "dark" | "system";

interface AppStateContextValue {
  user: AppUser | null;
  courses: CourseRecord[];
  selectedCourse: CourseRecord | null;
  selectedCourseId: string | null;
  theme: AppTheme;
  isLoadingCourses: boolean;
  coursesError: string | null;
  createUser: (profile: { name: string; email: string }) => void;
  updateUser: (profile: { name: string; email: string }) => void;
  logout: () => void;
  setTheme: (theme: AppTheme) => void;
  selectCourse: (courseId: string | null) => void;
  refreshCourses: (preferredCourseId?: string) => Promise<CourseRecord[]>;
  saveCourseQuizSetup: (courseId: string, quizSetup: CourseQuizSetup) => void;
  deleteCourse: (courseId: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(() => readStoredUser());
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>(() => readCachedVideos());
  const [theme, setThemeState] = useState<AppTheme>(() => readStoredTheme());
  const [courseQuizSetups, setCourseQuizSetups] = useState<Record<string, CourseQuizSetup>>(
    () => readStoredCourseQuizSetups(),
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(SELECTED_COURSE_STORAGE_KEY);
  });
  const [isLoadingCourses, setIsLoadingCourses] = useState(uploadedVideos.length === 0);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const selectedCourseIdRef = useRef(selectedCourseId);
  const courseQuizSetupsRef = useRef(courseQuizSetups);

  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  useEffect(() => {
    courseQuizSetupsRef.current = courseQuizSetups;
    window.localStorage.setItem(COURSE_QUIZ_SETUP_STORAGE_KEY, JSON.stringify(courseQuizSetups));
  }, [courseQuizSetups]);

  useEffect(() => {
    window.localStorage.setItem(VIDEO_CACHE_STORAGE_KEY, JSON.stringify(uploadedVideos));
  }, [uploadedVideos]);

  useEffect(() => {
    if (selectedCourseId) {
      window.localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, selectedCourseId);
      return;
    }

    window.localStorage.removeItem(SELECTED_COURSE_STORAGE_KEY);
  }, [selectedCourseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedTheme = theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;
      root.classList.toggle("dark", resolvedTheme === "dark");
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  const mergeCourses = useCallback((videos: UploadedVideo[], setups: Record<string, CourseQuizSetup>) => (
    videos.map((video) => ({
      ...video,
      quizSetup: normalizeCourseQuizSetup(setups[video.id] ?? DEFAULT_COURSE_QUIZ_SETUP),
    }))
  ), []);

  const refreshCourses = useCallback(async (preferredCourseId?: string) => {
    setIsLoadingCourses(true);

    try {
      const nextVideos = await listUploadedVideos();
      setUploadedVideos(nextVideos);
      setCoursesError(null);

      const nextSelectedCourseId =
        (preferredCourseId &&
          nextVideos.some((video) => video.id === preferredCourseId) &&
          preferredCourseId) ||
        (selectedCourseIdRef.current &&
          nextVideos.some((video) => video.id === selectedCourseIdRef.current) &&
          selectedCourseIdRef.current) ||
        nextVideos[0]?.id ||
        null;

      setSelectedCourseId(nextSelectedCourseId);
      return mergeCourses(nextVideos, courseQuizSetupsRef.current);
    } catch (error) {
      const fallbackVideos = readCachedVideos();
      const message = error instanceof Error ? error.message : "Unable to load uploaded courses.";

      if (fallbackVideos.length > 0) {
        setUploadedVideos(fallbackVideos);
      }

      setCoursesError(message);
      return mergeCourses(fallbackVideos, courseQuizSetupsRef.current);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [mergeCourses]);

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  function createUser(profile: { name: string; email: string }) {
    const nextUser = buildUser(profile);
    setUser(nextUser);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  function updateUser(profile: { name: string; email: string }) {
    const nextUser = buildUser(profile);
    setUser(nextUser);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(SELECTED_COURSE_STORAGE_KEY);
    setSelectedCourseId(null);
  }

  function setTheme(themeValue: AppTheme) {
    setThemeState(themeValue);
  }

  function selectCourse(courseId: string | null) {
    setSelectedCourseId(courseId);
  }

  function saveCourseQuizSetup(courseId: string, quizSetup: CourseQuizSetup) {
    const normalizedSetup = normalizeCourseQuizSetup(quizSetup);
    courseQuizSetupsRef.current = {
      ...courseQuizSetupsRef.current,
      [courseId]: normalizedSetup,
    };
    setCourseQuizSetups(courseQuizSetupsRef.current);
  }

  async function deleteCourse(courseId: string) {
    const previousVideos = uploadedVideos;
    const previousQuizSetups = courseQuizSetupsRef.current;
    const previousSelectedCourseId = selectedCourseIdRef.current;
    const nextVideos = previousVideos.filter((video) => video.id !== courseId);
    const nextQuizSetups = { ...previousQuizSetups };

    delete nextQuizSetups[courseId];

    setUploadedVideos(nextVideos);
    window.localStorage.setItem(VIDEO_CACHE_STORAGE_KEY, JSON.stringify(nextVideos));
    courseQuizSetupsRef.current = nextQuizSetups;
    setCourseQuizSetups(nextQuizSetups);
    window.localStorage.setItem(COURSE_QUIZ_SETUP_STORAGE_KEY, JSON.stringify(nextQuizSetups));

    if (previousSelectedCourseId === courseId) {
      setSelectedCourseId(null);
    }

    try {
      await deleteVideoFile(courseId);
      setCoursesError(null);
      await refreshCourses();
    } catch (error) {
      setUploadedVideos(previousVideos);
      window.localStorage.setItem(VIDEO_CACHE_STORAGE_KEY, JSON.stringify(previousVideos));
      courseQuizSetupsRef.current = previousQuizSetups;
      setCourseQuizSetups(previousQuizSetups);
      window.localStorage.setItem(COURSE_QUIZ_SETUP_STORAGE_KEY, JSON.stringify(previousQuizSetups));
      setSelectedCourseId(previousSelectedCourseId);
      throw error;
    }
  }

  const courses = useMemo(
    () => mergeCourses(uploadedVideos, courseQuizSetups),
    [courseQuizSetups, mergeCourses, uploadedVideos],
  );
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;

  return (
    <AppStateContext.Provider
      value={{
        user,
        courses,
        selectedCourse,
        selectedCourseId,
        theme,
        isLoadingCourses,
        coursesError,
        createUser,
        updateUser,
        logout,
        setTheme,
        selectCourse,
        refreshCourses,
        saveCourseQuizSetup,
        deleteCourse,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }

  return context;
}

function buildUser(profile: { name: string; email: string }): AppUser {
  return {
    name: profile.name.trim(),
    email: profile.email.trim(),
    initials: getInitials(profile.name),
    plan: "Personal Workspace",
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "QS";
}

function readStoredUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    const parsedUser = JSON.parse(rawUser) as AppUser;

    if (!parsedUser?.name || !parsedUser?.email) {
      return null;
    }

    return parsedUser;
  } catch {
    return null;
  }
}

function readCachedVideos() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawVideos = window.localStorage.getItem(VIDEO_CACHE_STORAGE_KEY);

    if (!rawVideos) {
      return [];
    }

    const parsedVideos = JSON.parse(rawVideos) as UploadedVideo[];
    return Array.isArray(parsedVideos) ? parsedVideos : [];
  } catch {
    return [];
  }
}

function readStoredCourseQuizSetups() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawSetups = window.localStorage.getItem(COURSE_QUIZ_SETUP_STORAGE_KEY);

    if (!rawSetups) {
      return {};
    }

    const parsedSetups = JSON.parse(rawSetups) as Record<string, Partial<CourseQuizSetup>>;

    return Object.fromEntries(
      Object.entries(parsedSetups).map(([courseId, setup]) => [
        courseId,
        normalizeCourseQuizSetup(setup),
      ]),
    );
  } catch {
    return {};
  }
}

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
    ? storedTheme
    : "system";
}
