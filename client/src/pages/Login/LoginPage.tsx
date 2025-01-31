import React from "react";
import Login from "./Login";
import "../../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  console.log("LoginPage rendering...");

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      <Login />
    </div>
  );
}
