import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import "../../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkForExistingSession(): Promise<void> {
      try {
        const response = await fetch("/auth/validate", { method: "POST" });
        const result = await response.json();
        if (response.status === 200 && result.redirectTo) {
          return navigate(result.redirectTo);
        }
        setIsLoading(false);
      } catch (_e) {
        setIsLoading(false);
      }
    }

    checkForExistingSession();
  }, [navigate]);

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      {isLoading === false ? <Login /> : <div>Loading...</div>}
    </div>
  );
}
