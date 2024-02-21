import https from "node:https";
import fs from "fs";
import { BACKEND_PORT } from "@react-messenger/shared";
import { Express } from "express";

export function init(app: Express): https.Server {
    return https
        .createServer(
            {
                key: fs.readFileSync(
                    "../frontend/certificates/localhost-key.pem",
                    "utf-8"
                ),
                cert: fs.readFileSync(
                    "../frontend/certificates/localhost.pem",
                    "utf-8"
                ),
            },
            app
        )
        .listen(BACKEND_PORT);
}
