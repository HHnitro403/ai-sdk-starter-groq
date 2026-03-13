import Dexie, { type Table } from "dexie";
import type { modelID } from "@/ai/providers";
import type { UIMessage } from "ai";

export interface StoredChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: modelID;
  messages: UIMessage[];
}

class ChatDatabase extends Dexie {
  chats!: Table<StoredChat>;

  constructor() {
    super("groq-chatbot-db");
    this.version(1).stores({
      chats: "id, createdAt, updatedAt",
    });
  }
}

export const db = new ChatDatabase();
