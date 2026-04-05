const TWELVE_LABS_OVERVIEW_STREAM = `{"event_type":"stream_start","metadata":{"generation_id":"bbfd58f9-b138-4e99-aae4-a9fe899828d3"}}
{"event_type":"text_generation","text":"AVL trees are self"}
{"event_type":"text_generation","text":"-balancing binary search trees"}
{"event_type":"text_generation","text":" named after their inventors"}
{"event_type":"text_generation","text":", Adelson-Vels"}
{"event_type":"text_generation","text":"ky and Landis."}
{"event_type":"text_generation","text":" This concept is introduced at"}
{"event_type":"text_generation","text":" 0:00"}
{"event_type":"text_generation","text":"–0:20"}
{"event_type":"text_generation","text":", where it is noted"}
{"event_type":"text_generation","text":" that, like red-black"}
{"event_type":"text_generation","text":" trees, AVL trees maintain"}
{"event_type":"text_generation","text":" balance during insertions"}
{"event_type":"text_generation","text":" and deletions to ensure"}
{"event_type":"text_generation","text":" efficient operations. The key"}
{"event_type":"text_generation","text":" property of AVL trees is"}
{"event_type":"text_generation","text":" that for any node,"}
{"event_type":"text_generation","text":" the heights of its left"}
{"event_type":"text_generation","text":" and right subtrees differ"}
{"event_type":"text_generation","text":" by at most one—"}
{"event_type":"text_generation","text":"this is known as the"}
{"event_type":"text_generation","text":" balance factor, defined as"}
{"event_type":"text_generation","text":" left subtree height minus right"}
{"event_type":"text_generation","text":" subtree height, which must"}
{"event_type":"text_generation","text":" be in the range [-"}
{"event_type":"text_generation","text":"1, 0,"}
{"event_type":"text_generation","text":" 1], as explained"}
{"event_type":"text_generation","text":" between 0:5"}
{"event_type":"text_generation","text":"2 and 1:"}
{"event_type":"text_generation","text":"21.\\n\\nThe height"}
{"event_type":"text_generation","text":" of a tree is defined"}
{"event_type":"text_generation","text":" as the number of nodes"}
{"event_type":"text_generation","text":" on the longest path from"}
{"event_type":"text_generation","text":" the root to a leaf"}
{"event_type":"text_generation","text":", with an empty tree"}
{"event_type":"text_generation","text":" having a height of "}
{"event_type":"text_generation","text":"0 (1:0"}
{"event_type":"text_generation","text":"2–1:1"}
{"event_type":"text_generation","text":"3). An example AVL"}
{"event_type":"text_generation","text":" tree is visualized at"}
{"event_type":"text_generation","text":" 1:33"}
{"event_type":"text_generation","text":"–1:43"}
{"event_type":"text_generation","text":", with node heights shown"}
{"event_type":"text_generation","text":" in green and balance factors"}
{"event_type":"text_generation","text":" in blue. The root"}
{"event_type":"text_generation","text":" node (50)"}
{"event_type":"text_generation","text":" is highlighted at 2"}
{"event_type":"text_generation","text":":07–2"}
{"event_type":"text_generation","text":":16, with"}
{"event_type":"text_generation","text":" its balance factor calculated as"}
{"event_type":"text_generation","text":" -1 (3 -"}
{"event_type":"text_generation","text":" 4), illustrating how"}
{"event_type":"text_generation","text":" balance factors are derived"}
{"event_type":"text_generation","text":" (1:47"}
{"event_type":"text_generation","text":"–2:15"}
{"event_type":"text_generation","text":").\\n\\nA non-AVL"}
{"event_type":"text_generation","text":" tree is shown at "}
{"event_type":"text_generation","text":"2:29–"}
{"event_type":"text_generation","text":"2:39 to"}
{"event_type":"text_generation","text":" demonstrate a violation of the"}
{"event_type":"text_generation","text":" balance condition. The video"}
{"event_type":"text_generation","text":" then compares AVL trees to"}
{"event_type":"text_generation","text":" red-black trees from "}
{"event_type":"text_generation","text":"2:39–"}
{"event_type":"text_generation","text":"3:12,"}
{"event_type":"text_generation","text":" noting that both have O"}
{"event_type":"text_generation","text":"(log n) worst-case"}
{"event_type":"text_generation","text":" time complexity for search,"}
{"event_type":"text_generation","text":" insert, and delete."}
{"event_type":"text_generation","text":" However, AVL trees are"}
{"event_type":"text_generation","text":" more strictly balanced—bounded"}
{"event_type":"text_generation","text":" by 1.4"}
{"event_type":"text_generation","text":"4 log₂(n)"}
{"event_type":"text_generation","text":" compared to red-black trees"}
{"event_type":"text_generation","text":"’ 2 log₂"}
{"event_type":"text_generation","text":"(n)—making them more"}
{"event_type":"text_generation","text":" efficient for lookup-intensive applications"}
{"event_type":"text_generation","text":" (3:12"}
{"event_type":"text_generation","text":"–3:31"}
{"event_type":"text_generation","text":"). A paper by Ben"}
{"event_type":"text_generation","text":" Pfaff is cited,"}
{"event_type":"text_generation","text":" showing that AVL trees perform"}
{"event_type":"text_generation","text":" better when insertions are"}
{"event_type":"text_generation","text":" in sorted order and later"}
{"event_type":"text_generation","text":" accesses are random (3"}
{"event_type":"text_generation","text":":33–4"}
{"event_type":"text_generation","text":":04).\\n\\nCode"}
{"event_type":"text_generation","text":" implementation begins at 4"}
{"event_type":"text_generation","text":":04, with"}
{"event_type":"text_generation","text":" a Node class in Python"}
{"event_type":"text_generation","text":" storing key, left and"}
{"event_type":"text_generation","text":" right children, and height"}
{"event_type":"text_generation","text":" (set to 1"}
{"event_type":"text_generation","text":" upon creation). The AVL"}
{"event_type":"text_generation","text":"Tree class inherits from this"}
{"event_type":"text_generation","text":" node structure (4:"}
{"event_type":"text_generation","text":"14–4"}
{"event_type":"text_generation","text":":25). The"}
{"event_type":"text_generation","text":" search function is implemented recursively"}
{"event_type":"text_generation","text":" and operates in O(log"}
{"event_type":"text_generation","text":" n) time, consistent"}
{"event_type":"text_generation","text":" with the tree’s height"}
{"event_type":"text_generation","text":" bound (4:2"}
{"event_type":"text_generation","text":"5–4:4"}
{"event_type":"text_generation","text":"5). The video concludes"}
{"event_type":"text_generation","text":" at 4:4"}
{"event_type":"text_generation","text":"8 with"}
{"event_type":"text_generation","text":" a summary of the key"}
{"event_type":"text_generation","text":" points covered, setting the"}
{"event_type":"text_generation","text":" stage for a follow-up"}
{"event_type":"text_generation","text":" on insertions."}
{"event_type":"stream_end","metadata":{"generation_id":"bbfd58f9-b138-4e99-aae4-a9fe899828d3","usage":{"output_tokens":543}},"finish_reason":"stop"}`;

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

