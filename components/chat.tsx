"use client";

import { defaultModel, modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "./textarea";
import { ProjectOverview } from "./project-overview";
import { Messages } from "./messages";
import { Header } from "./header";
import { toast } from "sonner";
import { db } from "@/lib/db";

interface ChatProps {
  chatId: string;
  initialMessages?: unknown[];
  initialModel?: modelID;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Chat({
  chatId,
  initialMessages,
  initialModel,
  sidebarOpen,
  onToggleSidebar,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<modelID>(
    initialModel ?? defaultModel
  );
  const createdAt = useRef<number>(Date.now());
  const hasNewActivity = useRef(false);

  const { sendMessage, messages, status, stop } = useChat({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialMessages: initialMessages as any,
    onError: (error) => {
      toast.error(
        error.message.length > 0
          ? error.message
          : "An error occured, please try again later.",
        { position: "top-center", richColors: true }
      );
    },
  });

  // Track when a new exchange starts
  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      hasNewActivity.current = true;
    }

    // Save to IndexedDB once streaming completes
    if (status === "ready" && hasNewActivity.current && messages.length > 0) {
      hasNewActivity.current = false;

      const firstUserMsg = messages.find((m) => m.role === "user");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const title = (firstUserMsg?.parts as any[])?.find(
        (p) => p.type === "text"
      )?.text?.slice(0, 60) ?? "New Chat";

      db.chats.put({
        id: chatId,
        title,
        createdAt: createdAt.current,
        updatedAt: Date.now(),
        model: selectedModel,
        messages,
      });
    }
  }, [status, messages, chatId, selectedModel]);

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex-1 h-dvh flex flex-col justify-center w-full min-w-0">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />
      {messages.length === 0 ? (
        <div className="max-w-xl mx-auto w-full">
          <ProjectOverview />
        </div>
      ) : (
        <Messages messages={messages} isLoading={isLoading} status={status} />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input }, { body: { selectedModel } });
          setInput("");
        }}
        className="pb-8 bg-white dark:bg-black w-full max-w-xl mx-auto px-4 sm:px-0"
      >
        <Textarea
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleInputChange={(e) => setInput(e.currentTarget.value)}
          input={input}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </form>
    </div>
  );
}
