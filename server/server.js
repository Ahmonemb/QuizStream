import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// 1. IMPORT GOOGLE AI SDK AND FILE MANAGER
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

dotenv.config();

// 2. INITIALIZE GEMINI CLIENTS
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_GEMINI_API_KEY);

// Fallback to a fast multimodal model if not specified
const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "gemini-1.5-flash"; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb" }));

// Multer for video uploads
const upload = multer({ dest: "uploads/" });

// ============ SIMPLE JSON DATABASE ============
const DB_PATH = path.join(__dirname, "database.json");

let quizData = {};
let fileHashes = {};

if (fs.existsSync(DB_PATH)) {
  console.log("📂 Loading existing database...");
  const savedData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  quizData = savedData.quizData || {};
  fileHashes = savedData.fileHashes || {};
}

function saveDatabase() {
  fs.writeFileSync(DB_PATH, JSON.stringify({ quizData, fileHashes }, null, 2));
}

function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function formatSecondsAsTimestamp(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }
  const roundedSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

class InvalidGeminiOutputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidGeminiOutputError";
  }
}

function extractJsonPayload(rawText) {
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new InvalidGeminiOutputError("Gemini returned an empty response.");
  }

  const trimmed = rawText.trim();
  const withoutFence = trimmed
    .replace(/\s*```$/, "")
    .trim();
  const candidates = [withoutFence];

  const firstArrayStart = withoutFence.indexOf("[");
  const lastArrayEnd = withoutFence.lastIndexOf("]");
  if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
    candidates.push(withoutFence.slice(firstArrayStart, lastArrayEnd + 1));
  }

  const seen = new Set();
  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    try {
      return JSON.parse(normalized);
    } catch {
      // Try next candidate
    }
  }

  throw new InvalidGeminiOutputError("Gemini response was not valid JSON.");
}

function normalizeCheckpoint(rawCheckpoint, index) {
  if (!rawCheckpoint || typeof rawCheckpoint !== "object" || Array.isArray(rawCheckpoint)) {
    throw new InvalidGeminiOutputError(`Question ${index + 1} is not a valid object.`);
  }

  const rawTime = Number(rawCheckpoint.time);
  if (!Number.isFinite(rawTime) || rawTime < 0) {
    throw new InvalidGeminiOutputError(`Question ${index + 1} has an invalid 'time' value.`);
  }
  const normalizedTime = Math.round(rawTime);

  const question = typeof rawCheckpoint.question === "string" ? rawCheckpoint.question.trim() : "";
  if (!question) {
    throw new InvalidGeminiOutputError(`Question ${index + 1} is missing 'question' text.`);
  }

  const candidateOptions = Array.isArray(rawCheckpoint.options) ? rawCheckpoint.options : null;
  if (!candidateOptions || candidateOptions.length < 2) {
    throw new InvalidGeminiOutputError(`Question ${index + 1} must include at least two answer options.`);
  }

  const options = candidateOptions.map((option) => String(option).trim()).filter(Boolean);
  
  const rawCorrectIndex = Number.isInteger(rawCheckpoint.correctIndex) ? rawCheckpoint.correctIndex : Number.NaN;
  if (!Number.isInteger(rawCorrectIndex) || rawCorrectIndex < 0 || rawCorrectIndex >= options.length) {
    throw new InvalidGeminiOutputError(`Question ${index + 1} has an out-of-range 'correctIndex' value.`);
  }

  return {
    id: rawCheckpoint.id || `checkpoint-${index + 1}`,
    time: normalizedTime,
    label: rawCheckpoint.label || `Question ${index + 1}`,
    question,
    options,
    correctIndex: rawCorrectIndex,
    answer: options[rawCorrectIndex],
    answerTime: normalizedTime,
    answerTimestamp: formatSecondsAsTimestamp(normalizedTime),
    status: "upcoming",
  };
}

function parseGeminiCheckpoints(rawText) {
  try {
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleaned);
    return Array.isArray(data) ? data : data.quizzes || [];
  } catch (e) {
    console.error("JSON Parse Error:", rawText);
    throw new Error("AI returned an invalid format. Please try again.");
  }
}

// ============ UPLOAD VIDEO ============
app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const videoPath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype || "video/mp4";

    console.log(`🚀 Checking file: ${fileName}`);

    const fileFingerprint = await getFileHash(videoPath);

    if (fileHashes[fileFingerprint]) {
      const existingVideoId = fileHashes[fileFingerprint];
      const existingData = quizData[existingVideoId];
      console.log(`⚡ Video already exists! Skipping Gemini upload.`);
      
      // ADD THIS: Reset the timer for the existing video
      existingData.currentRequestStartTime = Date.now();
      saveDatabase();

      fs.unlinkSync(videoPath);
      return res.json({
        success: true,
        videoId: existingVideoId,
        fileName: existingData.fileName,
        taskId: existingData.geminiFileName, 
      });
    }

    const videoId = `video_${Date.now()}`;
    console.log(`Uploading NEW video to Google Gemini servers...`);

    const uploadResponse = await fileManager.uploadFile(videoPath, {
      mimeType: mimeType,
      displayName: fileName,
    });

    const geminiFileName = uploadResponse.file.name;
    const geminiFileUri = uploadResponse.file.uri;
    console.log(`✅ Video uploaded successfully! Gemini File Name: ${geminiFileName}`);

    quizData[videoId] = {
      videoId,
      geminiFileName, 
      geminiFileUri,  
      fileName,
      uploadedAt: new Date(),
      localPath: videoPath, 
      // ADD THIS: Start the timer for the new video
      currentRequestStartTime: Date.now(), 
    };

    fileHashes[fileFingerprint] = videoId;
    saveDatabase();

    res.json({ success: true, videoId, fileName, taskId: geminiFileName });
  } catch (error) {
    console.error("\n❌ GEMINI UPLOAD ERROR:", error.message || error);
    res.status(500).json({ error: "Failed to upload video to Gemini." });
  }
});

app.get("/api/videos", (req, res) => {
  try {
    const videos = Object.values(quizData).map((video) => ({
      id: video.videoId,
      title: video.fileName,
      filename: video.fileName,
      videoUrl: `http://localhost:5001/api/video/${video.videoId}`,
      uploadedAt: video.uploadedAt,
      quizCount: Array.isArray(video.quizzes) ? video.quizzes.length : 0,
    }));
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to list videos" });
  }
});

