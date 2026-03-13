import Dexie, { type Table } from "dexie";
import type { modelID } from "@/ai/providers";

export interface StoredChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: modelID;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
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
