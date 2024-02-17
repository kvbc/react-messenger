"use client";

import { FaReact } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { UserContext } from "@/contexts/UserContext";
import {
    BackendQuery,
    BackendResponseError,
    BackendResponseLogin,
    User,
    WEBSOCKET_URL,
    WebsocketMessage,
    getBackendURL,
} from "@react-messenger/shared";
import FriendsList from "@/components/FriendsList";
import Chatbox from "@/components/Chatbox";
import StatusBar from "@/components/StatusBar";
import useWebSocket from "react-use-websocket";
import { QueryFunctionContext, useQuery } from "react-query";

// const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL!;
// const WEBSOCKET_URL: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;

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
        fetchFromBackend({
            endpoint: "inviteFriend",
            params: { login: inviteeLogin },
        });
    }

    function handleAcceptFriendInviteButtonClicked(inviterLogin: string) {
        fetchFromBackend({
            endpoint: "acceptFriendInvite",
            params: { login: inviterLogin },
        });
    }

    function handleRejectFriendInviteButtonClicked(inviterLogin: string) {
        fetchFromBackend({
            endpoint: "rejectFriendInvite",
            params: { login: inviterLogin },
        });
    }

    function handleCancelFriendInviteButtonClicked(inviteeLogin: string) {
        fetchFromBackend({
            endpoint: "cancelFriendInvite",
            params: { login: inviteeLogin },
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
    } = useQuery<User, BackendResponseError>({
        queryKey: "user",
        retry: (_, err) => err.retry,
        queryFn: (ctx) => {
            const urlParams = new URLSearchParams(window.location.search);
            const accessCode = urlParams.get("code");
            return fetchFromBackend(
                {
                    endpoint: "login",
                    params: {
                        code: accessCode,
                        noRedirect: accessCode === null,
                    },
                },
                ctx
            )
                .then((res) => {
                    console.log(`Login status: ${res.status}`);
                    return res.json();
                })
                .then((data: BackendResponseLogin) => {
                    return data.user;
                });
        },
    });

    useEffect(() => {
        setUser(userData);
    }, [userData]);

    function handleLoginButtonClicked() {
        router.push(getBackendURL("login"));
    }

    function handleLogoutButtonClicked() {
        fetchFromBackend("logout").then(() => {
            refetchUser();
        });
    }

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

function fetchFromBackend(
    query: BackendQuery,
    queryContext: QueryFunctionContext | null = null
) {
    return fetch(getBackendURL(query), {
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
        signal: queryContext?.signal,
    }).then((res) => {
        if (res.status === 200) return res;
        return res.json().then((err: BackendResponseError) => {
            // window.alert(err.message ?? "Unknown Server Error");
            console.error(err.message ?? "Unknown Server Error");
            throw err;
        });
    });
}

/*
 *
 * This is a mess
 * TODO: Clean-up
 *
 */

function useWebsocketConnection() {
    const user = useContext(UserContext);
    const [ws, _setWS] = useState<WebSocket | null>(null);

    function setWS(
        ws_or_cb:
            | (WebSocket | null)
            | ((ws: WebSocket | null) => WebSocket | null)
    ) {
        function closeOld(ws: WebSocket | null, newWS: WebSocket | null) {
            if (ws && !newWS) ws.close();
            return newWS;
        }
        if (typeof ws_or_cb === "function")
            _setWS((ws) => closeOld(ws, ws_or_cb(ws)));
        else _setWS((ws) => closeOld(ws, ws_or_cb));
    }

    useEffect(() => {
        setWS((ws) => {
            if (!user.value) return null;
            console.log(WEBSOCKET_URL);
            return ws ?? new WebSocket(WEBSOCKET_URL);
        });
    }, [user]);

    useEffect(() => {
        if (ws === null) return;

        ws.onerror = console.error;
        ws.onmessage = (strMsg: MessageEvent<string>) => {
            const msg: WebsocketMessage = JSON.parse(strMsg.data);

            switch (msg.event) {
                case "accepted":
                    removeFriendInvite();
                    addFriend();
                    break;

                case "accepted_by":
                    removePendingFriendInvite();
                    addFriend();
                    break;

                case "invited":
                    addPendingFriendInvite();
                    break;

                case "invited_by":
                    addFriendInvite();
                    break;

                case "canceled_by":
                case "rejected":
                    removeFriendInvite();
                    break;

                case "canceled":
                case "rejected_by":
                    removePendingFriendInvite();
                    break;
            }

            function removeFriendInvite() {
                setUser((user) => ({
                    ...user,
                    friendInvitations: user.friendInvitations.filter(
                        (inviterLogin) => inviterLogin !== msg.login
                    ),
                }));
            }

            function removePendingFriendInvite() {
                setUser((user) => ({
                    ...user,
                    pendingFriendInvites: user.pendingFriendInvites.filter(
                        (inviterLogin) => inviterLogin !== msg.login
                    ),
                }));
            }

            function addFriendInvite() {
                setUser((user) => ({
                    ...user,
                    friendInvitations: [...user.friendInvitations, msg.login],
                }));
            }

            function addPendingFriendInvite() {
                setUser((user) => ({
                    ...user,
                    pendingFriendInvites: [
                        ...user.pendingFriendInvites,
                        msg.login,
                    ],
                }));
            }

            function addFriend() {
                setUser((user) => ({
                    ...user,
                    friends: [...user.friends, msg.login],
                }));
            }

            function setUser(cb: (user: User) => User) {
                user.set?.((user) => (user ? cb(user) : user));
            }
        };
    }, [user, ws]);
}
