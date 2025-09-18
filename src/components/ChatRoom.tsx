import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ChatMessage } from '../types/ChatMessage';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

export const ChatRoom = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleOnMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  }, []);

  const { sendMessage, connected, disconnect } = useWebSocket({
    url: 'http://localhost:8080/ws',
    topic: '/topic/public',
    onMessage: handleOnMessage,
  });

  const handleSend = (text: string) => {
    sendMessage('/app/chat.send', {
      sender: 'Joe',
      content: text,
      timestamp: Date.now(),
      messageType: 'CHAT',
    });
  };

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return (
    <div>
      <h2>Chat Message</h2>
      <p>{connected ? 'connected' : 'disconnected'}</p>

      <MessageList messages={chatMessages} />
      <MessageInput onSend={handleSend} />
    </div>
  );
};
