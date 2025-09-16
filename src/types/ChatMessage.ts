export type MessageType = "JOIN" | "CHAT" | "LEAVE";

export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: number;
  type: MessageType;
}
