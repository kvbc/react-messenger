import { WebSocket, WebSocketServer } from "ws";
import cookie from "cookie";
import https from "node:https";

export const connections: { [accessToken: string]: WebSocket | undefined } = {};

export function init(server: https.Server) {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws, req) => {
        console.log("[WS] new connection");

        ws.onerror = console.error;

        if (req.headers.cookie == null) return ws.close();

        const cookies = cookie.parse(req.headers.cookie);
        const accessToken: string | undefined = cookies.accessToken;
        if (!accessToken) return ws.close();

        connections[accessToken] = ws;
        ws.onclose = () => {
            delete connections[accessToken];
        };
    });
}
