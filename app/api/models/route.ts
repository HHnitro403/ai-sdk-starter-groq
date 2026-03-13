import { categorizeModels } from "@/lib/models";

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch models from Groq" },
      { status: response.status },
    );
  }

  const data = await response.json();

  const allIds: string[] = (data.data as { id: string; active?: boolean }[])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .sort();

  return Response.json({ categories: categorizeModels(allIds) });
}
