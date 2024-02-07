import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

configDotenv();
const PORT = parseInt(process.env.PORT!);
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;

const app = express();
app.use(
    cors({
        credentials: true,
        origin: "http://localhost:3000",
    })
);
app.use(cookieParser());

app.get("/test", (req, res) => {
    const accessToken: string = req.cookies.accessToken;
    console.log(accessToken);
});

app.get("/login", (req, res) => {
    const code = req.query.code;

    if (code == null) {
        const redirectURI = "http://localhost:3000";
        res.redirect(
            `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectURI}`
        );
        return;
    }

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

                fetch(`https://api.github.com/user`, {
                    headers: {
                        Accept: "application/vnd.github+json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
                    .then((pRes) => {
                        if (pRes.status !== 200)
                            throw "Status not OK (fetch user)";
                        return pRes.json();
                    })
                    .then((user) => {
                        res.status(200)
                            .setHeader(
                                "Set-Cookie",
                                `accessToken=${accessToken}; HttpOnly`
                            )
                            .json({ user });
                    })
                    .catch((err) => {
                        throw err;
                    });
            })
            .catch((err) => res.status(500));
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
