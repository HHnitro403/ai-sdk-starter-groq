import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const webSearchTool = tool({
  description:
    "Search the web for up-to-date information. Use this for current events, recent facts, real-time data, prices, people, places, or anything you are not fully certain about.",
  inputSchema: z.object({
    query: z.string().describe("A precise search query"),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not configured");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 8,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      // Tavily's own AI-synthesised answer — highly reliable summary
      answer: (data.answer as string | null) ?? null,
      results: (data.results ?? []).map(
        (r: { title: string; url: string; content: string; score: number }) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          relevanceScore: r.score,
        }),
      ),
    };
  },
});
