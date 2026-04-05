import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import { TwelveLabs } from 'twelvelabs-js'; // ADD THIS
import crypto from "crypto";


dotenv.config();

// Initialize the client

const client = new TwelveLabs({ apiKey: process.env.TWELVE_LABS_API_KEY });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({
  origin: true, // This automatically reflects the requesting origin perfectly
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb" }));

// Multer for video uploads
const upload = multer({ dest: "uploads/" });

// Store quiz data in memory
const quizData = {};
// Store file hashes to prevent duplicate uploads (Hash -> videoId)
const fileHashes = {};

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
        taskId: existingData.taskId 
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

    res.json({ success: true, videoId, fileName, taskId });
    
  } catch (error) {
    console.error("\n❌ TWELVE LABS UPLOAD ERROR:", error.message || error);
    res.status(500).json({ error: "Failed to upload video to Twelve Labs." });
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
        id: [tlVideoId] // Restricts the search to the video we just uploaded
      }
    });

    const results = searchResults.data || [];
    
    // 3. Extract timestamps. If no results, space them out evenly as a fallback.
    let timestamps = [];
    if (results.length > 0) {
      timestamps = results.slice(0, numQuestions).map((result) => ({
        time: Math.floor(result.start),
        segment: prompt 
      }));
    } else {
      console.log("No specific search results found, using default timestamps...");
      for (let i = 0; i < numQuestions; i++) {
        timestamps.push({ time: i * 30 + 10, segment: prompt });
      }
    }

    console.log(`Found ${timestamps.length} moments in the video! Sending to Gemini...`);

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
    const { videoId, geminiPrompt } = req.body;

    if (!quizData[videoId]) {
      return res.status(404).json({ error: "Video not found locally" });
    }

    console.log(`🧠 Starting AI Chain for video: ${videoId}`);

    // STEP 1: Get the actual Twelve Labs Video ID
    const task = await client.tasks.retrieve(quizData[videoId].taskId);
    const tlVideoId = task.videoId;

    if (!tlVideoId) {
      throw new Error("Twelve Labs has not finished processing this video yet.");
    }

    console.log("1️⃣ Asking Twelve Labs to summarize the video...");

    // STEP 2: Use Twelve Labs 'Generate' API to get the summary with timestamps
    const tlGeneration = await client.analyze({
      videoId: tlVideoId,
      prompt: "Give me a general overview of the important information that is covered, with time intervals of when the information is given. Make sure the time intervals are in seconds."
    });

    // The new analyze method still stores the response exactly where we expect it!
    const twelveLabsSummary = tlGeneration.data;
    
    console.log("✅ Twelve Labs Summary Generated!");
    console.log(twelveLabsSummary);

    console.log("2️⃣ Sending summary to Gemini...");

    // STEP 3: Pass the Twelve Labs output directly into Gemini
    const finalGeminiOutput = await processWithGemini(twelveLabsSummary, geminiPrompt);
    
    console.log("✅ Gemini Processing Complete!");

    // Return the final data to your React frontend!
    res.json({ 
      success: true, 
      twelveLabsRawOutput: twelveLabsSummary,
      geminiFinalOutput: finalGeminiOutput 
    });

  } catch (error) {
    console.error("AI Pipeline error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ============ GEMINI HELPER ============
async function processWithGemini(twelveLabsSummary, userPrompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are an expert educational assistant. 
                
                Here is a summary and timeline of a video provided by a video-understanding AI:
                """
                ${twelveLabsSummary}
                """
                
                Based ONLY on the video information above, please complete the following task:
                ${userPrompt || "Format this summary into a clean, easy-to-read study guide."}`
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw new Error("Failed to process data with Gemini.");
  }
}

// ============ GET QUIZ DATA ============
app.get("/api/quiz/:videoId", (req, res) => {
  try {
    const { videoId } = req.params;
    const data = quizData[videoId];

    if (!data) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      videoId,
      fileName: data.fileName,
      quizzes: data.quizzes || [],
      uploadedAt: data.uploadedAt,
    });
  } catch (error) {
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
      status: data.quizzes ? "completed" : "processing",
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
