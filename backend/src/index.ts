import { configDotenv } from "dotenv";
import express, { Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sqlite3, { Database } from "sqlite3";
import cookie from "cookie";
import {
    BACKEND_PORT,
    BackendErrorResponse,
    FRONTEND_URL,
    PublicGithubUser,
    User,
    WEBSOCKET_PORT,
    WebsocketMessage,
} from "@react-messenger/shared";
import { WebSocket, WebSocketServer } from "ws";

sqlite3.verbose();

configDotenv();
const CLIENT_ID: string = process.env.CLIENT_ID!;
const CLIENT_SECRET: string = process.env.CLIENT_SECRET!;

// const db = new sqlite3.Database("db.db");
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Users(
            login TEXT PRIMARY KEY UNIQUE,
            access_token TEXT UNIQUE NOT NULL
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS Friends(
            id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
            friend_login TEXT NOT NULL,
            friends_with_login TEXT NOT NULL,
            UNIQUE(friend_login, friends_with_login)
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS FriendInvitations(
            id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
            inviter_login TEXT NOT NULL,
            invitee_login TEXT NOT NULL,
            UNIQUE(inviter_login, invitee_login)
        )
    `);
});

type UsersRow = { login: string; access_token: string };
type FriendsRow = {
    id: number;
    friend_login: string;
    friends_with_login: string;
};
type FriendInvitationsRow = {
    id: number;
    inviter_login: string;
    invitee_login: string;
};

//

const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
const wsConnections: { [accessToken: string]: WebSocket | undefined } = {};
wss.on("connection", (ws, req) => {
    console.log("[WS] new connection");

    ws.onerror = console.error;

    if (req.headers.cookie == null) return ws.close();

    const cookies = cookie.parse(req.headers.cookie);
    const accessToken: string | undefined = cookies.accessToken;
    if (!accessToken) return ws.close();

    wsConnections[accessToken] = ws;
    ws.onclose = () => {
        delete wsConnections[accessToken];
    };
});

//

const handledAccessCodes: string[] = [];

const app = express();
app.use(
    cors({
        credentials: true,
        origin: FRONTEND_URL,
        exposedHeaders: "Set-Cookie",
    })
);
app.use(cookieParser());

app.get("/acceptFriendInvite", (req, res) => {
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
        function (err, inviteeRow: UsersRow) {
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
                                function (err, inviterRow: UsersRow) {
                                    if (err) return;
                                    // send to invitee
                                    {
                                        const ws = wsConnections[accessToken];
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
                                            wsConnections[
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
});

app.get("/rejectFriendInvite", (req, res) => {
    const inviterLogin = req.query.login;
    if (typeof inviterLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    db.get(
        "SELECT login FROM Users WHERE access_token = ?",
        [accessToken],
        function (err, inviteeRow: UsersRow) {
            if (err) return resError(res, 500);
            db.run(
                "DELETE FROM FriendInvitations WHERE inviter_login = ? AND invitee_login = ?",
                [inviterLogin, inviteeRow.login],
                function (err) {
                    if (err) return resError(res, 500, "No invite");
                    res.status(200).send();

                    db.get(
                        "SELECT access_token FROM Users WHERE login = ?",
                        [inviterLogin],
                        function (err, inviterRow: UsersRow) {
                            if (err) return;
                            // send to invitee
                            {
                                const ws = wsConnections[accessToken];
                                if (!ws) return;
                                const msg: WebsocketMessage = {
                                    event: "rejected",
                                    login: inviterLogin,
                                };
                                ws.send(JSON.stringify(msg));
                            }
                            // send to inviter
                            {
                                const ws =
                                    wsConnections[inviterRow.access_token];
                                if (!ws) return;
                                const msg: WebsocketMessage = {
                                    event: "rejected_by",
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
});

app.get("/cancelFriendInvite", (req, res) => {
    const inviteeLogin = req.query.login;
    if (typeof inviteeLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    db.get(
        "SELECT login FROM Users WHERE access_token = ?",
        [accessToken],
        function (err, { login: inviterLogin }: { login: string }) {
            if (err) return resError(res, 500);
            db.run(
                "DELETE FROM FriendInvitations WHERE invitee_login = ? AND inviter_login = ?",
                [inviteeLogin, inviterLogin],
                function (err) {
                    if (err) return resError(res, 500);
                    res.status(200).send();

                    // send to invitee
                    db.get(
                        "SELECT access_token FROM Users WHERE login = ?",
                        [inviteeLogin],
                        function (
                            err,
                            {
                                access_token: inviteeAccessToken,
                            }: { access_token: string }
                        ) {
                            if (err) return;
                            const ws = wsConnections[inviteeAccessToken];
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
                        const ws = wsConnections[accessToken];
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
});

app.get("/inviteFriend", (req, res) => {
    const inviteeLogin = req.query.login;
    if (typeof inviteeLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    db.get(
        "SELECT login FROM Users WHERE access_token = ?",
        [accessToken],
        function (err, inviterRow: UsersRow) {
            if (err) return resError(res, 500);
            if (inviteeLogin === inviterRow.login)
                return resError(res, 500, "Cannot invite yourself as a friend");
            db.run(
                "INSERT OR IGNORE INTO FriendInvitations(id, inviter_login, invitee_login) VALUES(NULL, ?, ?)",
                [inviterRow.login, inviteeLogin],
                function (err) {
                    if (err) return resError(res, 500);
                    if (this.changes === 0)
                        // (query ignored)
                        return resError(res, 500, "Friend already invited");
                    res.status(200).send();

                    db.get<Pick<UsersRow, "access_token">>(
                        "SELECT access_token FROM Users WHERE login = ?",
                        [inviteeLogin],
                        function (err, inviteeRow) {
                            if (err) return;
                            // send to inviter
                            {
                                const ws = wsConnections[accessToken];
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
                                    wsConnections[inviteeRow.access_token];
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
});

app.get("/logout", (req, res) => {
    res.status(200)
        .setHeader(
            "Set-Cookie",
            `accessToken=deleted; Path=/; Max-Age=0; HttpOnly` //; SameSite=None`
        )
        .send();
});

