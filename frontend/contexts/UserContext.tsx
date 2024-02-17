import { User } from "@react-messenger/shared";
import { Dispatch, SetStateAction, createContext } from "react";

export const UserContext = createContext<{
    value: User | undefined;
    set: Dispatch<SetStateAction<User | undefined>> | undefined;
}>({
    value: undefined,
    set: undefined,
});
