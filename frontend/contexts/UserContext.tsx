import { PublicUser } from "@react-messenger/shared";
import { createContext } from "react";

export const UserContext = createContext<PublicUser | null>(null);
