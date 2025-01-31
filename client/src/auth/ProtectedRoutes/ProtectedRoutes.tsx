import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";
//import { LoadingSpinner } from "@components";

/**
 * Validates session cookie when visiting one of these routes.
 *
 * This differs fromm AutoLoginRoutes because we redirect *away*
 * from protected routes, vs *to* them.
 */
export default function PrivateRoute(): React.JSX.Element {
  const { session, validateSession } = useAuth();

  useEffect(() => {
    // If `document.cookie` exists but no session in state,
    // we need to validate before letting them through.
    if (document.cookie && !session) {
      (async (): Promise<void> => {
        await validateSession();
      })();
    }
  }, [validateSession, session]);

  // If user has a cookie but no session stored
  // in our state, we need to validate the cookie.
  if (document.cookie && !session) {
    console.log({ from: "ProtectedRoutes", action: "Loading" });
    return <div>Loading...</div>;
  }
  // If there is no cookie and no session, it
  // means the user has to authenticate manually.
  if (!document.cookie && !session) {
    console.log({ from: "ProtectedRoutes", action: "<Navigate to='/' />" });
    return <Navigate to="/" />;
  }
  // If there is a cookie (would have been verified
  // by this point) and there is a session let the
  // "request" continue along the route.
  console.log({
    from: "ProtectedRoutes",
    action: "<Outlet /> : has a valid cookie and valid session! Proceeding to protected route!",
    cookie: document.cookie,
    session,
  });
  return <Outlet />;
}
