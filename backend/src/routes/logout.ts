import { Express, Request, Response } from "express";
import { sendResError } from "../httpsServer";
import db, * as DB from "../db";
import * as wss from "../webSocketServer";
import { WebsocketMessage } from "@react-messenger/shared";

export default function (req: Request, res: Response) {
    res.status(200)
        .setHeader(
            "Set-Cookie",
            `accessToken=deleted; Path=/; Max-Age=0; HttpOnly; SameSite=None; Secure`
        )
        .send();
}
