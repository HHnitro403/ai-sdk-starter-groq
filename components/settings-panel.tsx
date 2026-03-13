"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { X, Sun, Moon, Monitor, Download, Upload } from "lucide-react";
import { db, type StoredChat } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import type { CategorizedModels } from "@/lib/models";

// Only chat-relevant categories for the default model picker
const CHAT_CATEGORIES: { key: keyof CategorizedModels; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "vision", label: "Vision" },
];

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  const { settings, update } = useSettings();
  const importRef = useRef<HTMLInputElement>(null);
  const chats = useLiveQuery(() => db.chats.toArray());
  const [categories, setCategories] = useState<CategorizedModels | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const exportAll = () => {
    if (!chats?.length) return;
    const blob = new Blob([JSON.stringify(chats, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-chats.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChats = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: StoredChat[] = Array.isArray(data) ? data : [data];
      const valid = items.every(
        (c) =>
          typeof c.id === "string" &&
          typeof c.title === "string" &&
          Array.isArray(c.messages)
      );
      if (!valid) throw new Error("Invalid format");
      await db.chats.bulkPut(items);
      toast.success(
        `Imported ${items.length} chat${items.length !== 1 ? "s" : ""}`,
        { position: "top-center" }
      );
    } catch {
      toast.error("Failed to import: invalid or corrupted file", {
        position: "top-center",
      });
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-border z-30 flex flex-col shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-sm">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Appearance */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-colors ${
                    theme === value
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                      : "border-border hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Default Model */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Default Model
            </h3>
            <select
              value={settings.defaultModel}
              onChange={(e) => update({ defaultModel: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-md border border-border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {categories
                ? CHAT_CATEGORIES.filter(
                    (c) => categories[c.key].length > 0,
                  ).map(({ key, label }) => (
                    <optgroup key={key} label={label}>
                      {categories[key].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : (
                    <option value={settings.defaultModel}>
                      {settings.defaultModel}
                    </option>
                  )}
            </select>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
              Applied when starting new chats.
            </p>
          </section>

          {/* Data */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Data
            </h3>
            <div className="space-y-2">
              <button
                onClick={exportAll}
                disabled={!chats?.length}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                Export all chats
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={importChats}
              />
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Upload size={14} />
                Import chats
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
