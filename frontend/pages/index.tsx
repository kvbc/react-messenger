"use client";

import { FaReact } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/contexts/UserContext";
import { User, WebsocketMessage } from "@react-messenger/shared";
import Loading from "@/components/Loading";
import FriendsList from "@/components/FriendsList";
import Chatbox from "@/components/Chatbox";
import StatusBar from "@/components/StatusBar";
import useWebSocket from "react-use-websocket";

const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL!;
const WEBSOCKET_URL: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;

function HomeLogin({
    onLoginButtonClicked,
}: {
    onLoginButtonClicked: () => void;
}) {
    return (
        <div>
            <button
                onClick={onLoginButtonClicked}
                className={`flex justify-center items-center gap-1 p-2 bg-slate-100 text-slate-950 w-[200%] rounded-lg font-semibold shadow-lg
                            hover:bg-blue-400 hover:text-slate-100 duration-300`}
            >
                <FaGithub />
                Login
            </button>
        </div>
    );
}

function HomeApp({
    onLogoutButtonClicked,
}: {
    onLogoutButtonClicked: () => void;
}) {
    const user = useContext(UserContext);
    const [ws, setWS] = useState<WebSocket | null>(null);

    useEffect(() => {
        setWS((ws) => {
            if (user.value === null || typeof user.value === "string") {
                if (ws) ws.close();
                return null;
            }
            console.log(user);
            return new WebSocket(WEBSOCKET_URL);
        });
    }, [user]);

    useEffect(() => {
        if (ws === null) return;

        ws.onclose = () => setWS(null);
        ws.onerror = console.error;
        ws.onmessage = (strMsg: MessageEvent<string>) => {
            const msg: WebsocketMessage = JSON.parse(strMsg.data);

            console.log(msg);

            switch (msg.event) {
                case "accepted":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                                  friends: [...user.friends, msg.login],
                              }
                    );
                    break;

                case "accepted_by":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                                  friends: [...user.friends, msg.login],
                              }
                    );
                    break;

                case "invited":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  pendingFriendInvites: [
                                      ...user.friendInvitations,
                                      msg.login,
                                  ],
                              }
                    );
                    break;

                case "invited_by":
                    console.log(`invited by "${msg.login}"`);
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  friendInvitations: [
                                      ...user.friendInvitations,
                                      msg.login,
                                  ],
                              }
                    );
                    break;

                case "rejected":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                    );
                    break;

                case "rejected_by":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                    );
                    break;

                case "canceled":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                    );
                    break;

                case "canceled_by":
                    user.set?.((user) =>
                        user === null || typeof user === "string"
                            ? user
                            : {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                    );
                    break;
            }
        };
    }, [user, ws]);

    function handleInviteFriendButtonClicked(inviteeLogin: string) {
        fetch(`${BACKEND_URL}/inviteFriend?login=${inviteeLogin}`, {
            credentials: "include",
        });
        // .then((res) => {
        //     console.log(res.status);
        //     if (res.status !== 200) throw "Status not OK";
        //     user.set?.((user) =>
        //         user === null || typeof user === "string"
        //             ? user
        //             : { ...user, friends: [...user.friends, friendLogin] }
        //     );
        // });
    }

    function handleAcceptFriendInviteButtonClicked(inviterLogin: string) {
        fetch(`${BACKEND_URL}/acceptFriendInvite?login=${inviterLogin}`, {
            credentials: "include",
        });
    }

    function handleRejectFriendInviteButtonClicked(inviterLogin: string) {
        fetch(`${BACKEND_URL}/rejectFriendInvite?login=${inviterLogin}`, {
            credentials: "include",
        });
    }

    function handleCancelFriendInviteButtonClicked(inviteeLogin: string) {
        fetch(`${BACKEND_URL}/cancelFriendInvite?login=${inviteeLogin}`, {
            credentials: "include",
        });
    }

    return (
        <>
            <StatusBar onLogoutButtonClicked={onLogoutButtonClicked} />
            <div className="w-full h-full flex gap-4">
                <FriendsList
                    onInviteFriendButtonClicked={
                        handleInviteFriendButtonClicked
                    }
                    onAcceptFriendInviteButtonClicked={
                        handleAcceptFriendInviteButtonClicked
                    }
                    onRejectFriendInviteButtonClicked={
                        handleRejectFriendInviteButtonClicked
                    }
                    onCancelFriendInviteButtonClicked={
                        handleCancelFriendInviteButtonClicked
                    }
                />
                <Chatbox />
            </div>
        </>
    );
}

export default function Home() {
    const router = useRouter();
    // null - not loading
    // string - loading
    // User - loaded
    const [user, setUser] = useState<User | string | null>(null);
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setCode(urlParams.get("code"));
    }, []);

    useEffect(() => {
        setUser(code);
    }, [code]);

    useEffect(() => {
        // if (typeof user === null) {
        //     const fetchID = String(Math.random());
        //     setUser(fetchID);
        //     return;
        // }
        if (typeof user === "string") {
            const fetchID = user;
            const controller = new AbortController();
            fetch(
                `${BACKEND_URL}/login` +
                    (code != null ? `?code=${code}` : "?noRedirect=true"),
                {
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                }
            )
                .then((res) => {
                    console.log(`Login status ${res.status}`);
                    if (res.status !== 200) throw "Status not OK";
                    return res.json();
                })
                .then((data) => {
                    setUser(data.user);
                })
                .catch((err) => {
                    console.error(err);
                    console.log("ERRORD");
                    setUser((user) => (user === fetchID ? null : user));
                });
            return () => {
                setUser((user) => (user === fetchID ? null : user));
                controller.abort();
            };
        }
    }, [user, code]);

    function handleLoginButtonClicked() {
        router.push(`${BACKEND_URL}/login`);
    }

    function handleLogoutButtonClicked() {
        setUser(null);
        fetch(`${BACKEND_URL}/logout`, {
            credentials: "include",
        });
    }

    return (
        <div className="h-screen from-slate-800 to-slate-950 bg-gradient-to-b text-white flex flex-col items-center justify-center gap-6 p-6">
            {/* title */}
            <div className="flex text-4xl font-semibold justify-center items-center gap-2">
                <FaReact className="animate-spin-slow text-blue-400" />
                <h1>React Messenger</h1>
            </div>

            {user === null ? (
                <HomeLogin onLoginButtonClicked={handleLoginButtonClicked} />
            ) : (
                <UserContext.Provider
                    value={{
                        value: typeof user === "string" ? null : user,
                        set: setUser,
                    }}
                >
                    <HomeApp
                        onLogoutButtonClicked={handleLogoutButtonClicked}
                    />
                </UserContext.Provider>
            )}
        </div>
    );
}
