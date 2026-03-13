import { getCategorizedModels } from "@/lib/model-cache";

export async function GET() {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  try {
    const categories = await getCategorizedModels();
    return Response.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
