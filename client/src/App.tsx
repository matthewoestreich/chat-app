import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoutes, AutoLoginRoutes } from "@client/auth/ProtectedRoutes";
import { LoginPage, ChatPage } from "@pages";
import AuthProvider from "@client/auth/AuthProvider";

import "bootstrap/dist/css/bootstrap.min.css";
import "../public/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
import "./app.css";

export default function App(): React.JSX.Element {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<AutoLoginRoutes />}>
            <Route path="/" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoutes />}>
            <Route path="/chat" element={<ChatPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
