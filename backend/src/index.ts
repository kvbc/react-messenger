import { configDotenv } from "dotenv";
import express, { Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sqlite3 from "sqlite3";
import {
    BackendErrorResponse,
    PublicGithubUser,
    User,
} from "@react-messenger/shared";

configDotenv();
const PORT = parseInt(process.env.PORT!);
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;

// let handledCodes: string[] = [];

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
});

type UsersRow = { login: string; access_token: string };
type FriendsRow = {
    id: number;
    friend_login: string;
    friends_with_login: string;
};

const app = express();
app.use(
    cors({
        credentials: true,
        origin: "http://localhost:3000",
        exposedHeaders: "Set-Cookie",
    })
);
app.use(cookieParser());

app.get("/addFriend", (req, res) => {
    const addFriendLogin = req.query.login;
    if (typeof addFriendLogin !== "string")
        return resError(res, 500, "Missing login query");

    const accessToken = req.cookies.accessToken;
    if (typeof accessToken !== "string")
        return resError(res, 500, "Missing access token");

    db.get(
        "SELECT * FROM Users WHERE access_token = ?",
        [accessToken],
        function (err, row: UsersRow) {
            if (err) return resError(res, 500);
            if (addFriendLogin === row.login)
                return resError(res, 500, "Cannot add yourself as a friend");
            db.run(
                "INSERT OR IGNORE INTO Friends(id, friend_login, friends_with_login) VALUES(NULL, ?, ?)",
                [addFriendLogin, row.login],
                function (err) {
                    if (err) return resError(res, 500);
                    if (this.changes === 0)
                        // (query ignored)
                        return resError(res, 500, "Friend already exists");
                    return res.status(200).send();
                }
            );
        }
    );
});

app.get("/logout", (req, res) => {
    res.status(200)
        .setHeader(
            "Set-Cookie",
            `accessToken=deleted; Path=/; Max-Age=0; HttpOnly; SameSite=None`
        )
        .send();
});

app.get("/login", (req, res) => {
    function returnUser(accessToken: string) {
        fetchGithubUserFromAccessToken(accessToken).then(
            (ghUser: PublicGithubUser) => {
                let user: User = ghUser as User;
                user.friends = [];

                db.run(
                    "INSERT OR IGNORE INTO Users(login, access_token) VALUES(?, ?)",
                    [user.login, accessToken]
                );

                db.run("UPDATE Users SET access_token = ? WHERE login = ?", [
                    accessToken,
                    user.login,
                ]);

                db.all(
                    "SELECT friend_login FROM Friends WHERE friends_with_login = ?",
                    [user.login],
                    function (err, rows: FriendsRow[]) {
                        if (err) {
                            console.error(err);
                            return res.status(500).send();
                        }
                        rows.forEach((row) => {
                            console.log(`add friend: ${row.friend_login}`);
                            user.friends.push(row.friend_login);
                        });
                        res.status(200)
                            .setHeader(
                                "Set-Cookie",
                                `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=None`
                            )
                            .json({ user });
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
            res.status(200).send();
        } else {
            const redirectURI = "http://localhost:3000";
            res.redirect(
                `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectURI}`
            );
        }
        return;
    }

    if (typeof code !== "string") return res.status(500).send();
    console.log(`Code: ${code}`);

    {
        const redirectURI = "http://localhost:3000";
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
                if (pRes.status !== 200)
                    throw "Status not OK (fetch access token)";
                return pRes.json();
            })
            .then((data) => {
                returnUser(data.access_token);
            })
            .catch((err) => res.status(500).send());
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
function resError(
    res: Response,
    statusCode: number,
    message: string | null = null
) {
    const json: BackendErrorResponse = { message };
    console.error(`[Error ${statusCode}] ${message}`);
    res.status(statusCode).json(json);
}

function fetchGithubUserFromAccessToken(
    accessToken: string
): Promise<PublicGithubUser> {
    return fetch(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${accessToken}`,
        },
    }).then((pRes) => {
        if (pRes.status !== 200) throw "Could not fetch user from access token";
        return pRes.json();
    });
}
