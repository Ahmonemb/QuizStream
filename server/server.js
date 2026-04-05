import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";

dotenv.config();

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

// Store quiz data in memory (in production, use database)
const quizData = {};

// ============ UPLOAD VIDEO ============
app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const videoPath = req.file.path;
    const fileName = req.file.originalname;
    const videoId = `video_${Date.now()}`;

    console.log(`🚀 Uploading video: ${fileName}`);

    // 1. Get the exact file size so Twelve Labs' firewall doesn't panic
    const stats = fs.statSync(videoPath);

    const formData = new FormData();
    formData.append("index_id", process.env.TWELVE_LABS_INDEX_ID); 
    formData.append("language", "en");
    
    // 2. Pass the 'knownLength' to the stream
    formData.append("file", fs.createReadStream(videoPath), { knownLength: stats.size });

    const uploadRes = await axios.post(
      "https://api.twelvelabs.io/v1.2/tasks", 
      formData,
      {
        headers: {
          "Authorization": `Bearer ${process.env.TWELVE_LABS_API_KEY}`,
          ...formData.getHeaders(), 
        },
        // 3. Tell Axios to allow massive files!
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const taskId = uploadRes.data._id; 
    console.log(`✅ Video uploaded successfully! Task ID: ${taskId}`);

    quizData[videoId] = {
      videoId,
      taskId, 
      fileName,
      uploadedAt: new Date(),
      localPath: videoPath,
    };

    res.json({ success: true, videoId, fileName, taskId });
  } catch (error) {
    if (error.response) {
      console.error("\n❌ TWELVE LABS REJECTED THE UPLOAD:");
      console.error("Status Code:", error.response.status);
      console.error("Reason:", JSON.stringify(error.response.data, null, 2) || "File too large/Nginx blocked");
      return res.status(500).json({ error: "Twelve Labs rejected the file." });
    } else if (error.request) {
      console.error("\n❌ NO RESPONSE FROM TWELVE LABS");
      return res.status(500).json({ error: "Could not connect to Twelve Labs API." });
    } else {
      console.error("\n❌ LOCAL SERVER ERROR:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }
});

// ============ CHECK TWELVE LABS TASK STATUS ============
app.get("/api/task-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const response = await axios.get(
      `https://api.twelvelabs.io/v1.2/tasks/${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.TWELVE_LABS_API_KEY}`
        }
      }
    );

    // Twelve Labs returns status as "pending", "indexing", "ready", or "failed"
    res.json({ success: true, status: response.data.status });
  } catch (error) {
    console.error("Task status error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to check task status" });
  }
});

// ============ GENERATE QUIZ ============
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { videoId, prompt, numQuestions } = req.body;

    if (!quizData[videoId]) {
      return res.status(404).json({ error: "Video not found" });
    }

    console.log(`Generating quiz for video: ${videoId}`);

    const indexId = quizData[videoId].indexId;

    // Step 1: Search the video for relevant segments
    const searchRes = await axios.post(
      `https://api.twelvelabs.io/v1.2/search`,
      {
        query: prompt,
        index_id: indexId,
        threshold: "medium",
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.TWELVE_LABS_API_KEY}`,
        },
      }
    );

    // Extract timestamps from search results
    const results = searchRes.data.data || [];
    const timestamps = results.slice(0, numQuestions).map((result, idx) => ({
      time: Math.floor(result.start || idx * 30), // Default spacing if no start time
      segment: result.text || prompt,
    }));

    // Step 2: Generate questions using OpenAI or local AI
    const quizzes = await generateQuestionsWithAI(timestamps, prompt);

    // Store quiz data
    quizData[videoId].quizzes = quizzes;

    res.json({ success: true, quizzes, videoId });
  } catch (error) {
    console.error("Generate quiz error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ GENERATE QUESTIONS WITH AI ============
async function generateQuestionsWithAI(timestamps, userPrompt) {
  const quizzes = [];

  try {
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];

      // Use Google Gemini to generate questions
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Give me a general overview of the important information that is covered, with time intervals of when the information is given. Make sure the time intervals are in seconds.`,
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

      const content = response.data.candidates[0].content.parts[0].text;
      const quiz = JSON.parse(content);
      quiz.time = ts.time;
      quizzes.push(quiz);
    }
  } catch (error) {
    console.error("AI generation error:", error.message);
    
    // Fallback: Generate mock questions if AI fails
    return timestamps.map((ts, idx) => ({
      time: ts.time,
      question: `Question ${idx + 1}: What is the main topic discussed?`,
      answers: ["Option A", "Option B", "Option C", "Option D"],
      correct: Math.floor(Math.random() * 4),
    }));
  }

  return quizzes;
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
