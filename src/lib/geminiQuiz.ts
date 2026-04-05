type GenerateQuizResponse = {
  overview: string;
  quizText: string;
};

type GenerateQuizError = {
  error?: string;
};

export const generateQuizFromOverview = async () => {
  const response = await fetch("/api/gemini/quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as GenerateQuizError | null;
    const errorMessage = data?.error ?? `Gemini request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return response.json() as Promise<GenerateQuizResponse>;
};
