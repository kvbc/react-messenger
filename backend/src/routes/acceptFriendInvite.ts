import { Express, Request, Response } from "express";
import db, * as DB from "../db";
import { WebsocketMessage } from "@react-messenger/shared";
import * as wss from "../webSocketServer";
import {
    getRequestCookie,
    getRequestQuery,
    sendResError,
} from "../httpsServer";

export default async function (req: Request, res: Response) {
    const inviterLogin = getRequestQuery(req, res, "login");
    if (!inviterLogin) return;

    const inviteeAccessToken = getRequestCookie(req, res, "accessToken");
    if (!inviteeAccessToken) return;

    try {
        //
        // Fetch invitee login from access token
        //

        let inviteeLogin: string = "";
        await DB.get<Pick<DB.UsersRow, "login">>(
            "SELECT login FROM Users WHERE access_token = ?",
            [inviteeAccessToken],
            function (err: Error | null, { login }) {
                if (err)
                    throw sendResError(
                        res,
                        500,
                        `Cannot fetch invitee login from access token`
                    );
                inviteeLogin = login;
            }
        );

        console.log(
            `"${inviteeLogin}" accepts friend invite from "${inviterLogin}"`
        );

        //
        // Delete friend invite from the inviter
        //

        await DB.run(
            "DELETE FROM FriendInvitations WHERE inviter_login = ? AND invitee_login = ?",
            [inviterLogin, inviteeLogin],
            function (err: Error | null) {
                if (err)
                    throw sendResError(
                        res,
                        500,
                        `No friend invite found from "${inviterLogin}"`
                    );
            }
        );

        //
        // Add the inviter to friends
        //

        await DB.run(
            "INSERT INTO Friends(id, friend_login, friends_with_login) VALUES(NULL, ?, ?)",
            [inviteeLogin, inviterLogin],
            function (err: Error | null) {
                if (err)
                    throw sendResError(
                        res,
                        500,
                        `Already friends with ${inviterLogin}`
                    );
            }
        );

        res.sendStatus(200);

        //
        // Notify both the inviter and invitee through WebSockets
        //

        db.get<Pick<DB.UsersRow, "access_token">>(
            "SELECT access_token FROM Users WHERE login = ?",
            [inviterLogin],
            function (err: Error | null, { access_token: inviterAccessToken }) {
                if (err)
                    return console.error(
                        `Cannot fetch access token from inviter login (${inviterLogin})`
                    );
                // send to invitee
                {
                    const ws = wss.connections[inviteeAccessToken];
                    if (!ws) return;
                    const msg: WebsocketMessage = {
                        event: "accepted",
                        login: inviterLogin,
                    };
                    ws.send(JSON.stringify(msg));
                }
                // send to inviter
                {
                    const ws = wss.connections[inviterAccessToken];
                    if (!ws) return;
                    const msg: WebsocketMessage = {
                        event: "accepted_by",
                        login: inviteeLogin,
                    };
                    ws.send(JSON.stringify(msg));
                }
            }
        );
    } catch (err) {
        console.error(err);
    }
}
