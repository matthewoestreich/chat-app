import { useAuth } from "@hooks";
import React from "react";
import { useNavigate } from "react-router-dom";
import { sendLogoutRequest } from "@client/auth/authService";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await sendLogoutRequest();
    logout();
    navigate("/");
  }

  return (
    <div>
      <h2>Chat - Protected</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
