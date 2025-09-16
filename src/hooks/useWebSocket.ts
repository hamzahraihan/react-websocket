import { Client, type StompSubscription, type IMessage } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/ChatMessage";
import SockJS from "sockjs-client";

interface UseWebSocketProps {
  url: string;
  topics: string[];
  onMessage: (msg: ChatMessage) => void;
  autoConnect?: boolean;
}

export const useWebSocket = ({
  url,
  topics,
  onMessage,
  autoConnect = true,
}: UseWebSocketProps) => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const subsRef = useRef<Map<string, StompSubscription | null>>(new Map());

  const connect = useCallback(
    (onConnectCallback?: () => void) => {
      if (clientRef.current) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(url),
        reconnectDelay: 5000,
        onConnect: () => {
          setConnected(true);

          // subscribe to broadcast topic
          topics.forEach((topic) => {
            const sub = client.subscribe(topic, (message: IMessage) => {
              try {
                const payload = JSON.parse(message.body) as ChatMessage;
                onMessage(payload);
              } catch (error) {
                console.error(`failed parse message from ${topic}`, error);
              }
            });
            subsRef.current.set(topic, sub);
          });
          onConnectCallback?.();
          console.log("WebSocket Connected");
        },
        onDisconnect: () => {
          setConnected(false);
          console.log("disconnected");
        },
        onStompError: (error) => {
          console.log(error.headers["message"] || "unknown error");
        },
        onWebSocketError: (event) => {
          console.error("WebSocket error:", event);
        },
      });

      client.activate();
      clientRef.current = client;
    },
    [url, topics, onMessage],
  );

  const disconnect = useCallback(() => {
    if (!clientRef.current) return;
    subsRef.current.forEach((sub) => sub?.unsubscribe());
    subsRef.current.clear();
    clientRef.current.deactivate();
    clientRef.current = null;
    setConnected(false);
  }, []);

  const sendMessage = useCallback((chatMessage: ChatMessage) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("not connected");
      return;
    }

    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(chatMessage),
    });
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return { connect, disconnect, sendMessage, connected };
};
