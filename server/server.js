import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import { TwelveLabs } from "twelvelabs-js"; // ADD THIS
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize the client

const client = new TwelveLabs({ apiKey: process.env.TWELVE_LABS_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const DEFAULT_GEMINI_MODEL =
  process.env.GOOGLE_GEMINI_MODEL ?? "gemini-3-flash-preview";
const DEFAULT_GEMINI_FALLBACK_MODELS = parseGeminiModelList(
  process.env.GOOGLE_GEMINI_FALLBACK_MODELS,
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(
  cors({
    origin: true, // This automatically reflects the requesting origin perfectly
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb" }));

// Multer for video uploads
const upload = multer({ dest: "uploads/" });

// ============ SIMPLE JSON DATABASE ============
const DB_PATH = path.join(__dirname, "database.json");

// 1. Load existing data when the server boots up
let quizData = {};
let fileHashes = {};

if (fs.existsSync(DB_PATH)) {
  console.log("📂 Loading existing database...");
  const savedData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  quizData = savedData.quizData || {};
  fileHashes = savedData.fileHashes || {};
}

// 2. Helper function to permanently save changes to the hard drive
function saveDatabase() {
  fs.writeFileSync(DB_PATH, JSON.stringify({ quizData, fileHashes }, null, 2));
}

// Helper function to generate a unique fingerprint for a file
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function toSummaryText(summary) {
  if (typeof summary === "string") {
    return summary;
  }

  try {
    return JSON.stringify(summary, null, 2);
  } catch {
    return String(summary ?? "");
  }
}

function parseClockTimeToSeconds(value) {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return Number.NaN;
  }

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return Number.NaN;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return Number.NaN;
}

function parseSummaryTimeToSeconds(value) {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  const trimmed = value.trim().toLowerCase();
  const secondsMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*s$/);
  if (secondsMatch) {
    return Number(secondsMatch[1]);
  }

  return parseClockTimeToSeconds(trimmed);
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

function extractTimelineAnchorsFromSummary(summaryText, offsetSeconds = 5) {
  const normalizedSummary = toSummaryText(summaryText);
  const anchorTimes = [];
  const seen = new Set();

  const intervalPattern =
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(\d{1,2}:\d{2}(?::\d{2})?)/g;
  let match;

  while ((match = intervalPattern.exec(normalizedSummary)) !== null) {
    const endSeconds = parseClockTimeToSeconds(match[2]);
    if (!Number.isFinite(endSeconds)) {
      continue;
    }

    const derivedSeconds = Math.max(0, Math.round(endSeconds + offsetSeconds));
    if (seen.has(derivedSeconds)) {
      continue;
    }

    seen.add(derivedSeconds);
    anchorTimes.push(derivedSeconds);
  }

  return anchorTimes;
}

function extractTimelineAnchorsFromTimestampSummary(
  summaryText,
  offsetSeconds = 25,
) {
  const normalizedSummary = toSummaryText(summaryText);
  const anchorTimes = [];
  const seen = new Set();
  const intervalPatterns = [
    /(\d+(?:\.\d+)?)\s*s\s*[-–—]\s*(\d+(?:\.\d+)?)\s*s/gi,
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(\d{1,2}:\d{2}(?::\d{2})?)/g,
  ];

  for (const intervalPattern of intervalPatterns) {
    let match;

    while ((match = intervalPattern.exec(normalizedSummary)) !== null) {
      const startSeconds = parseSummaryTimeToSeconds(match[1]);
      const endSeconds = parseSummaryTimeToSeconds(match[2]);
      if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
        continue;
      }

      const checkpointTime = Math.max(
        0,
        Math.round(endSeconds + offsetSeconds),
      );
      const answerTime = Math.max(0, Math.round(startSeconds));
      const dedupeKey = `${answerTime}:${checkpointTime}`;

      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      anchorTimes.push({
        time: checkpointTime,
        answerTime,
        answerTimestamp: formatSecondsAsTimestamp(answerTime),
      });
    }
  }

  return anchorTimes.sort((left, right) => left.time - right.time);
}

const VALID_CHECKPOINT_STATUSES = new Set([
  "upcoming",
  "active",
  "completed",
  "incorrect",
]);

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
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const candidates = [withoutFence];

  const firstArrayStart = withoutFence.indexOf("[");
  const lastArrayEnd = withoutFence.lastIndexOf("]");
  if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
    candidates.push(withoutFence.slice(firstArrayStart, lastArrayEnd + 1));
  }

  const firstObjectStart = withoutFence.indexOf("{");
  const lastObjectEnd = withoutFence.lastIndexOf("}");
  if (firstObjectStart >= 0 && lastObjectEnd > firstObjectStart) {
    candidates.push(withoutFence.slice(firstObjectStart, lastObjectEnd + 1));
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
      // Try next candidate.
    }
  }

  throw new InvalidGeminiOutputError("Gemini response was not valid JSON.");
}

function normalizeCheckpoint(rawCheckpoint, index, timelineAnchors = []) {
  if (
    !rawCheckpoint ||
    typeof rawCheckpoint !== "object" ||
    Array.isArray(rawCheckpoint)
  ) {
    throw new InvalidGeminiOutputError(
      `Question ${index + 1} is not a valid object.`,
    );
  }

  const hasTimelineAnchors =
    Array.isArray(timelineAnchors) && timelineAnchors.length > 0;
  const anchorIndex = hasTimelineAnchors
    ? Math.min(index, timelineAnchors.length - 1)
    : -1;
  const selectedAnchor = hasTimelineAnchors ? timelineAnchors[anchorIndex] : null;
  const anchoredTime = Number(
    typeof selectedAnchor === "number" ? selectedAnchor : selectedAnchor?.time,
  );
  const anchoredAnswerTime = Number(
    typeof selectedAnchor === "object" && selectedAnchor
      ? selectedAnchor.answerTime
      : Number.NaN,
  );
  const anchoredAnswerTimestamp =
    typeof selectedAnchor === "object" && selectedAnchor
      ? selectedAnchor.answerTimestamp
      : "";
  const hasAnchoredTime =
    hasTimelineAnchors && Number.isFinite(anchoredTime) && anchoredTime >= 0;
  let normalizedTime = Math.round(anchoredTime);

  if (!hasAnchoredTime) {
    const rawTime = Number(rawCheckpoint.time);
    if (!Number.isFinite(rawTime) || rawTime < 0) {
      throw new InvalidGeminiOutputError(
        `Question ${index + 1} has an invalid 'time' value.`,
      );
    }

    normalizedTime = Math.round(rawTime);
  }

  const question =
    typeof rawCheckpoint.question === "string"
      ? rawCheckpoint.question.trim()
      : "";
  if (!question) {
    throw new InvalidGeminiOutputError(
      `Question ${index + 1} is missing 'question' text.`,
    );
  }

  const candidateOptions = Array.isArray(rawCheckpoint.options)
    ? rawCheckpoint.options
    : Array.isArray(rawCheckpoint.answers)
      ? rawCheckpoint.answers
      : null;

  if (!candidateOptions || candidateOptions.length < 2) {
    throw new InvalidGeminiOutputError(
      `Question ${index + 1} must include at least two answer options.`,
    );
  }

  const options = candidateOptions
    .map((option) => String(option).trim())
    .filter(Boolean);
  if (options.length < 2) {
    throw new InvalidGeminiOutputError(
      `Question ${index + 1} has invalid options after normalization.`,
    );
  }

  const rawCorrectIndex = Number.isInteger(rawCheckpoint.correctIndex)
    ? rawCheckpoint.correctIndex
    : Number.isInteger(rawCheckpoint.correct)
      ? rawCheckpoint.correct
      : Number.NaN;

  if (
    !Number.isInteger(rawCorrectIndex) ||
    rawCorrectIndex < 0 ||
    rawCorrectIndex >= options.length
  ) {
    throw new InvalidGeminiOutputError(
      `Question ${index + 1} has an out-of-range 'correctIndex' value.`,
    );
  }

  const rawLabel =
    typeof rawCheckpoint.label === "string" ? rawCheckpoint.label.trim() : "";
  const rawId =
    typeof rawCheckpoint.id === "string" ? rawCheckpoint.id.trim() : "";
  const rawAnswer =
    typeof rawCheckpoint.answer === "string"
      ? rawCheckpoint.answer.trim()
      : typeof rawCheckpoint.correctAnswerText === "string"
        ? rawCheckpoint.correctAnswerText.trim()
        : "";
  const rawAnswerTime = Number(rawCheckpoint.answerTime);
  const normalizedAnswerTime =
    Number.isFinite(rawAnswerTime) && rawAnswerTime >= 0
      ? Math.round(rawAnswerTime)
      : Number.isFinite(anchoredAnswerTime) && anchoredAnswerTime >= 0
        ? Math.round(anchoredAnswerTime)
        : normalizedTime;
  const rawAnswerTimestamp =
    typeof rawCheckpoint.answerTimestamp === "string"
      ? rawCheckpoint.answerTimestamp.trim()
      : anchoredAnswerTimestamp;
  const rawStatus =
    typeof rawCheckpoint.status === "string" &&
    VALID_CHECKPOINT_STATUSES.has(rawCheckpoint.status)
      ? rawCheckpoint.status
      : "upcoming";

  return {
    id: rawId || `checkpoint-${index + 1}`,
    time: normalizedTime,
    label: rawLabel || `Question ${index + 1}`,
    question,
    options,
    correctIndex: rawCorrectIndex,
    answer: rawAnswer || options[rawCorrectIndex],
    answerTime: normalizedAnswerTime,
    answerTimestamp:
      rawAnswerTimestamp || formatSecondsAsTimestamp(normalizedAnswerTime),
    status: rawStatus,
  };
}

function parseGeminiCheckpoints(rawText, timelineAnchors = []) {
  const payload = extractJsonPayload(rawText);
  const rawCheckpoints = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.checkpoints)
      ? payload.checkpoints
      : Array.isArray(payload?.quizzes)
        ? payload.quizzes
        : null;

  if (!rawCheckpoints) {
    throw new InvalidGeminiOutputError(
      "Gemini must return a JSON array of checkpoint questions.",
    );
  }

  if (rawCheckpoints.length === 0) {
    throw new InvalidGeminiOutputError("Gemini returned zero questions.");
  }

  return rawCheckpoints.map((checkpoint, index) =>
    normalizeCheckpoint(checkpoint, index, timelineAnchors),
  );
}

