import { Client, type StompSubscription, type IMessage } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types/ChatMessage';

import SockJS from 'sockjs-client';

interface UseWebSocketProps {
  url: string;
  topic: string;
  onMessage: (msg: ChatMessage) => void;
}

export const useWebSocket = ({ url, topic, onMessage }: UseWebSocketProps) => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const subsRef = useRef<StompSubscription | null>(null);

  // Send message function remains the same
  const sendMessage = useCallback((destination: string, chatMessage: ChatMessage) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn('not connected');
      return;
    }
    clientRef.current.publish({
      destination: destination,
      body: JSON.stringify(chatMessage),
    });
  }, []);

  // Effect to manage connection lifecycle
  useEffect(() => {
    // Disconnect any existing connection first
    if (clientRef.current) {
      subsRef.current?.unsubscribe();
      subsRef.current = null;
      clientRef.current.deactivate();
      clientRef.current = null;
      setConnected(false);
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        subsRef.current = client.subscribe(topic, (message: IMessage) => {
          const payload: ChatMessage = JSON.parse(message.body);
          onMessage(payload);
        });
        console.log('WebSocket Connected');
      },
      onDisconnect: () => {
        setConnected(false);
        clientRef.current = null;
        subsRef.current = null;
        console.log('disconnected');
      },
      onStompError: (error) => {
        console.log(error.headers['message'] || 'unknown error');
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setConnected(false);
        clientRef.current = null;
        subsRef.current = null;
      },
    });

    client.activate();
    clientRef.current = client;

    // Cleanup on unmount or url/topic change
    return () => {
      subsRef.current?.unsubscribe();
      subsRef.current = null;
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setConnected(false);
    };
  }, [url, topic, onMessage]);

  // Manual disconnect (optional, for UI button etc)
  const disconnect = useCallback(() => {
    subsRef.current?.unsubscribe();
    subsRef.current = null;
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnected(false);
  }, []);

  return { disconnect, sendMessage, connected };
};
