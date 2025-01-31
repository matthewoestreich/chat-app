import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";

export default function AutoLoginRoutes(): React.JSX.Element | null {
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
    console.log({ from: "AutoLoginRoutes Component", status: "document.cookie && !session", returning: "<div>Loading...</div>", session });
    return <div>Loading...</div>;
  }
  if (document.cookie && session !== null) {
    console.log({ from: "AutoLoginRoutes Component", status: "document.cookie && session !== null", returning: "<Navigate to='/chat' />", session });
    return <Navigate to="/chat" />;
  }
  console.log({ from: "AutoLoginRoutes Component", returning: "<Outlet />", session });
  return <Outlet />;
}
