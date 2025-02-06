import { useContext } from "react";
import { ChatContext } from "@pages/Chat/context";
import { ChatContextValue } from "@pages/Chat/context";

export default function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider!");
  }
  return context;
}