// ============ UPLOAD VIDEO ============
app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const videoPath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`🚀 Checking file: ${fileName}`);

    // 1. Calculate the digital fingerprint of the file
    const fileFingerprint = await getFileHash(videoPath);

    // 2. Did we already upload this exact video?
    if (fileHashes[fileFingerprint]) {
      const existingVideoId = fileHashes[fileFingerprint];
      const existingData = quizData[existingVideoId];

      console.log(`⚡ Video already exists! Skipping Twelve Labs upload.`);

      // Delete the redundant file we just saved to the uploads folder
      fs.unlinkSync(videoPath);

      // Send back the existing data instantly
      return res.json({
        success: true,
        videoId: existingVideoId,
        fileName: existingData.fileName,
        taskId: existingData.taskId,
      });
    }

    // 3. If it is a brand new video, proceed with upload
    const videoId = `video_${Date.now()}`;
    console.log(`Uploading NEW video to Twelve Labs...`);

    const task = await client.tasks.create({
      indexId: process.env.TWELVE_LABS_INDEX_ID,
      videoFile: fs.createReadStream(videoPath),
      language: "en",
    });

    const taskId = task.id;
    console.log(`✅ Video uploaded successfully! Task ID: ${taskId}`);

    // Store video info
    quizData[videoId] = {
      videoId,
      taskId,
      fileName,
      uploadedAt: new Date(),
      localPath: videoPath, // Keep this one for streaming!
    };

    // 4. Save the fingerprint so we remember it next time!
    fileHashes[fileFingerprint] = videoId;

    // NEW: Save the memory to the hard drive!
    saveDatabase();

    res.json({ success: true, videoId, fileName, taskId });
  } catch (error) {
    console.error("\n❌ TWELVE LABS UPLOAD ERROR:", error.message || error);
    res.status(500).json({ error: "Failed to upload video to Twelve Labs." });
  }
});

