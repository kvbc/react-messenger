import { UserContext } from "@/contexts/UserContext";
import { useContext } from "react";
import Loading from "./Loading";

export default function FriendsList() {
    const user = useContext(UserContext);

    return (
        <div className="w-1/5 h-full p-1 from-blue-900 to-purple-900 bg-gradient-to-b rounded-lg">
            <div className="from-slate-800 to-slate-900 bg-gradient-to-b w-full h-full p-2">
                {user == null ? (
                    <div className="flex justify-center items-center h-full">
                        <Loading />
                    </div>
                ) : (
                    <div>test</div>
                )}
            </div>
        </div>
    );
}
