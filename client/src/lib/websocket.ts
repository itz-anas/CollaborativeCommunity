import { WebSocketMessage } from "@shared/schema";

export function createWebSocketConnection() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  return new WebSocket(wsUrl);
}

export function sendWebSocketMessage(
  socket: WebSocket | null,
  type: string,
  payload: any
) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const message: WebSocketMessage = {
      type: type as any,
      payload,
    };
    socket.send(JSON.stringify(message));
    return true;
  }
  return false;
}
