import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { configureApiClient } from "@ito-map/shared";

// TODO: remove once @react-three/fiber switches from THREE.Clock to THREE.Timer
// R3F 9.5.0 creates new THREE.Clock() internally; Three.js r183 deprecated Clock.
const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
  _warn(...args);
};

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);