const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const RETRYABLE_GEMINI_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const TIMESTAMP_PATTERN = /\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/g;
const CORRECT_ANSWER_INDEX = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

export class GeminiQuizError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "GeminiQuizError";
    this.statusCode = statusCode;
  }
}

export function extractTimestampedLabEntries(labData) {
  if (typeof labData !== "string" || labData.trim().length === 0) {
    return [];
  }

  const matches = Array.from(labData.matchAll(TIMESTAMP_PATTERN));

  return matches
    .map((match, index) => {
      const timestamp = match[0];
      const startIndex = (match.index ?? 0) + timestamp.length;
      const endIndex = matches[index + 1]?.index ?? labData.length;
      const text = labData
        .slice(startIndex, endIndex)
        .replace(/^[\s\-–—:|>]+/, "")
        .trim();

      return {
        id: `lab-entry-${index + 1}`,
        index,
        timestamp,
        time: parseTimestampToSeconds(timestamp),
        text,
      };
    })
    .filter((entry) => entry.text.length > 0);
}

export function parseTimestampToSeconds(timestamp) {
  if (typeof timestamp !== "string" || timestamp.trim().length === 0) {
    throw new GeminiQuizError("Timestamp is required to build quiz checkpoints.", 400);
  }

  const parts = timestamp.split(":").map((part) => Number(part));

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    throw new GeminiQuizError(`Unsupported timestamp format: ${timestamp}`, 400);
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

export async function generateGeminiQuiz(
  {
    labEntries,
    title = "",
    courseId = "",
    model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
    fallbackModels = parseGeminiModelList(process.env.GEMINI_FALLBACK_MODELS),
    apiKey = process.env.GEMINI_API_KEY,
  },
  fetchImpl = fetch,
) {
  if (!Array.isArray(labEntries) || labEntries.length === 0) {
    throw new GeminiQuizError("At least one timestamped lab entry is required.", 400);
  }

  if (!apiKey) {
    throw new GeminiQuizError("Missing GEMINI_API_KEY for quiz generation.", 500);
  }

  const responseSchema = buildGeminiQuizSchema(labEntries.length);
  const prompt = buildGeminiPrompt({ labEntries, title, courseId });
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: responseSchema,
    },
  };
  const modelsToTry = resolveGeminiModels(model, fallbackModels);

  let response;
  let lastErrorMessage = "Gemini quiz generation failed.";

  for (const [index, candidateModel] of modelsToTry.entries()) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      throw new GeminiQuizError("Gemini quiz generation request failed.", 502);
    }

    if (response.ok) {
      break;
    }

    const message = await readErrorMessage(response);
    lastErrorMessage = message;

    if (
      index < modelsToTry.length - 1 &&
      shouldFallbackToNextModel(response.status, message)
    ) {
      continue;
    }

    throw new GeminiQuizError(message, 502);
  }

  if (!response?.ok) {
    throw new GeminiQuizError(lastErrorMessage, 502);
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new GeminiQuizError("Gemini returned an unreadable response.", 502);
  }

  const rawText = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text ?? "")
    .join("")
    .trim();

  if (!rawText) {
    throw new GeminiQuizError("Gemini returned an empty quiz response.", 502);
  }

  let parsedQuiz;

  try {
    parsedQuiz = JSON.parse(rawText);
  } catch {
    throw new GeminiQuizError("Gemini returned invalid quiz JSON.", 502);
  }

  return normalizeGeminiQuizResponse(parsedQuiz, labEntries);
}

