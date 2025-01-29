import * as React from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from "./pages/Login/LoginPage";
import ChatPage from './pages/Chat/ChatPage';

// Order matters here?
// CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "../public/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
import './app.css';

const App = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

root.render(<App />);
