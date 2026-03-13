import { getLanguageModel, isReasoningModel, modelID } from "@/ai/providers";
import { weatherTool, webSearchTool } from "@/ai/tools";
import { getCategorizedModels } from "@/lib/model-cache";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Minimal local types for injecting image parts into converted messages
type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string; mimeType: string };
type ContentPart = TextPart | ImagePart;
type MutableMsg = { role: string; content: string | ContentPart[] };

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
    images = [],
  }: { messages: UIMessage[]; selectedModel: modelID; images?: string[] } =
    await req.json();

  // ── Model routing ──────────────────────────────────────────────────────────
  const categories = await getCategorizedModels();
  const hasImage = images.length > 0;

  let effectiveModel = selectedModel;
  let routingReason = "user selection";

  if (hasImage && categories.vision.length > 0) {
    effectiveModel = categories.vision[0]; // first vision model alphabetically
    routingReason = `image detected → vision model`;
  }

  console.log(
    `[Router] model="${effectiveModel}" reason="${routingReason}"`,
  );
  // ──────────────────────────────────────────────────────────────────────────

  const supportsTools = !isReasoningModel(effectiveModel);
  const tools = supportsTools
    ? {
        getWeather: weatherTool,
        ...(process.env.TAVILY_API_KEY ? { webSearch: webSearchTool } : {}),
      }
    : undefined;

  // Convert UI messages and optionally inject image parts into the last user turn
  const convertedMessages = convertToModelMessages(messages) as MutableMsg[];

  if (hasImage) {
    let lastUserIdx = -1;
    for (let i = convertedMessages.length - 1; i >= 0; i--) {
      if (convertedMessages[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx >= 0) {
      const msg = convertedMessages[lastUserIdx];
      const imageParts: ImagePart[] = images.map((dataUrl) => ({
        type: "image",
        image: dataUrl,
        mimeType: dataUrl.match(/data:([^;]+);/)?.[1] ?? "image/jpeg",
      }));

      const newContent: ContentPart[] =
        typeof msg.content === "string"
          ? [{ type: "text", text: msg.content }, ...imageParts]
          : [...(msg.content as ContentPart[]), ...imageParts];

      convertedMessages[lastUserIdx] = { ...msg, content: newContent };
    }
  }

  const result = streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: getLanguageModel(effectiveModel) as any,
    system: `You are a helpful and accurate assistant.

When answering questions about current events, recent news, real-time data (prices, scores, weather), specific facts about people or places, or anything you are not fully certain about — always use the webSearch tool before responding. Do not guess or fabricate information.

When you use web search:
- Prefer the synthesised "answer" field for a reliable summary.
- Cross-reference the top results to confirm facts.
- Always cite your sources by including the relevant URLs in your response.
- If results are conflicting or unclear, say so rather than picking one at random.`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: convertedMessages as any,
    stopWhen: stepCountIs(5),
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