export function normalizeGeminiQuizResponse(payload, labEntries) {
  const items = payload?.items;

  if (!Array.isArray(items)) {
    throw new GeminiQuizError("Gemini quiz JSON is missing an items array.", 502);
  }

  if (items.length !== labEntries.length) {
    throw new GeminiQuizError("Gemini returned a different number of quiz items than lab entries.", 502);
  }

  return items.map((item, index) => {
    const question = typeof item?.question === "string" ? item.question.trim() : "";
    const correctAnswer = typeof item?.correctAnswer === "string" ? item.correctAnswer.trim().toUpperCase() : "";
    const entry = labEntries[index];
    const options = [item?.a, item?.b, item?.c, item?.d].map((option) =>
      typeof option === "string" ? option.trim() : "",
    );

    if (!question) {
      throw new GeminiQuizError(`Gemini quiz item ${index + 1} is missing a question.`, 502);
    }

    if (options.some((option) => option.length === 0)) {
      throw new GeminiQuizError(`Gemini quiz item ${index + 1} must include four answer choices.`, 502);
    }

    if (!(correctAnswer in CORRECT_ANSWER_INDEX)) {
      throw new GeminiQuizError(`Gemini quiz item ${index + 1} has an invalid correct answer.`, 502);
    }

    return {
      id: `gemini-${entry.time}-${index + 1}`,
      time: entry.time,
      label: `Checkpoint Quiz ${index + 1}`,
      question,
      options,
      correctIndex: CORRECT_ANSWER_INDEX[correctAnswer],
      status: index === 0 ? "active" : "upcoming",
    };
  });
}

function buildGeminiPrompt({ labEntries, title, courseId }) {
  const lessonLabel = title?.trim() || courseId?.trim() || "this lesson";
  const serializedEntries = labEntries
    .map(
      (entry, index) =>
        `${index + 1}. timestamp: ${entry.timestamp}\ncontent: ${entry.text}`,
    )
    .join("\n\n");

  return [
    `You are turning timestamped lab notes for ${lessonLabel} into quiz checkpoints.`,
    `Create exactly ${labEntries.length} quiz items.`,
    "Use the same order as the provided lab entries.",
    "Create exactly one quiz item for each lab entry.",
    "Keep each timestamp exactly as provided in the input.",
    "Each item must include a clear multiple-choice question, four distinct answer choices labeled A/B/C/D, and one correct answer letter.",
    "Make the wrong answers plausible but clearly incorrect based on the lab entry content.",
    "Do not invent extra timestamps, merge entries, skip entries, or return markdown.",
    "",
    "Timestamped lab entries:",
    serializedEntries,
  ].join("\n");
}

function buildGeminiQuizSchema(itemCount) {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: itemCount,
        maxItems: itemCount,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            timestamp: {
              type: "string",
              description: "The original timestamp from the lab entry.",
            },
            question: {
              type: "string",
            },
            a: {
              type: "string",
            },
            b: {
              type: "string",
            },
            c: {
              type: "string",
            },
            d: {
              type: "string",
            },
            correctAnswer: {
              type: "string",
              enum: ["A", "B", "C", "D"],
            },
          },
          required: ["timestamp", "question", "a", "b", "c", "d", "correctAnswer"],
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  };
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload?.error?.message || payload?.error || "Gemini quiz generation failed.";
  } catch {
    return "Gemini quiz generation failed.";
  }
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

function resolveGeminiModels(primaryModel, fallbackModels) {
  const normalizedPrimaryModel =
    typeof primaryModel === "string" && primaryModel.trim().length > 0
      ? primaryModel.trim()
      : DEFAULT_GEMINI_MODEL;

  return [...new Set([
    normalizedPrimaryModel,
    ...fallbackModels,
    normalizedPrimaryModel !== DEFAULT_GEMINI_MODEL ? DEFAULT_GEMINI_MODEL : null,
  ])].filter(Boolean);
}

function shouldFallbackToNextModel(statusCode, message) {
  if (RETRYABLE_GEMINI_STATUS_CODES.has(Number(statusCode))) {
    return true;
  }

  if (typeof message !== "string") {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  return [
    "high demand",
    "service unavailable",
    "try again later",
    "temporarily unavailable",
    "overloaded",
  ].some((fragment) => normalizedMessage.includes(fragment));
}
