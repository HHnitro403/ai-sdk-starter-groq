import { getLanguageModel, isReasoningModel, modelID } from "@/ai/providers";
import { weatherTool, webSearchTool } from "@/ai/tools";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
  }: { messages: UIMessage[]; selectedModel: modelID } = await req.json();

  const supportsTools = !isReasoningModel(selectedModel);
  const tools = supportsTools
    ? {
        getWeather: weatherTool,
        ...(process.env.TAVILY_API_KEY ? { webSearch: webSearchTool } : {}),
      }
    : undefined;

  const result = streamText({
    model: getLanguageModel(selectedModel),
    system: `You are a helpful and accurate assistant.

When answering questions about current events, recent news, real-time data (prices, scores, weather), specific facts about people or places, or anything you are not fully certain about — always use the webSearch tool before responding. Do not guess or fabricate information.

When you use web search:
- Prefer the synthesised "answer" field for a reliable summary.
- Cross-reference the top results to confirm facts.
- Always cite your sources by including the relevant URLs in your response.
- If results are conflicting or unclear, say so rather than picking one at random.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // enable multi-step agentic flow
    tools,
    experimental_telemetry: {
      isEnabled: false,
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
      }
      console.error(error);
      return "An error occurred.";
    },
  });
}
