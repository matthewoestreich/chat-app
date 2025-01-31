import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const mountElementId = "app";
const mountElement = document.getElementById(mountElementId);
if (!mountElement) {
  throw new Error(`Unable to start app! Mount element with ID "${mountElementId}" not found!`);
}

const root = ReactDOM.createRoot(mountElement);
root.render(<App />);
