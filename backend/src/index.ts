import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

configDotenv();
const PORT = parseInt(process.env.PORT!);
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;

let handledCodes: string[] = [];

const app = express();
app.use(
    cors({
        credentials: true,
        origin: "http://localhost:3000",
        exposedHeaders: "Set-Cookie",
    })
);
app.use(cookieParser());

// app.get("/test", (req, res) => {
//     const accessToken: string = req.cookies.accessToken;
//     console.log(accessToken);
// });

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
        fetch(`https://api.github.com/user`, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((pRes) => {
                console.log(pRes.status);
                if (pRes.status !== 200) throw "Status not OK (fetch user)";
                return pRes.json();
            })
            .then((user) => {
                res.status(200)
                    .setHeader(
                        "Set-Cookie",
                        `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=None`
                    )
                    .json({ user });
            })
            .catch((err) => {
                throw err;
            });
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
            const redirectURI = "http://localhost:3000";
            res.redirect(
                `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectURI}`
            );
        }
        return;
    }

    if (typeof code !== "string") return res.status(500).send();
    if (handledCodes.includes(code)) return res.status(500).send();
    handledCodes.push(code);
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
                const accessToken = data.access_token;
                if (accessToken == null) throw "No access token";
                returnUser(accessToken);
            })
            .catch((err) => res.status(500).send());
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
