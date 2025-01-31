import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";

export default function PrivateRoute(): React.JSX.Element {
  const { session, validateSession } = useAuth();

  useEffect(() => {
    // If `document.cookie` exists, we need to validate before letting them through.
    if (document.cookie && !session) {
      (async (): Promise<void> => {
        await validateSession();
      })();
    }
  }, [validateSession, session]);

  if (document.cookie && !session) {
    console.log({ from: "ProtectedRoutes Component", status: "document.cookie && !session", returning: "<div>Loading...</div>", session });
    return <div>Loading...</div>;
  }
  if (!document.cookie && !session) {
    console.log({ from: "ProtectedRoutes Component", status: "!document.cookie && !session", returning: "<Navigate to='/' />", session });
    return <Navigate to="/" />;
  }
  console.log({ from: "ProtectedRoutes Component", returning: "<Outlet />", session });
  return <Outlet />;
}
