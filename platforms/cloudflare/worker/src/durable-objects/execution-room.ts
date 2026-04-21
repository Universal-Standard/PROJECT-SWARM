import type { DurableObjectState } from "@cloudflare/workers-types";

/**
 * ExecutionRoom — WebSocket Durable Object
 *
 * Each active workflow execution gets its own room.
 * Clients connect via WebSocket to receive real-time log updates.
 * The queue consumer sends log events via HTTP fetch to the room.
 * Rooms hibernate when no clients are connected (free-tier compatible).
 */
export class ExecutionRoom {
  private state: DurableObjectState;
  private sessions: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.getWebSockets().forEach(ws => this.sessions.add(ws));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      this.state.acceptWebSocket(server);
      this.sessions.add(server);

      return new Response(null, { status: 101, webSocket: client });
    }

    // Internal POST: broadcast a log event to all connected clients
    if (request.method === "POST" && url.pathname === "/broadcast") {
      const message = await request.text();
      this.broadcast(message);
      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // Echo back pings
    if (message === "ping") ws.send("pong");
  }

  webSocketClose(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  webSocketError(ws: WebSocket): void {
    this.sessions.delete(ws);
    try { ws.close(); } catch { /* ignore close errors */ }
  }

  private broadcast(message: string): void {
    const dead: WebSocket[] = [];
    for (const ws of this.sessions) {
      try {
        ws.send(message);
      } catch {
        dead.push(ws);
      }
    }
    dead.forEach(ws => this.sessions.delete(ws));
  }
}
