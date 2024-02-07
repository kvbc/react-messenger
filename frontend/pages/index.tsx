"use client";

import { FaReact } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/contexts/UserContext";
import { PublicUser } from "@react-messenger/shared";
import Loading from "@/components/Loading";

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

function HomeApp() {
    const user = useContext(UserContext);
    return user ? user.login : "null??";
}

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<PublicUser | null | undefined>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code != null) {
            setUser(undefined);
            fetch(`http://localhost:3001/login?code=${code}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            })
                .then((res) => {
                    if (res.status !== 200) throw "Status not OK";
                    return res.json();
                })
                .then((data) => {
                    const user: PublicUser = data.user;
                    setUser(user);
                })
                .catch((err) => {
                    setUser(null);
                });
        }
    }, []);

    function handleLoginButtonClicked() {
        router.push("http://localhost:3001/login");
    }

    return (
        <div className="min-h-screen from-slate-800 to-slate-950 bg-gradient-to-b text-white flex flex-col items-center justify-center gap-6">
            {/* title */}
            <div className="flex text-4xl font-semibold justify-center items-center gap-2">
                <FaReact className="animate-spin-slow text-blue-400" />
                <h1>React Messenger</h1>
            </div>

            {user === undefined && <Loading />}
            {user !== undefined && (
                <UserContext.Provider value={user}>
                    {user === null ? (
                        <HomeLogin
                            onLoginButtonClicked={handleLoginButtonClicked}
                        />
                    ) : (
                        <HomeApp />
                    )}
                </UserContext.Provider>
            )}
        </div>
    );
}
