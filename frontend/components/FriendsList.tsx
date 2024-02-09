import { UserContext } from "@/contexts/UserContext";
import { useContext, useRef } from "react";
import Loading from "./Loading";
import Image from "next/image";
import Link from "next/link";

export default function FriendsList({
    onAddFriendButtonClicked,
}: {
    onAddFriendButtonClicked: (friendLogin: string) => void;
}) {
    const user = useContext(UserContext);
    const addFriendLoginRef = useRef<HTMLInputElement>(null);

    function handleAddFriendButtonClicked() {
        const friendLogin = addFriendLoginRef.current?.value;
        if (friendLogin) {
            onAddFriendButtonClicked(friendLogin.trim());
        }
    }

    return (
        <div className="w-1/5 h-full p-1 from-blue-900 to-purple-900 bg-gradient-to-b rounded-lg">
            <div className="from-slate-800 to-slate-900 bg-gradient-to-b w-full h-full p-2">
                {user.value == null ? (
                    <div className="flex justify-center items-center h-full">
                        <Loading />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleAddFriendButtonClicked}
                            className="from-blue-800 to-blue-900 bg-gradient-to-b flex items-center justify-around gap-3 overflow-hidden p-2 h-12 group"
                        >
                            <div className="font-semibold translate-x-[100%] group-hover:translate-x-0 transition-transform">
                                Add Friend
                            </div>
                            <input
                                ref={addFriendLoginRef}
                                className="w-1/2 bg-blue-950 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </button>
                        {user.value.friends.map((friendLogin) => (
                            <div
                                key={friendLogin}
                                className="bg-slate-700 flex items-center gap-3 overflow-hidden p-2"
                            >
                                <Link
                                    href={`https://github.com/${friendLogin}`}
                                    target="_blank"
                                >
                                    <Image
                                        src={`https://github.com/${friendLogin}.png`}
                                        alt={friendLogin}
                                        width={48}
                                        height={48}
                                    />
                                </Link>
                                <div className="flex flex-col">
                                    {friendLogin}
                                    <br />
                                    <div className="text-slate-400 whitespace-nowrap">
                                        This is the last message
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
