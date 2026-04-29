import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { configureApiClient } from "@ito-map/shared";

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);