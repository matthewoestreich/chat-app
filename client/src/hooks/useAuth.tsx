import { useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { AuthContextValue } from "@client/types";

export default function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
