import sqlite3, { Database } from "sqlite3";

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
