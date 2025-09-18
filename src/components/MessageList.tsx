import type { ChatMessage } from "../types/ChatMessage";

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <ul>
      {messages.map((message, index) => (
        <li key={index}>
          <strong>{message.sender}</strong>: {message.content}{" "}
          <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
        </li>
      ))}
    </ul>
  );
};
