// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  GeminiQuizError,
  extractTimestampedLabEntries,
  generateGeminiQuiz,
  normalizeGeminiQuizResponse,
  parseTimestampToSeconds,
} from "./geminiQuiz.mjs";

describe("parseTimestampToSeconds", () => {
  it("parses MM:SS timestamps", () => {
    expect(parseTimestampToSeconds("03:45")).toBe(225);
  });

  it("parses HH:MM:SS timestamps", () => {
    expect(parseTimestampToSeconds("1:02:03")).toBe(3723);
  });
});

describe("extractTimestampedLabEntries", () => {
  it("extracts timestamped lab entries in order", () => {
    const labData = `
      00:15 Introduction to buffers
      02:30 A control group shows no reaction
      1:05:10 Final interpretation and results
    `;

    expect(extractTimestampedLabEntries(labData)).toEqual([
      {
        id: "lab-entry-1",
        index: 0,
        timestamp: "00:15",
        time: 15,
        text: "Introduction to buffers",
      },
      {
        id: "lab-entry-2",
        index: 1,
        timestamp: "02:30",
        time: 150,
        text: "A control group shows no reaction",
      },
      {
        id: "lab-entry-3",
        index: 2,
        timestamp: "1:05:10",
        time: 3910,
        text: "Final interpretation and results",
      },
    ]);
  });

  it("returns an empty array when no valid timestamped entries exist", () => {
    expect(extractTimestampedLabEntries("No timestamps here.")).toEqual([]);
  });
});

describe("normalizeGeminiQuizResponse", () => {
  const labEntries = extractTimestampedLabEntries(`
    00:12 Mitosis begins with chromosome condensation
    01:24 Metaphase lines chromosomes at the center
  `);

  it("maps Gemini quiz JSON to checkpoints", () => {
    const checkpoints = normalizeGeminiQuizResponse(
      {
        items: [
          {
            timestamp: "00:12",
            question: "What happens first in mitosis?",
            a: "Chromosomes condense",
            b: "DNA stops existing",
            c: "Cells merge into one",
            d: "The membrane disappears forever",
            correctAnswer: "A",
          },
          {
            timestamp: "01:24",
            question: "What is emphasized during metaphase?",
            a: "Proteins leave the cell",
            b: "Chromosomes line up in the middle",
            c: "The nucleus doubles in size only",
            d: "The cell permanently stops dividing",
            correctAnswer: "B",
          },
        ],
      },
      labEntries,
    );

    expect(checkpoints).toEqual([
      {
        id: "gemini-12-1",
        time: 12,
        label: "Checkpoint Quiz 1",
        question: "What happens first in mitosis?",
        options: [
          "Chromosomes condense",
          "DNA stops existing",
          "Cells merge into one",
          "The membrane disappears forever",
        ],
        correctIndex: 0,
        status: "active",
      },
      {
        id: "gemini-84-2",
        time: 84,
        label: "Checkpoint Quiz 2",
        question: "What is emphasized during metaphase?",
        options: [
          "Proteins leave the cell",
          "Chromosomes line up in the middle",
          "The nucleus doubles in size only",
          "The cell permanently stops dividing",
        ],
        correctIndex: 1,
        status: "upcoming",
      },
    ]);
  });

  it("throws on item count mismatch", () => {
    expect(() =>
      normalizeGeminiQuizResponse(
        {
          items: [
            {
              timestamp: "00:12",
              question: "Only one question",
              a: "A",
              b: "B",
              c: "C",
              d: "D",
              correctAnswer: "A",
            },
          ],
        },
        labEntries,
      ),
    ).toThrowError(GeminiQuizError);
  });
});

describe("generateGeminiQuiz", () => {
  it("falls back to the next Gemini model on retryable overload errors", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: "This model is currently experiencing high demand. Please try again later.",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [
                        {
                          timestamp: "00:12",
                          question: "What is described in the notes?",
                          a: "The procedure",
                          b: "An unrelated topic",
                          c: "No content at all",
                          d: "A weather report",
                          correctAnswer: "A",
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });

    const checkpoints = await generateGeminiQuiz(
      {
        labEntries: extractTimestampedLabEntries("00:12 Notes about the procedure"),
        model: "gemini-3-flash-preview",
        fallbackModels: ["gemini-2.5-flash"],
        apiKey: "test-key",
      },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toContain("/models/gemini-3-flash-preview:generateContent");
    expect(fetchImpl.mock.calls[1][0]).toContain("/models/gemini-2.5-flash:generateContent");
    expect(checkpoints).toHaveLength(1);
    expect(checkpoints[0]?.question).toBe("What is described in the notes?");
  });

  it("throws a safe error when Gemini returns invalid JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "{not-json" }],
            },
          },
        ],
      }),
    });

    await expect(
      generateGeminiQuiz(
        {
          labEntries: extractTimestampedLabEntries("00:12 Notes about the procedure"),
          apiKey: "test-key",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("Gemini returned invalid quiz JSON.");
  });

  it("does not fall back on non-retryable Gemini errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: "Bad request",
        },
      }),
    });

    await expect(
      generateGeminiQuiz(
        {
          labEntries: extractTimestampedLabEntries("00:12 Notes about the procedure"),
          model: "gemini-3-flash-preview",
          fallbackModels: ["gemini-2.5-flash"],
          apiKey: "test-key",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("Bad request");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws a safe error when the request fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));

    await expect(
      generateGeminiQuiz(
        {
          labEntries: extractTimestampedLabEntries("00:12 Notes about the procedure"),
          apiKey: "test-key",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("Gemini quiz generation request failed.");
  });
});
