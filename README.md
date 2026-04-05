# QuizStream

Prototype flow for uploading local MP4 files and playing them inside the Courses tab.

## Local setup

Install dependencies:

```bash
npm install
```

Run the backend API in one terminal:

```bash
npm run server
```

Run the frontend in another terminal:

```bash
npm run dev
```

Open `http://localhost:8080/courses`.

## Prototype details

- Backend runs on `http://localhost:5001`
- Frontend dev server runs on `http://localhost:8080`
- Vite proxies `/api` and `/uploads` to the backend in development
- Uploaded MP4 files are stored locally in `/uploads`
- Video metadata and quiz data are stored in `server/database.json`

## API endpoints

- `POST /api/upload-video` with multipart form field `video`
- `GET /api/videos`
- `DELETE /api/videos/:videoId`
- `GET /api/task-status/:taskId`
- `POST /api/analyze-video`
- `GET /api/quiz/:videoId`
- `GET /api/quiz-status/:videoId`
