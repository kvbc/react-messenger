"use client";

import { FaReact } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/contexts/UserContext";
import { User, WebsocketMessage, getBackendURL } from "@react-messenger/shared";
import FriendsList from "@/components/FriendsList";
import Chatbox from "@/components/Chatbox";
import StatusBar from "@/components/StatusBar";
import useWebSocket from "react-use-websocket";
import { useQuery } from "react-query";

const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL!;
const WEBSOCKET_URL: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;

//
// Displayed whenever the user is not logged in or there's a login error
//
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

//
// Displayed whenever the user is logged or logging in
//
function HomeApp({
    onLogoutButtonClicked,
}: {
    onLogoutButtonClicked: () => void;
}) {
    useWebsocketConnection();

    function handleInviteFriendButtonClicked(inviteeLogin: string) {
        fetch(getBackendURL("inviteFriend", inviteeLogin), {
            credentials: "include",
        });
    }

    function handleAcceptFriendInviteButtonClicked(inviterLogin: string) {
        fetch(getBackendURL("acceptFriendInvite", inviterLogin), {
            credentials: "include",
        });
    }

    function handleRejectFriendInviteButtonClicked(inviterLogin: string) {
        fetch(getBackendURL("rejectFriendInvite", inviterLogin), {
            credentials: "include",
        });
    }

    function handleCancelFriendInviteButtonClicked(inviteeLogin: string) {
        fetch(getBackendURL("cancelFriendInvite", inviteeLogin), {
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
    const [user, setUser] = useState<User | undefined>(undefined);
    const {
        data: userData,
        status: userStatus,
        refetch: refetchUser,
    } = useQuery<User>({
        queryKey: "user",
        retry: (_, resStatus) => {
            if (resStatus === 569) return false;
            const urlParams = new URLSearchParams(window.location.search);
            const accessCode = urlParams.get("code");
            return accessCode !== null;
        },
        queryFn: (ctx) => {
            const urlParams = new URLSearchParams(window.location.search);
            const accessCode = urlParams.get("code");
            const urlQuery =
                accessCode === null ? "noRedirect=true" : `code=${accessCode}`;
            return fetch(`${BACKEND_URL}/login?${urlQuery}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
                signal: ctx.signal,
            })
                .then((res) => {
                    console.log(`Login status: ${res.status}`);
                    if (res.status === 200) return res.json();
                    throw res.status;
                })
                .then((data) => {
                    return data.user as User;
                });
        },
    });

    useEffect(() => {
        setUser(userData);
    }, [userData]);

    function handleLoginButtonClicked() {
        router.push(`${BACKEND_URL}/login`);
    }

    function handleLogoutButtonClicked() {
        fetch(`${BACKEND_URL}/logout`, {
            credentials: "include",
        }).then(() => {
            refetchUser();
        });
    }

    console.log(userStatus);

    return (
        <div className="h-screen from-slate-800 to-slate-950 bg-gradient-to-b text-white flex flex-col items-center justify-center gap-6 p-6">
            {/* title */}
            <div className="flex text-4xl font-semibold justify-center items-center gap-2">
                <FaReact className="animate-spin-slow text-blue-400" />
                <h1>React Messenger</h1>
            </div>

            {(userStatus === "error" || userStatus === "idle") && (
                <HomeLogin onLoginButtonClicked={handleLoginButtonClicked} />
            )}
            {(userStatus === "loading" || userStatus === "success") && (
                <UserContext.Provider
                    value={{
                        value: user,
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

/*
 *
 * This is a mess!
 * TODO: Clean-up
 *
 */

function useWebsocketConnection() {
    const user = useContext(UserContext);
    const [ws, setWS] = useState<WebSocket | null>(null);

    useEffect(() => {
        setWS((ws) => {
            if (!user.value) {
                if (ws) ws.close();
                return null;
            }
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
                        user
                            ? {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                                  friends: [...user.friends, msg.login],
                              }
                            : user
                    );
                    break;

                case "accepted_by":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                                  friends: [...user.friends, msg.login],
                              }
                            : user
                    );
                    break;

                case "invited":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  pendingFriendInvites: [
                                      ...user.friendInvitations,
                                      msg.login,
                                  ],
                              }
                            : user
                    );
                    break;

                case "invited_by":
                    console.log(`invited by "${msg.login}"`);
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  friendInvitations: [
                                      ...user.friendInvitations,
                                      msg.login,
                                  ],
                              }
                            : user
                    );
                    break;

                case "rejected":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                            : user
                    );
                    break;

                case "rejected_by":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                            : user
                    );
                    break;

                case "canceled":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  pendingFriendInvites:
                                      user.pendingFriendInvites.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                            : user
                    );
                    break;

                case "canceled_by":
                    user.set?.((user) =>
                        user
                            ? {
                                  ...user,
                                  friendInvitations:
                                      user.friendInvitations.filter(
                                          (inviterLogin) =>
                                              inviterLogin !== msg.login
                                      ),
                              }
                            : user
                    );
                    break;
            }
        };
    }, [user, ws]);
}
