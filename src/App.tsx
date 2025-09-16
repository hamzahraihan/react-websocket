import { Client } from "@stomp/stompjs";
import "./App.css";
import { useEffect } from "react";
// @ts-expect-error ignore sockjs global is not defined
import SockJS from "sockjs-client/dist/sockjs";

function App() {
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket Connected");
      },
      onDisconnect: () => console.log("disconnected"),
      onStompError: (error) => {
        console.log(error.headers["message"] || "unknown error");
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  return <div>hello world</div>;
}

export default App;
