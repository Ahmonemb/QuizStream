export interface UploadedVideo {
  id: string;
  title: string;
  filename: string;
  videoUrl: string;
  uploadedAt: string;
  duration: number | null;
}

export async function listUploadedVideos() {
  const response = await fetch("/api/videos");

  if (!response.ok) {
    throw new Error(await getApiError(response, "Unable to load uploaded videos."));
  }

  return (await response.json()) as UploadedVideo[];
}

export async function uploadVideoFile(file: File) {
  const formData = new FormData();
  formData.append("video", file);

  const response = await fetch("/api/videos", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Upload failed."));
  }

  return (await response.json()) as UploadedVideo;
}

async function getApiError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
