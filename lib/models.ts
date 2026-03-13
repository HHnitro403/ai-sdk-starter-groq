export interface CategorizedModels {
  text: string[];
  vision: string[];
  speechToText: string[];
  textToSpeech: string[];
}

export function categorizeModels(ids: string[]): CategorizedModels {
  const l = (id: string) => id.toLowerCase();

  const isWhisper = (id: string) => l(id).includes("whisper");
  const isOrpheus = (id: string) => l(id).includes("orpheus");
  const isVision = (id: string) =>
    l(id).includes("scout") || l(id).includes("-vl") || l(id).includes("vision");
  const isGuard = (id: string) =>
    l(id).includes("guard") || l(id).includes("safeguard");

  return {
    speechToText: ids.filter(isWhisper),
    textToSpeech: ids.filter(isOrpheus),
    vision: ids.filter(
      (id) => !isWhisper(id) && !isOrpheus(id) && isVision(id),
    ),
    text: ids.filter(
      (id) =>
        !isWhisper(id) &&
        !isOrpheus(id) &&
        !isVision(id) &&
        !isGuard(id),
    ),
  };
}

/** Labels shown in the UI for each category */
export const CATEGORY_LABELS: Record<keyof CategorizedModels, string> = {
  text: "Text",
  vision: "Vision",
  speechToText: "Speech to Text",
  textToSpeech: "Text to Speech",
};
