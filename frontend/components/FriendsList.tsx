import { UserContext } from "@/contexts/UserContext";
import { useContext, useRef } from "react";
import Loading from "./Loading";
import Image from "next/image";
import Link from "next/link";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import { BiCheck, BiX } from "react-icons/bi";

export default function FriendsList({
    onInviteFriendButtonClicked,
    onAcceptFriendInviteButtonClicked,
    onRejectFriendInviteButtonClicked,
}: {
    onInviteFriendButtonClicked: (friendLogin: string) => void;
    onAcceptFriendInviteButtonClicked: (inviterLogin: string) => void;
    onRejectFriendInviteButtonClicked: (inviterLogin: string) => void;
}) {
    const user = useContext(UserContext);
    const inviteFriendLoginRef = useRef<HTMLInputElement>(null);

    function handleInviteFriendButtonClicked() {
        const friendLogin = inviteFriendLoginRef.current?.value;
        if (friendLogin) {
            onInviteFriendButtonClicked(friendLogin.trim());
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
                            onClick={handleInviteFriendButtonClicked}
                            className="from-blue-800 to-blue-900 bg-gradient-to-b flex items-center justify-around gap-3 overflow-hidden p-2 h-12 group"
                        >
                            <div className="font-semibold translate-x-[75%] group-hover:translate-x-0 transition-transform">
                                Invite Friend
                            </div>
                            <input
                                ref={inviteFriendLoginRef}
                                className="w-1/2 bg-blue-950 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </button>
                        {user.value.friendInvitations.length > 0 && (
                            <div className="flex w-full justify-center items-center gap-3 text-slate-500 ">
                                <hr className="w-1/3 border-slate-500" />
                                Invites
                                <hr className="w-1/3 border-slate-500" />
                            </div>
                        )}
                        {user.value.friendInvitations.map((inviterLogin) => (
                            <div
                                key={inviterLogin}
                                className="bg-slate-700 flex items-center gap-3 overflow-hidden p-2"
                            >
                                <div className="flex items-center gap-3 w-1/2">
                                    <Link
                                        href={`https://github.com/${inviterLogin}`}
                                        target="_blank"
                                    >
                                        <Image
                                            src={`https://github.com/${inviterLogin}.png`}
                                            alt={inviterLogin}
                                            width={48}
                                            height={48}
                                        />
                                    </Link>
                                    {inviterLogin}
                                </div>
                                <div className="w-1/2 flex justify-end items-center gap-3">
                                    <button
                                        className="group"
                                        onClick={() =>
                                            onAcceptFriendInviteButtonClicked(
                                                inviterLogin
                                            )
                                        }
                                    >
                                        <IoCheckmarkCircle className="text-2xl text-green-400 group-hover:text-4xl transition-all duration-300" />
                                    </button>
                                    <button
                                        className="group"
                                        onClick={() =>
                                            onRejectFriendInviteButtonClicked(
                                                inviterLogin
                                            )
                                        }
                                    >
                                        <IoCloseCircle className="text-2xl text-red-400 group-hover:text-4xl transition-all duration-300" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {user.value.friendInvitations.length > 0 && (
                            <div className="flex w-full justify-center items-center gap-3 text-slate-500 ">
                                <hr className="w-1/3 border-slate-500" />
                                Friends
                                <hr className="w-1/3 border-slate-500" />
                            </div>
                        )}
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
