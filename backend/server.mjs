import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const uploadsDirectory = path.join(projectRoot, "uploads");
const dataDirectory = path.join(__dirname, "data");
const metadataFile = path.join(dataDirectory, "videos.json");
const port = Number(process.env.PORT ?? 3001);

const app = express();

ensureStorage();

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".mp4";
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    const isMp4File =
      file.mimetype === "video/mp4" || path.extname(file.originalname).toLowerCase() === ".mp4";

    if (!isMp4File) {
      const error = new Error("Only MP4 video uploads are supported.");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.get("/api/videos", (_request, response) => {
  response.json(readVideos());
});

app.get("/api/videos/:id", (request, response) => {
  const video = readVideos().find((entry) => entry.id === request.params.id);

  if (!video) {
    response.status(404).json({ error: "Video not found." });
    return;
  }

  response.json(video);
});

app.delete("/api/videos/:id", (request, response) => {
  const existingVideos = readVideos();
  const videoToDelete = existingVideos.find((entry) => entry.id === request.params.id);

  if (!videoToDelete) {
    response.status(404).json({ error: "Video not found." });
    return;
  }

  try {
    cleanupUploadedFile(path.join(uploadsDirectory, videoToDelete.filename));
    writeVideos(existingVideos.filter((entry) => entry.id !== request.params.id));
    response.json({ success: true, id: request.params.id });
  } catch {
    response.status(500).json({ error: "The video could not be deleted." });
  }
});

app.post("/api/videos", (request, response) => {
  upload.single("video")(request, response, (error) => {
    if (error) {
      handleUploadError(error, response);
      return;
    }

    if (!request.file) {
      response.status(400).json({ error: "Choose an MP4 file to upload." });
      return;
    }

    try {
      const videoRecord = createVideoRecord(request.file);
      writeVideos([videoRecord, ...readVideos()]);
      response.status(201).json(videoRecord);
    } catch {
      cleanupUploadedFile(request.file.path);
      response.status(500).json({ error: "The video uploaded, but metadata could not be saved." });
    }
  });
});

app.listen(port, () => {
  console.log(`QuizStream prototype backend listening on http://localhost:${port}`);
});

function ensureStorage() {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  fs.mkdirSync(dataDirectory, { recursive: true });

  if (!fs.existsSync(metadataFile)) {
    fs.writeFileSync(metadataFile, "[]\n", "utf8");
  }
}

function readVideos() {
  ensureStorage();

  try {
    const fileContents = fs.readFileSync(metadataFile, "utf8");
    const parsedVideos = JSON.parse(fileContents);
    return Array.isArray(parsedVideos) ? parsedVideos : [];
  } catch {
    return [];
  }
}

function writeVideos(videos) {
  fs.writeFileSync(metadataFile, `${JSON.stringify(videos, null, 2)}\n`, "utf8");
}

function createVideoRecord(file) {
  return {
    id: randomUUID(),
    title: path.parse(file.originalname).name || "Untitled upload",
    filename: file.filename,
    videoUrl: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString(),
    duration: null,
  };
}

function cleanupUploadedFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Cleanup failure should not mask the original API error.
  }
}

function handleUploadError(error, response) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      response.status(400).json({ error: "Video is too large. Keep uploads under 500 MB for this prototype." });
      return;
    }

    response.status(400).json({ error: error.message });
    return;
  }

  const statusCode = Number(error.statusCode) || 500;
  response.status(statusCode).json({ error: error.message || "Upload failed." });
}
