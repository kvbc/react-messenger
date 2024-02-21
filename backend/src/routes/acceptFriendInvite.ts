import { Express, Request, Response } from "express";
import db, * as DB from "../db";
import { WebsocketMessage } from "@react-messenger/shared";
import * as wss from "../websocketServer";
import { resError } from "../app";

export default function (req: Request, res: Response) {
    const inviterLogin = req.query.login;
    if (typeof inviterLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    console.log(`accept mr. ${inviterLogin}`);

    db.get(
        "SELECT login FROM Users WHERE access_token = ?",
        [accessToken],
        function (err, inviteeRow: DB.UsersRow) {
            if (err) return resError(res, 500);
            db.run(
                "DELETE FROM FriendInvitations WHERE inviter_login = ? AND invitee_login = ?",
                [inviterLogin, inviteeRow.login],
                function (err) {
                    if (err) return resError(res, 500, "No invite");
                    db.run(
                        "INSERT INTO Friends(id, friend_login, friends_with_login) VALUES(NULL, ?, ?)",
                        [inviteeRow.login, inviterLogin],
                        function (err) {
                            if (err) return resError(res, 500);
                            res.status(200).send();

                            db.get(
                                "SELECT access_token FROM Users WHERE login = ?",
                                [inviterLogin],
                                function (err, inviterRow: DB.UsersRow) {
                                    if (err) return;
                                    // send to invitee
                                    {
                                        const ws = wss.connections[accessToken];
                                        if (!ws) return;
                                        const msg: WebsocketMessage = {
                                            event: "accepted",
                                            login: inviterLogin,
                                        };
                                        ws.send(JSON.stringify(msg));
                                    }
                                    // send to inviter
                                    {
                                        const ws =
                                            wss.connections[
                                                inviterRow.access_token
                                            ];
                                        if (!ws) return;
                                        const msg: WebsocketMessage = {
                                            event: "accepted_by",
                                            login: inviteeRow.login,
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
    );
}