app.delete("/api/videos/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (quizData[videoId]) {
    try {
      // Optional: Delete from Gemini servers to save storage quotas
      await fileManager.deleteFile(quizData[videoId].geminiFileName);
    } catch (e) {
      console.log("Could not delete from Gemini servers, but proceeding locally.");
    }

    const hashToRemove = Object.keys(fileHashes).find((hash) => fileHashes[hash] === videoId);
    if (hashToRemove) delete fileHashes[hashToRemove];

    delete quizData[videoId];
    saveDatabase(); 
    console.log(`🗑️ Deleted video: ${videoId}`);
    res.json({ success: true, id: videoId });
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

// ============ CHECK GEMINI VIDEO PROCESSING STATUS ============
app.get("/api/task-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params; // taskId is the geminiFileName
    
    // 4. POLL GEMINI FILE STATE
    const file = await fileManager.getFile(taskId);
    
    // Map Gemini states to what your frontend expects
    // Gemini states: PROCESSING, ACTIVE, FAILED
    let frontendStatus = "indexing";
    if (file.state === "ACTIVE") frontendStatus = "ready";
    if (file.state === "FAILED") frontendStatus = "failed";

    res.json({ success: true, status: frontendStatus });
  } catch (error) {
    console.error("Task status error:", error.message);
    res.status(500).json({ error: "Failed to check task status" });
  }
});

