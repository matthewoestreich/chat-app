import { useContext } from "react";
import AuthContext from "../auth/AuthContext";

export default function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
