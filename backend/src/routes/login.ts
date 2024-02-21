import { configDotenv } from "dotenv";
import { Express, Request, Response } from "express";
import { resError } from "../app";
import db, * as DB from "../db";
import * as wss from "../webSocketServer";
import {
    PublicGithubUser,
    User,
    WebsocketMessage,
    FRONTEND_URL,
} from "@react-messenger/shared";
import sqlite3 from "sqlite3";

configDotenv();
const CLIENT_ID: string = process.env.CLIENT_ID!;
const CLIENT_SECRET: string = process.env.CLIENT_SECRET!;

const handledAccessCodes: string[] = [];

function fetchGithubUserFromAccessToken(
    accessToken: string
): Promise<PublicGithubUser | null> {
    return fetch(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${accessToken}`,
        },
    }).then((pRes) => {
        console.log(pRes.status, pRes.statusText, accessToken);
        if (pRes.status !== 200) return null;
        return pRes.json();
    });
}

export default function (req: Request, res: Response) {
    function returnUser(accessToken: string) {
        return fetchGithubUserFromAccessToken(accessToken).then(
            (ghUser: PublicGithubUser | null) => {
                if (ghUser === null)
                    return resError(
                        res,
                        500,
                        "Could not fetch user from access token"
                    );

                let user: User = ghUser as User;
                user.friends = [];
                user.friendInvitations = [];
                user.pendingFriendInvites = [];

                db.run(
                    "INSERT OR IGNORE INTO Users(login, access_token) VALUES(?, ?)",
                    [user.login, accessToken]
                );

                db.run("UPDATE Users SET access_token = ? WHERE login = ?", [
                    accessToken,
                    user.login,
                ]);

                db.all(
                    "SELECT invitee_login FROM FriendInvitations WHERE inviter_login = ?",
                    [user.login],
                    function (err, rows: { invitee_login: string }[]) {
                        if (err) return resError(res, 500);
                        rows.forEach((row) => {
                            user.pendingFriendInvites.push(row.invitee_login);
                        });
                    }
                );

                db.all(
                    "SELECT inviter_login FROM FriendInvitations WHERE invitee_login = ?",
                    [user.login],
                    function (
                        err: Error | null,
                        rows: DB.FriendInvitationsRow[]
                    ) {
                        if (err) return resError(res, 500);
                        rows.forEach((row) => {
                            console.log(`invite from: ${row.inviter_login}`);
                            user.friendInvitations.push(row.inviter_login);
                        });
                        db.all(
                            "SELECT friend_login FROM Friends WHERE friends_with_login = ?",
                            [user.login],
                            function (err, rows: DB.FriendsRow[]) {
                                if (err) return resError(res, 500);
                                rows.forEach((row) => {
                                    console.log(`friend: ${row.friend_login}`);
                                    user.friends.push(row.friend_login);
                                });
                                db.all(
                                    "SELECT friends_with_login FROM Friends WHERE friend_login = ?",
                                    [user.login],
                                    function (err, rows: DB.FriendsRow[]) {
                                        if (err) return resError(res, 500);
                                        rows.forEach((row) => {
                                            console.log(
                                                `friend: ${row.friends_with_login}`
                                            );
                                            user.friends.push(
                                                row.friends_with_login
                                            );
                                        });
                                        res.status(200)
                                            .setHeader(
                                                "Set-Cookie",
                                                `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=None; Secure`
                                            )
                                            .json({ user });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken === "string") {
        return returnUser(accessToken);
    }

    const code = req.query.code;
    const noRedirect = req.query.noRedirect;

    if (code == null) {
        if (noRedirect === "true") {
            resError(res, 500, "case no. 1", false);
        } else {
            const redirectURI = FRONTEND_URL;
            res.redirect(
                `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectURI}`
            );
        }
        return;
    }

    if (typeof code !== "string") return resError(res, 500);
    if (handledAccessCodes.includes(code))
        return resError(res, 500, "case no. 2", false);
    // handledAccessCodes.push(code);
    console.log(`Code: ${code}`);

    {
        const redirectURI = FRONTEND_URL;
        fetch(
            `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&redirect_uri=${redirectURI}`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            }
        )
            .then((pRes) => {
                // console.log(`>>> ${pRes.status} ${pRes.statusText}`);
                if (pRes.status !== 200)
                    throw "Status not OK (fetch access token)";
                return pRes.json();
            })
            .then((data) => {
                // FIXME: fix race condition (this fucking strict mode man...)
                // perhaps have like a counter for a spec. handled code
                // so to only send res if top counter is same as it was at start of req.
                console.log(`>>>> `, data);
                returnUser(data.access_token).then(() => {
                    console.log(`Code handled (${code})`);
                    handledAccessCodes.push(code);
                });
            })
            .catch((err) => resError(res, 500));
    }
}
