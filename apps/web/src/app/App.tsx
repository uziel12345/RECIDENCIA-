import { useState } from "react";
import { CampusViewer } from "../components/viewer/CampusViewer";

export default function App() {
  const [open, setOpen] = useState(false);

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? (open ? 0 : "-100%") : 0,
          top: 0,
          width: isMobile ? "85%" : "320px",
          height: "100%",
          background: "#ffffff",
          zIndex: 20,
          transition: "0.3s",
          overflowY: "auto",
          boxShadow: isMobile
            ? "0 0 20px rgba(0,0,0,0.2)"
            : "none",
        }}
      >
        <div style={{ padding: "16px" }}>
          <h2 style={{ marginBottom: "12px" }}>Mapa ITO</h2>

          <p style={{ fontSize: "14px", color: "#555" }}>
            Selecciona un edificio para ver información o trazar ruta.
          </p>
        </div>
      </div>

      {/* OVERLAY (solo móvil) */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 10,
          }}
        />
      )}

      {/* BOTÓN MENÚ */}
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 30,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#111827",
            color: "#fff",
            fontSize: "18px",
          }}
        >
          ☰
        </button>
      )}

      {/* MAPA */}
      <div style={{ flex: 1 }}>
        <CampusViewer />
      </div>
    </div>
  );
}