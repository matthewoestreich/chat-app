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
 *
 * We use `attemptedValidation` field in state bc we are using http only cookies. This means we cannot
 * check for a cookie client-side and must rely on the server for any checks.
 */
export default function AutoLoginRoutes(): React.JSX.Element | null {
  const { session, validateSession, attemptedValidation } = useAuth();

  useEffect(() => {
    // If no session exists in state, try to validate cookie (even though we
    // don't know if one exists).
    if (!attemptedValidation && !session) {
      // `attemptedValidation` is set within `validateSession()`
      validateSession();
    }
  }, [validateSession, attemptedValidation, session]);

  // If validation has not been attempted and no session stored in state, try to validate
  // the users cookie (at this point we aren't even sure if they have one) to see if we
  // can log them in automatically.
  //
  // We can't check for a cookie bc we are using http only cookies, which cannot be accessed
  // client-side.
  if (!attemptedValidation && !session) {
    return <LoadingSpinner />;
  }
  // If we attempted validation and a session exists in state, it means the cookie was validated
  // successfully, and we can send them to the protected route.
  if (attemptedValidation && session) {
    return <Navigate to="/chat" />;
  }
  // If we make it here, it means the user has to authenticate manually.
  return <Outlet />;
}
