import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";
import { LoadingSpinner } from "@components";

/**
 * Validates session cookie when visiting one of these routes.
 *
 * This differs fromm AutoLoginRoutes because we redirect *away*
 * from protected routes, vs *to* them.
 *
 * We use `attemptedValidation` field in state bc we are using http only cookies. This means we cannot
 * check for a cookie client-side and must rely on the server for any checks.
 */
export default function PrivateRoute(): React.JSX.Element {
  const { session, validateSession, attemptedValidation } = useAuth();

  useEffect(() => {
    // If no session exists try to validate the cookie (we don't know if
    // one exists at this point, but try to validate in case one exists).
    if (!attemptedValidation && !session) {
      // `attemptedValidation` will be set within `validateSession()`
      validateSession();
    }
  }, [validateSession, attemptedValidation, session]);

  // If validation has not been attempted and no session stored
  // in our state, try to validate the cookie (we don't know if one even exists, though).
  // We can't just check for a cookie on the client bc we are using http only cookies.
  // Therefore, we use `attemptedValidation` instead.
  if (!attemptedValidation && !session) {
    return <LoadingSpinner />;
  }
  // If validation was attempted but no session, it means the user has to authenticate manually.
  if (attemptedValidation && !session) {
    return <Navigate to="/" />;
  }
  // If validation was attempted and there is a session let the "request" continue along the route.
  return <Outlet />;
}