// Add this to your server.js
app.get("/api/videos", (req, res) => {
  try {
    // Transform our quizData object into an array for the frontend
    const videos = Object.values(quizData).map((video) => ({
      id: video.videoId,
      title: video.fileName,
      filename: video.fileName,
      videoUrl: `http://localhost:5001/api/video/${video.videoId}`,
      uploadedAt: video.uploadedAt,
      // Pass along the quiz count if it exists
      quizCount: Array.isArray(video.quizzes) ? video.quizzes.length : 0,
    }));

    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to list videos" });
  }
});

// Add to server.js
app.delete("/api/videos/:videoId", (req, res) => {
  const { videoId } = req.params;

  if (quizData[videoId]) {
    // Find the hash associated with this video to remove it from fileHashes too
    const hashToRemove = Object.keys(fileHashes).find(
      (hash) => fileHashes[hash] === videoId,
    );
    if (hashToRemove) delete fileHashes[hashToRemove];

    delete quizData[videoId];
    saveDatabase(); // Persist the deletion to database.json
    console.log(`🗑️ Deleted video: ${videoId}`);
    res.json({ success: true, id: videoId });
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

// ============ CHECK TWELVE LABS TASK STATUS ============
app.get("/api/task-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // FIX: Use client.tasks (plural)
    const task = await client.tasks.retrieve(taskId);

    // Twelve Labs returns status as "pending", "indexing", "ready", or "failed"
    res.json({ success: true, status: task.status });
  } catch (error) {
    console.error("Task status error:", error.message);
    res.status(500).json({ error: "Failed to check task status" });
  }
});

// ============ GENERATE QUIZ ============
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { videoId, prompt, numQuestions } = req.body;

    if (!quizData[videoId]) {
      return res.status(404).json({ error: "Video not found locally" });
    }

    console.log(`Generating quiz for video: ${videoId}`);

    // 1. Get the actual Twelve Labs Video ID from the completed task!
    const task = await client.tasks.retrieve(quizData[videoId].taskId);
    const tlVideoId = task.videoId;

    // 2. Use the official SDK to search ONLY this specific video
    const searchResults = await client.search.query({
      indexId: process.env.TWELVE_LABS_INDEX_ID,
      queryText: prompt,
      options: ["visual", "conversation"],
      filter: {
        id: [tlVideoId], // Restricts the search to the video we just uploaded
      },
    });

    const results = searchResults.data || [];

    // 3. Extract timestamps. If no results, space them out evenly as a fallback.
    let timestamps = [];
    if (results.length > 0) {
      timestamps = results.slice(0, numQuestions).map((result) => ({
        time: Math.floor(result.start),
        segment: prompt,
      }));
    } else {
      console.log(
        "No specific search results found, using default timestamps...",
      );
      for (let i = 0; i < numQuestions; i++) {
        timestamps.push({ time: i * 30 + 10, segment: prompt });
      }
    }

    console.log(
      `Found ${timestamps.length} moments in the video! Sending to Gemini...`,
    );

    // Store quiz data
    quizData[videoId].quizzes = quizzes;

    res.json({ success: true, quizzes, videoId });
  } catch (error) {
    console.error("Generate quiz error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ============ AI PIPELINE: TWELVE LABS -> GEMINI ============
app.post("/api/analyze-video", async (req, res) => {
  try {
    // 1. Extract questionCount from the frontend request!
    const { videoId, geminiPrompt, questionCount } = req.body;

    if (!quizData[videoId]) {
      return res.status(404).json({ error: "Video not found locally" });
    }

    console.log(`🧠 Starting AI Chain for video: ${videoId}`);

    const task = await client.tasks.retrieve(quizData[videoId].taskId);
    const tlVideoId = task.videoId;

    if (!tlVideoId) {
      throw new Error(
        "Twelve Labs has not finished processing this video yet.",
      );
    }

    console.log(
      `1️⃣ Asking Twelve Labs to extract enough info for ${questionCount} questions...`,
    );

    // Answer-specific extraction is intentionally disabled for now.
    const tlGeneration = await client.analyze({
      videoId: tlVideoId,
      prompt: `Create a structured timeline of the most important information covered in this video.

For each distinct key moment:
- include the exact start and end time interval in seconds
- name the concept, event, or explanation happening there
- keep nearby concepts separate instead of merging them together

Make sure there are at least ${questionCount} distinct key moments so another model can generate ${questionCount} high-quality multiple-choice checkpoint questions from your output.`,
    });

    const twelveLabsSummary = tlGeneration.data;

    console.log("✅ Twelve Labs Summary Generated!");

    console.log(twelveLabsSummary);

    console.log("2️⃣ Sending summary to Gemini...");

    const finalGeminiOutput = await processWithGemini(
      twelveLabsSummary,
      geminiPrompt,
      questionCount,
    );

    console.log("✅ Gemini Processing Complete!");

    // Save only normalized checkpoint objects.
    quizData[videoId].quizzes = finalGeminiOutput;

    // NEW: Save it permanently to the hard drive!
    saveDatabase();

    res.json({
      success: true,
      twelveLabsRawOutput: twelveLabsSummary,
      geminiFinalOutput: finalGeminiOutput,
    });

    console.log(finalGeminiOutput);
  } catch (error) {
    if (error instanceof InvalidGeminiOutputError) {
      return res.status(422).json({ error: error.message });
    }

    console.error("AI Pipeline error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ============ GEMINI HELPER ============
async function processWithGemini(twelveLabsSummary, userPrompt, questionCount) {
  try {
    const summaryText = toSummaryText(twelveLabsSummary);
    const timelineAnchors = extractTimelineAnchorsFromTimestampSummary(
      summaryText,
      25,
    );

    if (timelineAnchors.length > 0) {
      console.log(
        `🕒 Derived ${timelineAnchors.length} checkpoint timestamps and replay anchors from Twelve Labs ranges.`,
      );
    }

    // Answer reveal fields are intentionally disabled for now.
    const prompt = `You are an expert educational assistant.

You will receive a timeline summary of a video.
Return ONLY valid JSON. No markdown, no prose, no code fences.

Required output format:
[
  {
    "id": "checkpoint-1",
    "time": 42,
    "label": "Question 1",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "status": "upcoming"
  }
]

Rules:
- Return an array of objects.
- Use only facts from the provided timeline summary.
- 'time' must be numeric seconds >= 0.
- 'correctIndex' must be a 0-based integer that points to an option.
- Include exactly 4 options per question.
- Keep 'status' as "upcoming".

Video timeline summary:
"""
${summaryText}
"""

Task instruction from user:
${userPrompt || `Create ${Number(questionCount) || 3} high-quality multiple-choice checkpoints.`}`;
    const modelsToTry = resolveGeminiModels(
      DEFAULT_GEMINI_MODEL,
      DEFAULT_GEMINI_FALLBACK_MODELS,
      "gemini-2.5-flash",
    );
    const rawText = await runGeminiPrompt(prompt, modelsToTry);
    const draftCheckpoints = parseGeminiCheckpoints(rawText, timelineAnchors);
    return draftCheckpoints;
    // return await polishCheckpointAnswersWithFallback(
    //   draftCheckpoints,
    //   summaryText,
    // );
  } catch (error) {
    if (error instanceof InvalidGeminiOutputError) {
      throw error;
    }

    console.error("Gemini API Error:", error.message || error);
    throw new Error("Failed to process data with Gemini.");
  }
}

async function runGeminiPrompt(prompt, modelsToTry) {
  for (const [index, candidateModel] of modelsToTry.entries()) {
    try {
      const model = genAI.getGenerativeModel({ model: candidateModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (error instanceof InvalidGeminiOutputError) {
        throw error;
      }

      if (
        index < modelsToTry.length - 1 &&
        shouldFallbackToNextGeminiModel(error)
      ) {
        console.warn(
          `Gemini model ${candidateModel} is unavailable, retrying with ${modelsToTry[index + 1]}.`,
        );
        continue;
      }

      throw error;
    }
  }

  throw new Error("All configured Gemini models were unavailable.");
}

function parseGeminiModelList(value) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveGeminiModels(primaryModel, fallbackModels, stableFallbackModel) {
  return [...new Set([
    primaryModel,
    ...fallbackModels,
    primaryModel !== stableFallbackModel ? stableFallbackModel : null,
  ])].filter(Boolean);
}

function resolveFallbackPreferredGeminiModels(
  fallbackModels,
  stableFallbackModel,
) {
  return [...new Set([
    fallbackModels[0] ?? stableFallbackModel,
    ...fallbackModels,
    stableFallbackModel,
  ])].filter(Boolean);
}

function shouldFallbackToNextGeminiModel(error) {
  const statusCode = Number(error?.status ?? error?.statusCode);
  if ([429, 500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  const message = String(error?.message ?? "").toLowerCase();

  return [
    "high demand",
    "service unavailable",
    "try again later",
    "temporarily unavailable",
    "overloaded",
  ].some((fragment) => message.includes(fragment));
}

// async function polishCheckpointAnswersWithFallback(checkpoints, summaryText) {
//   const fallbackModels = resolveFallbackPreferredGeminiModels(
//     DEFAULT_GEMINI_FALLBACK_MODELS,
//     "gemini-2.5-flash",
//   );
//
//   const answerPrompt = `You are improving the answer reveal copy for a study quiz.
//
// Return ONLY valid JSON. No markdown, no prose, no code fences.
//
// Required output format:
// [
//   {
//     "id": "checkpoint-1",
//     "answer": "A concise student-friendly explanation of the correct answer."
//   }
// ]
//
// Rules:
// - Keep the same number of items and the same ids.
// - Rewrite only the 'answer' field.
// - Each answer should be 1-2 sentences max.
// - Use natural student-friendly wording.
// - Do not mention option letters.
// - Do not introduce facts that are not supported by the timeline summary.
//
// Video timeline summary:
// """
// ${summaryText}
// """
//
// Checkpoints:
// ${JSON.stringify(
//     checkpoints.map((checkpoint) => ({
//       id: checkpoint.id,
//       question: checkpoint.question,
//       correctOption: checkpoint.options[checkpoint.correctIndex],
//       answer: checkpoint.answer,
//       answerTimestamp: checkpoint.answerTimestamp,
//     })),
//     null,
//     2,
//   )}`;
//
//   try {
//     const rawText = await runGeminiPrompt(answerPrompt, fallbackModels);
//     const payload = extractJsonPayload(rawText);
//
//     if (!Array.isArray(payload) || payload.length !== checkpoints.length) {
//       throw new InvalidGeminiOutputError(
//         "Gemini returned an invalid answer rewrite payload.",
//       );
//     }
//
//     const answersById = new Map(
//       payload.map((item) => [
//         item?.id,
//         typeof item?.answer === "string" ? item.answer.trim() : "",
//       ]),
//     );
//
//     return checkpoints.map((checkpoint) => ({
//       ...checkpoint,
//       answer: answersById.get(checkpoint.id) || checkpoint.answer,
//     }));
//   } catch (error) {
//     console.warn(
//       "Gemini answer polishing failed, falling back to the draft answers.",
//       error?.message || error,
//     );
//     return checkpoints;
//   }
// }

// ============ GET QUIZ DATA ============
app.get("/api/quiz/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (data.quizzes == null) {
      return res.json({
        videoId,
        fileName: data.fileName,
        quizzes: [],
        uploadedAt: data.uploadedAt,
      });
    }

    if (!Array.isArray(data.quizzes)) {
      return res.status(409).json({
        error:
          "Legacy quiz data format detected for this video. Regenerate quizzes to use the current checkpoint format.",
      });
    }

    const normalizedQuizzes = data.quizzes.map((checkpoint, index) =>
      normalizeCheckpoint(checkpoint, index),
    );

    res.json({
      videoId,
      fileName: data.fileName,
      quizzes: normalizedQuizzes,
      uploadedAt: data.uploadedAt,
    });
  } catch (error) {
    if (error instanceof InvalidGeminiOutputError) {
      return res.status(422).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

// ============ GET QUIZ STATUS ============
app.get("/api/quiz-status/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      videoId,
      status:
        Array.isArray(data.quizzes) && data.quizzes.length > 0
          ? "completed"
          : "processing",
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

    if (!data || !data.localPath) {
      return res.status(404).json({ error: "Video not found" });
    }

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
