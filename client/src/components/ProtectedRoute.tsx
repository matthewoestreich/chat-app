import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks";

export default function ProtectedRoute(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
}
