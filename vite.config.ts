import { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import {
  buildQuizPrompt,
  GEMINI_MODEL,
  GeminiResponse,
  getTwelveLabsOverviewFromStream,
} from "./src/lib/geminiQuizShared";

const GEMINI_QUIZ_ENDPOINT = "/api/gemini/quiz";

const readJsonBody = async (request: IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });

const sendJson = (response: ServerResponse, statusCode: number, payload: unknown) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
};

const createGeminiQuizMiddleware = (apiKey?: string) => {
  return async (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const pathname = request.url?.split("?")[0];

    if (pathname !== GEMINI_QUIZ_ENDPOINT) {
      next();
      return;
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (!apiKey) {
      sendJson(response, 500, { error: "Missing GEMINI_API_KEY in your .env file." });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const overview = typeof body.overview === "string" && body.overview.trim()
        ? body.overview
        : getTwelveLabsOverviewFromStream();
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: buildQuizPrompt(overview) }],
              },
            ],
          }),
        },
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        sendJson(response, geminiResponse.status, {
          error: `Gemini request failed: ${geminiResponse.status} ${errorText}`,
        });
        return;
      }

      const data = (await geminiResponse.json()) as GeminiResponse;
      const quizText = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!quizText) {
        sendJson(response, 502, { error: "Gemini returned an empty response." });
        return;
      }

      sendJson(response, 200, { overview, quizText });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected Gemini endpoint error.";
      sendJson(response, 500, { error: message });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  const geminiQuizMiddleware = createGeminiQuizMiddleware(geminiApiKey);

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      {
        name: "gemini-quiz-endpoint",
        configureServer(server) {
          server.middlewares.use(geminiQuizMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(geminiQuizMiddleware);
        },
      },
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
