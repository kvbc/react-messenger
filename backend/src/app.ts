import express, { Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { BackendResponseError, FRONTEND_URL } from "@react-messenger/shared";
import * as webSocketServer from "./webSocketServer";
import * as httpsServer from "./httpsServer";
import routeAcceptFriendInvite from "./routes/acceptFriendInvite";
import routeRejectFriendInvite from "./routes/rejectFriendInvite";
import routeCancelFriendInvite from "./routes/cancelFriendInvite";
import routeInviteFriend from "./routes/inviteFriend";
import routeLogout from "./routes/logout";
import routeLogin from "./routes/login";

const app = express();
app.use(cookieParser());
app.use(
    cors({
        credentials: true,
        origin: FRONTEND_URL,
        exposedHeaders: "Set-Cookie",
        allowedHeaders: "Set-Cookie",
    })
);

app.get("/acceptFriendInvite", routeAcceptFriendInvite);
app.get("/rejectFriendInvite", routeRejectFriendInvite);
app.get("/cancelFriendInvite", routeCancelFriendInvite);
app.get("/inviteFriend", routeInviteFriend);
app.get("/logout", routeLogout);
app.get("/login", routeLogin);

const server = httpsServer.init(app);
webSocketServer.init(server);
