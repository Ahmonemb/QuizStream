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

- Backend runs on `http://localhost:3001`
- Frontend dev server runs on `http://localhost:8080`
- Vite proxies `/api` and `/uploads` to the backend in development
- Uploaded MP4 files are stored locally in `/uploads`
- Video metadata is stored in `backend/data/videos.json`

## API endpoints

- `POST /api/videos` with multipart form field `video`
- `GET /api/videos`
- `GET /api/videos/:id`
