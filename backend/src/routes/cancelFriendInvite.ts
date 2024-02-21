import { Express, Request, Response } from "express";
import { resError } from "../app";
import db, * as DB from "../db";
import * as wss from "../webSocketServer";
import { WebsocketMessage } from "@react-messenger/shared";

export default function (req: Request, res: Response) {
    const inviteeLogin = req.query.login;
    if (typeof inviteeLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    db.get(
        "SELECT login FROM Users WHERE access_token = ?",
        [accessToken],
        function (
            err: Error | null,
            { login: inviterLogin }: { login: string }
        ) {
            if (err) return resError(res, 500);
            db.run(
                "DELETE FROM FriendInvitations WHERE invitee_login = ? AND inviter_login = ?",
                [inviteeLogin, inviterLogin],
                function (err: Error | null) {
                    if (err) return resError(res, 500);
                    res.status(200).send();

                    // send to invitee
                    db.get(
                        "SELECT access_token FROM Users WHERE login = ?",
                        [inviteeLogin],
                        function (
                            err: Error | null,
                            {
                                access_token: inviteeAccessToken,
                            }: { access_token: string }
                        ) {
                            if (err) return;
                            const ws = wss.connections[inviteeAccessToken];
                            if (!ws) return;
                            const msg: WebsocketMessage = {
                                event: "canceled_by",
                                login: inviterLogin,
                            };
                            ws.send(JSON.stringify(msg));
                        }
                    );
                    // send to inviter
                    {
                        const ws = wss.connections[accessToken];
                        if (!ws) return;
                        const msg: WebsocketMessage = {
                            event: "canceled",
                            login: inviteeLogin,
                        };
                        ws.send(JSON.stringify(msg));
                    }
                }
            );
        }
    );
}
