# QuizStream

AI-powered video analysis and quiz generation using Google Gemini.

## Features

- Upload and process videos
- AI video understanding and quiz generation using Gemini

## Tech Stack

- Backend: Node.js, Express
- AI APIs: Google Gemini

## Environment Variables

Create a `.env` file in the project root:

```env
GOOGLE_GEMINI_API_KEY=your_key
GOOGLE_GEMINI_MODEL=your_model_here
PORT=5001
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run start
```

Or run the Vite dev server:

```bash
npm run dev
```

Start the backend API in a separate terminal:

```bash
npm run server
```

Open `http://localhost:8080/courses`.

## Project Details

- Backend runs on `http://localhost:5001`
- Frontend dev server runs on `http://localhost:8080`
- Vite proxies `/api` and `/uploads` to the backend in development
- Uploaded MP4 files are stored locally in `/uploads`
- Video metadata and quiz data are stored in `server/database.json`

## API Endpoints

- `POST /api/upload-video` with multipart form field `video`
- `GET /api/videos`
- `DELETE /api/videos/:videoId`
- `GET /api/task-status/:taskId`
- `POST /api/analyze-video`
- `GET /api/quiz/:videoId`
- `GET /api/quiz-status/:videoId`