app.get("/login", (req, res) => {
    function returnUser(accessToken: string) {
        fetchGithubUserFromAccessToken(accessToken).then(
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
                    function (err: Error | null, rows: FriendInvitationsRow[]) {
                        if (err) return resError(res, 500);
                        rows.forEach((row) => {
                            console.log(`invite from: ${row.inviter_login}`);
                            user.friendInvitations.push(row.inviter_login);
                        });
                        db.all(
                            "SELECT friend_login FROM Friends WHERE friends_with_login = ?",
                            [user.login],
                            function (err, rows: FriendsRow[]) {
                                if (err) return resError(res, 500);
                                rows.forEach((row) => {
                                    console.log(`friend: ${row.friend_login}`);
                                    user.friends.push(row.friend_login);
                                });
                                db.all(
                                    "SELECT friends_with_login FROM Friends WHERE friend_login = ?",
                                    [user.login],
                                    function (err, rows: FriendsRow[]) {
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
                                                `accessToken=${accessToken}; Path=/; HttpOnly` //; SameSite=None`
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
            res.status(500).send();
        } else {
            const redirectURI = FRONTEND_URL;
            res.redirect(
                `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectURI}`
            );
        }
        return;
    }

    if (typeof code !== "string") return res.status(500).send();
    if (handledAccessCodes.includes(code)) return res.status(569).send();
    handledAccessCodes.push(code);
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
                // console.log(`>>>> `, data);
                returnUser(data.access_token);
            })
            .catch((err) => res.status(500).send());
    }
});

app.listen(BACKEND_PORT, () => {
    console.log(`Listening on port ${BACKEND_PORT}`);
});

// type ExtractMethodNames<T> = { [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never }[keyof T];
// type ExtractMethods<T> = Pick<T, ExtractMethodNames<T>>;

// type OnlyClassMethods<T> = {
//     [K in keyof T]: T[K] extends (...args: any) => any ? K : never
// }[keyof T]

// function dbPromise<T>(dbFunc: (...params: any, callback: Function) => sqlite3.Database, ...params: any, callback: Function): Promise<T> {
//     return new Promise((resolve, reject) => {
//         dbFunc(params, function(...args: any) {
//             let res = callback(args);
//             if(res === null)
//                 reject()
//             else
//                 resolve(res)
//         })
//     })
// }

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
function resError(
    res: Response,
    statusCode: number,
    message: string | null = null
): null {
    const json: BackendErrorResponse = { message };
    console.error(`[Error ${statusCode}] ${message}`);
    res.status(statusCode).json(json);
    return null;
}

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
