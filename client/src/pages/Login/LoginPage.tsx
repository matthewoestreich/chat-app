import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks";
import Login from "./Login";
import "../../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkForExistingSession(): Promise<void> {
      try {
        const response = await fetch("/auth/auto-login", { method: "POST" });
        const result = await response.json();
        if (response.status === 200 && result.redirectTo) {
          login();
          return navigate(result.redirectTo);
        }
        setIsLoading(false);
      } catch (_e) {
        setIsLoading(false);
      }
    }

    checkForExistingSession();
  }, [navigate, login]);

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      {isLoading === false ? <Login /> : <div>Loading...</div>}
    </div>
  );
}
