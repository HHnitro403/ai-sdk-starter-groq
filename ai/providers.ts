import { groq } from "@ai-sdk/groq";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";

// Model IDs that use reasoning/chain-of-thought middleware
const REASONING_MODEL_PREFIXES = ["deepseek-r1", "deepseek-r2", "qwq"];

function isReasoningModel(modelId: string): boolean {
  return REASONING_MODEL_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

export function getLanguageModel(modelId: string) {
  if (isReasoningModel(modelId)) {
    return wrapLanguageModel({
      middleware: extractReasoningMiddleware({ tagName: "think" }),
      model: groq(modelId),
    });
  }
  return groq(modelId);
}

export type modelID = string;

export const defaultModel: modelID = "llama-3.3-70b-versatile";
