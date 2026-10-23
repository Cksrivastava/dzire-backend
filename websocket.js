import { WebSocketServer, WebSocket } from "ws";

let wss = null;

export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    try {
      ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
    } catch (e) {}

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch (e) {}
    });

    ws.on("error", () => {});
  });

  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (e) {}
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("⚡ WebSocket Server initialized on /ws");
  return wss;
};

export const broadcastEvent = (eventType, payload = {}) => {
  if (!wss || !wss.clients) return;
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (e) {}
    }
  });
};
