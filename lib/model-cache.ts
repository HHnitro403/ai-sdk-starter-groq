import { categorizeModels, type CategorizedModels } from "./models";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Module-level cache — persists across requests in the same warm server instance
let cache: { categories: CategorizedModels; at: number } | null = null;

export async function getCategorizedModels(): Promise<CategorizedModels> {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return cache.categories;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    // Next.js fetch cache layer — CDN-level reuse on cold starts
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);

  const data = await res.json();
  const ids: string[] = (data.data as { id: string; active?: boolean }[])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .sort();

  const categories = categorizeModels(ids);
  cache = { categories, at: Date.now() };
  return categories;
}
