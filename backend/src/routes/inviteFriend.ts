import { Express, Request, Response } from "express";
import { resError } from "../app";
import db, * as DB from "../db";
import * as wss from "../webSocketServer";
import { WebsocketMessage } from "@react-messenger/shared";
import sqlite3 from "sqlite3";

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
        function (err: Error | null, inviterRow: DB.UsersRow) {
            if (err) return resError(res, 500);
            if (inviteeLogin === inviterRow.login)
                return resError(res, 500, "Cannot invite yourself as a friend");
            db.run(
                "INSERT OR IGNORE INTO FriendInvitations(id, inviter_login, invitee_login) VALUES(NULL, ?, ?)",
                [inviterRow.login, inviteeLogin],
                function (this: sqlite3.RunResult, err: Error | null) {
                    if (err) return resError(res, 500);
                    if (this.changes === 0)
                        // (query ignored)
                        return resError(res, 500, "Friend already invited");
                    res.status(200).send();

                    db.get(
                        "SELECT access_token FROM Users WHERE login = ?",
                        [inviteeLogin],
                        function (
                            err: Error | null,
                            inviteeRow: Pick<DB.UsersRow, "access_token">
                        ) {
                            if (err) return;
                            // send to inviter
                            {
                                const ws = wss.connections[accessToken];
                                if (!ws) return;
                                const msg: WebsocketMessage = {
                                    event: "invited",
                                    login: inviteeLogin,
                                };
                                ws.send(JSON.stringify(msg));
                            }
                            // send to invitee
                            {
                                const ws =
                                    wss.connections[inviteeRow.access_token];
                                if (!ws) return;
                                const msg: WebsocketMessage = {
                                    event: "invited_by",
                                    login: inviterRow.login,
                                };
                                ws.send(JSON.stringify(msg));
                            }
                        }
                    );
                }
            );
        }
    );
}
