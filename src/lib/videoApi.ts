import axios from "axios";

// This interface matches what AppStateContext and your components expect
export interface UploadedVideo {
  id: string;
  title: string;
  filename: string;
  videoUrl: string;
  uploadedAt: string;
}

// 1. Fetch all videos from the backend (Used by AppStateContext)
export async function listUploadedVideos() {
  const response = await fetch("/api/videos");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to load uploaded videos.");
  }
  return (await response.json()) as UploadedVideo[];
}

// 2. Centralized Upload (Used by Home.tsx)
export async function uploadVideoFile(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append("video", file);

  const response = await axios.post('/api/upload-video', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    },
  });
  return response.data; // Returns { success, videoId, taskId }
}

// 3. Poll for Twelve Labs indexing status (Used by Home.tsx)
export async function getTaskStatus(taskId: string) {
  const response = await fetch(`/api/task-status/${taskId}`);
  if (!response.ok) throw new Error("Failed to check video status");
  return await response.json();
}

// 4. Centralized AI Analysis (Used by Home.tsx)
export async function analyzeVideo(videoId: string, questionCount: number, prompt: string) {
  const response = await fetch('/api/analyze-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, questionCount, geminiPrompt: prompt })
  });
  if (!response.ok) throw new Error("Failed to analyze video");
  return await response.json();
}

// 5. Centralized Quiz Fetching (Used by Courses.tsx and Watch.tsx)
export async function getQuizData(videoId: string) {
  const response = await fetch(`/api/quiz/${videoId}`);
  if (!response.ok) throw new Error("Failed to load quiz");
  return await response.json();
}

// 6. Delete a video from the backend (Used by AppStateContext)
export async function deleteVideoFile(videoId: string) {
  const response = await fetch(`/api/videos/${videoId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Delete failed.");
  }

  return (await response.json()) as { success: boolean; id: string };
}