export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch models from Groq" },
      { status: response.status },
    );
  }

  const data = await response.json();

  // Filter to only chat/language models — exclude audio, TTS, and transcription models
  const chatModels: string[] = data.data
    .filter(
      (m: { id: string; context_window?: number; active?: boolean }) =>
        m.active !== false &&
        m.context_window != null &&
        m.context_window > 0,
    )
    .map((m: { id: string }) => m.id)
    .sort();

  return Response.json({ models: chatModels });
}