// ============ AI PIPELINE: SINGLE PASS MULTIMODAL GEMINI ============
app.post("/api/analyze-video", async (req, res) => {
  try {
    const { videoId, geminiPrompt, questionCount } = req.body;

    if (!quizData[videoId]) {
      return res.status(404).json({ error: "Video not found locally" });
    }

    const videoInfo = quizData[videoId];
    console.log(`🧠 Starting AI Chain for video: ${videoId}`);

    // Check if the file is ready on Gemini's end
    const file = await fileManager.getFile(videoInfo.geminiFileName);
    if (file.state !== "ACTIVE") {
       throw new Error("Video is still processing. Please wait.");
    }

    console.log(`1️⃣ Asking Gemini to analyze video and generate ${questionCount} questions...`);

    const finalGeminiOutput = await processWithGemini(
      videoInfo.geminiFileUri,
      videoInfo.localPath,
      geminiPrompt,
      questionCount
    );

    console.log("✅ Gemini Processing Complete!");

    // REPLACE THE OLD MATH WITH THIS:
    const startTime = videoInfo.currentRequestStartTime || Date.now();
    const currentTimestamp = Date.now();
    const totalTimeInSeconds = ((currentTimestamp - startTime) / 1000).toFixed(2);

    console.log(`\n⏱️ TOTAL PIPELINE TIME (Button Click to Finish): ${totalTimeInSeconds} seconds\n`);

    quizData[videoId].quizzes = finalGeminiOutput;
    saveDatabase();

    res.json({
      success: true,
      geminiFinalOutput: finalGeminiOutput,
    });
  } catch (error) {
    if (error instanceof InvalidGeminiOutputError) {
      return res.status(422).json({ error: error.message });
    }
    console.error("AI Pipeline error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ============ GEMINI HELPER ============
async function processWithGemini(fileUri, localPath, userPrompt, questionCount) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const mimeType = "video/mp4"; // Ensure consistency
      
      // Check if the frontend requested automatic question counting
      const isAuto = String(questionCount).toLowerCase() === "auto";
      
      const countInstruction = isAuto
        ? "Analyze the video and automatically determine the optimal number of distinct, high-impact learning moments based on the density of the concepts taught."
        : `Identify exactly ${Number(questionCount) || 5} distinct, high-impact learning moments.`;

      const userInstructionText = isAuto
        ? "Create the optimal number of high-quality multiple-choice checkpoints based on the video's content."
        : `Create ${Number(questionCount) || 5} questions.`;

      // IMPROVED PROMPT: Specifically designed to handle long-duration context
      const prompt = `You are an expert educational designer. You are analyzing a long-form lecture video.

Task:
1. ${countInstruction}
2. IMPORTANT: Space these moments out appropriately across the entire duration of the video.
3. For each moment, provide a precise timestamp (in seconds) where a student should pause for a knowledge check.
4. Generate a multiple-choice question for each moment that tests the material immediately preceding the timestamp.

Return ONLY valid JSON in this format:
[
  {
    "id": "checkpoint-1",
    "time": 42,
    "label": "Concept Check",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "status": "upcoming"
  }
]

Rules:
- JSON only. No markdown fences.
- 'time' must be numeric seconds.
- Provide exactly 4 options per question.
- Ensure questions are pedagogical and test comprehension, not just trivia.

User instructions: ${userPrompt || userInstructionText}`;

      const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
      
      console.log(`⏳ [Attempt ${attempt + 1}] Processing long-form video via Gemini...`);
      const inferenceStartTime = Date.now();

      const result = await model.generateContent([
        { fileData: { mimeType, fileUri } },
        { text: prompt }
      ]);

      const inferenceEndTime = Date.now();
      const rawText = result.response.text();
      
      console.log(`⏱️ Inference Time: ${((inferenceEndTime - inferenceStartTime) / 1000).toFixed(2)}s`);
      console.log("🤖 RAW RESPONSE PREVIEW:", rawText.substring(0, 100) + "...");

      return parseGeminiCheckpoints(rawText);

    } catch (error) {
      attempt++;
      const statusCode = error?.status || error?.statusCode;
      
      if ((statusCode === 503 || statusCode === 429 || statusCode === 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2000; 
        console.warn(`⚠️ Gemini busy or errored (${statusCode}). Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error("Gemini API Error:", error.message);
      throw new Error(attempt >= maxRetries ? "The AI is currently busy analyzing this long video. Please try again in a moment." : "Failed to process video.");
    }
  }
}

function mimeTypeFromFilePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  return "video/mp4"; // Default fallback
}


// ============ GET QUIZ DATA ============
app.get("/api/quiz/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data) return res.status(404).json({ error: "Video not found" });

    if (data.quizzes == null) {
      return res.json({ videoId, fileName: data.fileName, quizzes: [], uploadedAt: data.uploadedAt });
    }

    const normalizedQuizzes = data.quizzes.map((checkpoint, index) => normalizeCheckpoint(checkpoint, index));

    res.json({ videoId, fileName: data.fileName, quizzes: normalizedQuizzes, uploadedAt: data.uploadedAt });
  } catch (error) {
    if (error instanceof InvalidGeminiOutputError) return res.status(422).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ============ GET QUIZ STATUS ============
app.get("/api/quiz-status/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data) return res.status(404).json({ error: "Video not found" });

    res.json({
      videoId,
      status: Array.isArray(data.quizzes) && data.quizzes.length > 0 ? "completed" : "processing",
      fileName: data.fileName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVE VIDEO ============
app.get("/api/video/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data || !data.localPath) return res.status(404).json({ error: "Video not found" });

    const videoPath = data.localPath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
