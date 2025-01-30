import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks";
import { sendAutoLoginCheckRequest } from "@client/auth/authService";
import Login from "./Login";
import "../../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkForExistingSession(): Promise<void> {
      try {
        const result = await sendAutoLoginCheckRequest();
        if (!result.ok || result.redirectTo === "") {
          return setIsLoading(false);
        }
        login();
        navigate(result.redirectTo);
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
