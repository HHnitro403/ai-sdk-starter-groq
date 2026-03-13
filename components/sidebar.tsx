"use client";

import { useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type StoredChat } from "@/lib/db";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ currentChatId, onSelectChat, onNewChat }: SidebarProps) {
  const chats = useLiveQuery(() =>
    db.chats.orderBy("updatedAt").reverse().toArray()
  );
  const importRef = useRef<HTMLInputElement>(null);

  const exportChat = (chat: StoredChat, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(chat, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${chat.title.slice(0, 30).replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    // Reset so the same file can be re-imported if needed
    e.target.value = "";
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: StoredChat[] = Array.isArray(data) ? data : [data];
      // Basic validation
      const valid = items.every(
        (c) => typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages)
      );
      if (!valid) throw new Error("Invalid chat file format");
      await db.chats.bulkPut(items);
      toast.success(`Imported ${items.length} chat${items.length !== 1 ? "s" : ""}`, {
        position: "top-center",
      });
    } catch {
      toast.error("Failed to import: invalid or corrupted file", {
        position: "top-center",
      });
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.chats.delete(id);
    if (id === currentChatId) onNewChat();
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground h-dvh">
      <div className="p-3 border-b border-border">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {chats?.length === 0 && (
          <p className="text-xs text-sidebar-foreground/50 text-center mt-8 px-3">
            No chats yet. Start a conversation!
          </p>
        )}
        {chats?.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
              chat.id === currentChatId
                ? "bg-sidebar-accent"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <MessageSquare size={14} className="shrink-0 opacity-50" />
            <span className="flex-1 truncate text-xs">{chat.title}</span>
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => exportChat(chat, e)}
                className="p-1 rounded hover:bg-sidebar-accent"
                title="Export chat"
              >
                <Download size={12} />
              </button>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="p-1 rounded hover:bg-destructive/20 text-destructive"
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border space-y-0.5">
        {!!chats?.length && (
          <button
            onClick={exportAll}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60"
          >
            <Download size={14} />
            Export all chats
          </button>
        )}
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={importChats}
        />
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60"
        >
          <Upload size={14} />
          Import chats
        </button>
      </div>
    </aside>
  );
}
