import { WebSocket, WebSocketServer } from "ws";
import cookie from "cookie";
import https from "node:https";

export const connections: { [accessToken: string]: WebSocket | undefined } = {};

export function start(server: https.Server) {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws, req) => {
        console.log("[WS] new connection");

        if (!req.headers.cookie) {
            console.error("=> no Cookie header");
            ws.close();
            return;
        }

        const cookies = cookie.parse(req.headers.cookie);
        const accessToken: string | undefined = cookies.accessToken;
        if (!accessToken) {
            console.error("=> no accessToken cookie");
            ws.close();
            return;
        }

        const onopen = () => {
            console.log("[WS] connection open");
            connections[accessToken] = ws;
        };

        ws.onerror = console.error;
        ws.onopen = onopen;
        if (ws.readyState === ws.OPEN) onopen();
        ws.onclose = () => {
            console.log("[WS] connection closed");
            delete connections[accessToken];
        };
    });
}
