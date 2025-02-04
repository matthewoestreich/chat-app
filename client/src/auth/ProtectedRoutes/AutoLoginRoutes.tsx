import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";
import { LoadingSpinner } from "@components";

/**
 * If a user has a cookie and visits one of these routes, we try to validate the cookie
 * so we can log them in automatically + redirect them. An example would be a logged-
 * in user visiting the login page.
 *
 * This differs fromm ProtectedRoutes because we redirect *to* protected
 * routes, vs *away* from them.
 */
export default function AutoLoginRoutes(): React.JSX.Element | null {
  const { session, validateSession } = useAuth();

  useEffect(() => {
    // If `document.cookie` exists but no session,
    // we need to validate before letting them through.
    if (document.cookie && !session) {
      validateSession();
    }
  }, [validateSession, session]);

  // If the user has a cookie but no session stored in state, validate
  // the cookie to see if we can log them in automatically.
  if (document.cookie && !session) {
    return <LoadingSpinner />;
  }
  // If the user has a cookie and a session in state, it means they are authenticated
  // and we can send them to the protected route.
  // We can safely do this because if the user had a cookie but no session (the `if` above)
  // and the cookie was bad, the backend removes all cookies. Meaning, they would not
  // have a `document.cookie` here.
  if (document.cookie && session) {
    return <Navigate to="/chat" />;
  }
  // If we make it here, it means the user has to authenticate manually.
  return <Outlet />;
}
