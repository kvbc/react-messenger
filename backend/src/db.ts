import sqlite3 from "sqlite3";

sqlite3.verbose();

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

function newPromise(
    dbMethod: Function,
    sql: string,
    params: any,
    callback: Function
): Promise<void> {
    return new Promise((resolve, reject) => {
        dbMethod(sql, params, function (this: any, ...args: any[]) {
            try {
                callback.call(this, ...args);
                resolve();
            } catch (err) {
                reject();
            }
        });
    });
}

export function get<rowT>(
    sql: string,
    params: any,
    callback: (this: sqlite3.Statement, err: Error | null, row: rowT) => void
): Promise<void> {
    return newPromise(db.get.bind(db), sql, params, callback);
}

export function run(
    sql: string,
    params: any,
    callback: (this: sqlite3.RunResult, err: Error | null) => void
): Promise<void> {
    return newPromise(db.run.bind(db), sql, params, callback);
}

export type UsersRow = { login: string; access_token: string };
export type FriendsRow = {
    id: number;
    friend_login: string;
    friends_with_login: string;
};
export type FriendInvitationsRow = {
    id: number;
    inviter_login: string;
    invitee_login: string;
};

export default db;