const GEMINI_MODEL = "gemini-2.5-flash";

const parseTimestampToSeconds = (timestamp: string) => {
  const [minutes, seconds] = timestamp.split(":").map(Number);
  return minutes * 60 + seconds;
};

const normalizeOverviewText = (overview: string) => {
  const withSecondRanges = overview.replace(/(\d+:\d{2})\s*[–-]\s*(\d+:\d{2})/g, (_, start, end) => {
    return `${parseTimestampToSeconds(start)}-${parseTimestampToSeconds(end)} seconds`;
  });

  return withSecondRanges.replace(/(?<![\d-])(\d+:\d{2})(?![\d-])/g, (_, timestamp) => {
    return `${parseTimestampToSeconds(timestamp)} seconds`;
  });
};

export const getTwelveLabsOverviewFromStream = () => {
  const text = TWELVE_LABS_OVERVIEW_STREAM
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { event_type?: string; text?: string })
    .filter((event) => event.event_type === "text_generation" && typeof event.text === "string")
    .map((event) => event.text)
    .join("");

  return normalizeOverviewText(text);
};

const buildQuizPrompt = (overview: string) => `You are creating study questions for a lecture app.

Use the lecture overview below to create a compact quiz response for the frontend prototype.

Return valid JSON only with this exact shape:
{
  "title": string,
  "summary": string,
  "questions": [
    {
      "type": "multiple_choice",
      "question": string,
      "choices": [string, string, string, string],
      "answer": string,
      "timeIntervalSeconds": [number, number]
    }
  ]
}

Requirements:
- Create exactly 4 multiple choice questions.
- Base each question on important concepts from the overview.
- Keep choices concise and plausible.
- The answer must exactly match one choice.
- Each timeIntervalSeconds entry must come from the overview's time intervals.
- Prefer concept coverage over implementation trivia.

Lecture overview:
${overview}`;

export const generateQuizFromOverview = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in your .env file.");
  }

  const overview = getTwelveLabsOverviewFromStream();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    overview,
    quizText: text,
  };
};
