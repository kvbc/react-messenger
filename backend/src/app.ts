import express, { Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { BackendResponseError, FRONTEND_URL } from "@react-messenger/shared";
import * as wss from "./websocketServer";
import * as httpsServer from "./httpsServer";
import routeAcceptFriendInvite from "./routes/acceptFriendInvite";
import routeRejectFriendInvite from "./routes/rejectFriendInvite";
import routeCancelFriendInvite from "./routes/cancelFriendInvite";
import routeInviteFriend from "./routes/inviteFriend";
import routeLogout from "./routes/logout";
import routeLogin from "./routes/login";

const app = express();
app.use(
    cors({
        credentials: true,
        origin: FRONTEND_URL,
        exposedHeaders: "Set-Cookie",
        allowedHeaders: "Set-Cookie",
    })
);
app.use(cookieParser());

app.get("/acceptFriendInvite", routeAcceptFriendInvite);
app.get("/rejectFriendInvite", routeRejectFriendInvite);
app.get("/cancelFriendInvite", routeCancelFriendInvite);
app.get("/inviteFriend", routeInviteFriend);
app.get("/logout", routeLogout);
app.get("/login", routeLogin);

const server = httpsServer.init(app);
wss.init(server);

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export function resError(
    res: Response,
    statusCode: number,
    message: string | null = null,
    retry: boolean = true
): null {
    const json: BackendResponseError = { message, retry };
    console.error(`[Error ${statusCode}] ${json.message} ${json.retry}`);
    res.status(statusCode).json(json);
    return null;
}
