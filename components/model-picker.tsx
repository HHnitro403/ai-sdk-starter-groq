"use client";

import { modelID } from "@/ai/providers";
import { useEffect, useState } from "react";
import type { CategorizedModels } from "@/lib/models";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ModelPickerProps {
  selectedModel: modelID;
  setSelectedModel: (model: modelID) => void;
}

// Only categories relevant to chat
const CHAT_CATEGORIES: { key: keyof CategorizedModels; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "vision", label: "Vision" },
];

export const ModelPicker = ({
  selectedModel,
  setSelectedModel,
}: ModelPickerProps) => {
  const [categories, setCategories] = useState<CategorizedModels | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="absolute bottom-2 left-2 flex flex-col gap-2">
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {categories
            ? CHAT_CATEGORIES.filter((c) => categories[c.key].length > 0).map(
                ({ key, label }) => (
                  <SelectGroup key={key}>
                    <SelectLabel>{label}</SelectLabel>
                    {categories[key].map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ),
              )
            : // fallback: show selected model while loading
              selectedModel && (
                <SelectGroup>
                  <SelectItem value={selectedModel}>{selectedModel}</SelectItem>
                </SelectGroup>
              )}
        </SelectContent>
      </Select>
    </div>
  );
};
