"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type StoredChat } from "@/lib/db";
import { X, Trash2, Pencil, Bot } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  open: boolean;
  onClose: () => void;
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function modelLabel(model: string): string {
  // shorten long model ids: "llama-3.3-70b-versatile" → "llama-3.3-70b"
  const parts = model.split("-");
  return parts.slice(0, 3).join("-");
}

function RenameInput({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initial) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-sm"
    />
  );
}

export function ChatHistory({
  open,
  onClose,
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatHistoryProps) {
  const chats = useLiveQuery(
    () => db.chats.orderBy("updatedAt").reverse().toArray(),
    [],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Reset selection when panel closes
  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setRenamingId(null);
    }
  }, [open]);

  if (!open) return null;

  const allIds = chats?.map((c) => c.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const deleteOne = async (chat: StoredChat, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.chats.delete(chat.id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(chat.id);
      return next;
    });
    if (chat.id === currentChatId) onNewChat();
  };

  const deleteSelected = () => {
    const ids = Array.from(selected);
    toast(`Delete ${ids.length} chat${ids.length !== 1 ? "s" : ""}?`, {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          await db.chats.bulkDelete(ids);
          const deletedCurrent = ids.includes(currentChatId);
          setSelected(new Set());
          if (deletedCurrent) onNewChat();
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const rename = async (id: string, newTitle: string) => {
    await db.chats.update(id, { title: newTitle });
    setRenamingId(null);
  };

  const handleSelect = (chat: StoredChat) => {
    if (renamingId) return;
    onSelectChat(chat.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 className="font-semibold text-base">Chat History</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0 min-h-[52px]">
        {chats && chats.length > 0 && (
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              Select all
            </label>
            {selected.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 size={14} />
                Delete {selected.size} selected
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
              {chats.length} chat{chats.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {!chats || chats.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center mt-16">
            No chat history yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => handleSelect(chat)}
                className={cn(
                  "group flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-colors",
                  chat.id === currentChatId
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(chat.id)}
                  onChange={() => {}}
                  onClick={(e) => toggleSelect(chat.id, e)}
                  className="w-4 h-4 shrink-0 rounded accent-primary cursor-pointer"
                />

                {/* Title + meta */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  {renamingId === chat.id ? (
                    <RenameInput
                      initial={chat.title}
                      onSave={(v) => rename(chat.id, v)}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">
                      {chat.title}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
                      <Bot size={9} />
                      {modelLabel(chat.model)}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {relativeTime(chat.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(chat.id);
                    }}
                    title="Rename"
                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => deleteOne(chat, e)}
                    title="Delete"
                    className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
