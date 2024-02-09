"use client";

import { FaReact } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/contexts/UserContext";
import { User } from "@react-messenger/shared";
import Loading from "@/components/Loading";
import FriendsList from "@/components/FriendsList";
import Chatbox from "@/components/Chatbox";
import StatusBar from "@/components/StatusBar";

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

    function handleAddFriendButtonClicked(friendLogin: string) {
        fetch(`http://localhost:3001/addFriend?login=${friendLogin}`, {
            credentials: "include",
        }).then((res) => {
            console.log(res.status);
            if (res.status !== 200) throw "Status not OK";
            user.set?.((user) =>
                user === null || typeof user === "string"
                    ? user
                    : { ...user, friends: [...user.friends, friendLogin] }
            );
        });
    }

    return (
        <>
            <StatusBar onLogoutButtonClicked={onLogoutButtonClicked} />
            <div className="w-full h-full flex gap-4">
                <FriendsList
                    onAddFriendButtonClicked={handleAddFriendButtonClicked}
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

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const fetchID = String(Math.random());
        setUser(fetchID);
        const controller = new AbortController();
        fetch(
            `http://localhost:3001/login` +
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
                setUser((user) => (user === fetchID ? null : user));
            });
        return () => {
            setUser((user) => (user === fetchID ? null : user));
            controller.abort();
        };
    }, []);

    function handleLoginButtonClicked() {
        router.push("http://localhost:3001/login");
    }

    function handleLogoutButtonClicked() {
        setUser(null);
        fetch(`http://localhost:3001/logout`, {
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
