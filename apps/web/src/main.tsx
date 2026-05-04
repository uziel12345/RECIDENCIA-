import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureApiClient } from "@ito-map/shared";

import App from "./app/App";
import "./styles/index.css";

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
  getToken: () => localStorage.getItem("admin_token"),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);