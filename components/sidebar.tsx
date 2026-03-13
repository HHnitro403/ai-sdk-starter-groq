"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, History, Bot, ChevronRight } from "lucide-react";
import { ChatHistory } from "./chat-history";

interface SidebarProps {
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ currentChatId, onSelectChat, onNewChat }: SidebarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const recent = useLiveQuery(
    () => db.chats.orderBy("updatedAt").reverse().limit(10).toArray(),
    [],
  );
  const totalCount = useLiveQuery(() => db.chats.count(), []);

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground h-dvh">
        {/* New Chat */}
        <div className="p-3 shrink-0">
          <button
            onClick={onNewChat}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Recent chats */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {recent && recent.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Recent
              </p>
              <ul className="space-y-0.5">
                {recent.map((chat) => (
                  <li
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors",
                      chat.id === currentChatId
                        ? "bg-sidebar-accent"
                        : "hover:bg-sidebar-accent/50",
                    )}
                  >
                    <MessageSquare
                      size={13}
                      className="shrink-0 opacity-40"
                    />
                    <span className="flex-1 truncate text-xs">
                      {chat.title}
                    </span>
                    <span
                      className="hidden group-hover:inline text-[9px] font-mono text-sidebar-foreground/30 shrink-0 truncate max-w-[60px]"
                      title={chat.model}
                    >
                      {chat.model.split("-").slice(0, 2).join("-")}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {recent?.length === 0 && (
            <p className="text-xs text-sidebar-foreground/40 text-center mt-10 px-3">
              No chats yet. Start a conversation!
            </p>
          )}
        </div>

        {/* Bottom nav */}
        <div className="px-2 pb-3 space-y-0.5 shrink-0 border-t border-border pt-2">
          {/* Chat History */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm hover:bg-sidebar-accent transition-colors"
          >
            <History size={15} className="shrink-0 opacity-60" />
            <span className="flex-1 text-left text-xs">Chat History</span>
            {!!totalCount && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-accent text-sidebar-foreground/60 font-medium">
                {totalCount}
              </span>
            )}
            <ChevronRight size={13} className="opacity-30" />
          </button>

          {/* Agents — placeholder */}
          <button
            disabled
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm opacity-40 cursor-not-allowed"
            title="Coming soon"
          >
            <Bot size={15} className="shrink-0" />
            <span className="flex-1 text-left text-xs">Agents</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-current opacity-60">
              soon
            </span>
          </button>
        </div>
      </aside>

      <ChatHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentChatId={currentChatId}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
      />
    </>
  );
}
