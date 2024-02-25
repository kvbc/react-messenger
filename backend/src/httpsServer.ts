import https from "node:https";
import fs from "fs";
import { BACKEND_PORT, BackendResponseError } from "@react-messenger/shared";
import { Express, Request, Response } from "express";

export type Cookies = {
    accessToken: string;
};

export function start(app: Express): https.Server {
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

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export function sendResError(
    res: Response,
    statusCode: number,
    message: string | null = null,
    retry: boolean = true
) {
    const json: BackendResponseError = { message, retry };
    console.error(`[Error ${statusCode}] ${json.message} ${json.retry}`);
    res.status(statusCode).json(json);
}

function getRequestObjectEntry<T extends string>(
    req: Request,
    res: Response,
    objectName: keyof Request,
    entryName: T
): string | null {
    const entry = req[objectName][entryName];
    if (typeof entry !== "string") {
        sendResError(res, 500, `Missing ${entryName} ${objectName.toString()}`);
        return null;
    }
    return entry;
}

export function getRequestQuery(
    req: Request,
    res: Response,
    queryName: string
): string | null {
    return getRequestObjectEntry(req, res, "query", queryName);
}

export function getRequestCookie(
    req: Request,
    res: Response,
    cookieName: keyof Cookies
): string | null {
    return getRequestObjectEntry(req, res, "cookies", cookieName);
}
