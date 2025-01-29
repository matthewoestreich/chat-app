import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import "../../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  const [shouldRender, setShouldRender] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkForExistingSession() {
      try {
        const response = await fetch("/auth/validate", { method: "POST" });
        const result = await response.json();
        if (response.status === 200 && result.redirectTo) {
          return navigate(result.redirectTo);
        }
        setShouldRender(true);
      } catch (e) {
        setShouldRender(true);
      }
    }

    checkForExistingSession();
  }, [navigate]);

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      {shouldRender === true ? <Login /> : <div>Loading...</div>}
    </div>
  );
}