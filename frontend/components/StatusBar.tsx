import { UserContext } from "@/contexts/UserContext";
import { useContext } from "react";
import Loading from "./Loading";
import Image from "next/image";

export default function StatusBar({
    onLogoutButtonClicked,
}: {
    onLogoutButtonClicked: () => void;
}) {
    const user = useContext(UserContext);

    return (
        <div className="w-full">
            {user.value == null ? (
                <div className="flex justify-center items-center">
                    <Loading />
                </div>
            ) : (
                <div className="flex items-center h-full">
                    <div className="w-1/2 flex items-center gap-3">
                        <Image
                            src={user.value.avatar_url}
                            alt="avatar"
                            width={64}
                            height={64}
                            className="rounded-full"
                        />
                        <div className="text-xl font-semibold">
                            {user.value.login}
                        </div>
                    </div>
                    <div className="w-1/2 flex justify-end h-full items-center">
                        <button
                            onClick={onLogoutButtonClicked}
                            className="bg-red-500 rounded-xl text-lg font-semibold w-32 h-2/3 hover:text-red-500 hover:bg-white"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
