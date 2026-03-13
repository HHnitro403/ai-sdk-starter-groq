"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type StoredChat } from "@/lib/db";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Download, Trash2 } from "lucide-react";
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

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast("Delete this chat?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          await db.chats.delete(id);
          if (id === currentChatId) onNewChat();
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
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
    </aside>
  );
}
