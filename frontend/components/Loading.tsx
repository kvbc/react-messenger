import { IoReload } from "react-icons/io5";

export default function Loading() {
    return (
        <div className="animate-pulse">
            <IoReload className="text-2xl animate-spin" />
        </div>
    );
}
