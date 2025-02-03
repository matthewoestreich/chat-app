import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, ChatPage } from "@pages";
import { ProtectedRoutes, AutoLoginRoutes } from "@client/auth/ProtectedRoutes";
import AuthProvider from "@client/auth/AuthProvider";
import ThemeProvider from "@client/theme/ThemeProvider";
import WebSocketeerProvider from "./ws/WebSocketeerProvider";
import { WebSocketEvents } from "./ws";

import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../public/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <Router>
        <WebSocketeerProvider<WebSocketEvents>>
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
        </WebSocketeerProvider>
      </Router>
    </ThemeProvider>
  );
}
