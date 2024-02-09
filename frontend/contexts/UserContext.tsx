import { User } from "@react-messenger/shared";
import { Dispatch, SetStateAction, createContext } from "react";

export const UserContext = createContext<{
    value: User | null;
    set: Dispatch<SetStateAction<User | string | null>> | null;
}>({
    value: null,
    set: null,
});
