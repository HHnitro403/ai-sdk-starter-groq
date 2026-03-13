"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import Chat from "./chat";
import { db } from "@/lib/db";
import type { modelID } from "@/ai/providers";
import type { UIMessage } from "ai";

interface ChatSession {
  id: string;
  initialMessages?: UIMessage[];
  initialModel?: modelID;
}

export function AppShell() {
  const [session, setSession] = useState<ChatSession>(() => ({
    id: crypto.randomUUID(),
  }));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewChat = () => {
    setSession({ id: crypto.randomUUID() });
  };

  const handleSelectChat = async (id: string) => {
    const chat = await db.chats.get(id);
    setSession({
      id,
      initialMessages: chat?.messages as UIMessage[],
      initialModel: chat?.model,
    });
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      {sidebarOpen && (
        <Sidebar
          currentChatId={session.id}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      )}
      <Chat
        key={session.id}
        chatId={session.id}
        initialMessages={session.initialMessages}
        initialModel={session.initialModel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
      />
    </div>
  );
}
