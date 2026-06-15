export function AppFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "12px 16px",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.08)"}`,
        flexShrink: 0,
      }}
    >
      <img
        src="/ICONO-TEC.jpeg"
        alt="ITO"
        style={{ width: 32, height: 32, objectFit: "contain" }}
      />
      <div style={{ lineHeight: 1.3 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isDark ? "#f5f5f5" : "#0a0a0a",
            letterSpacing: "0.01em",
          }}
        >
          Instituto Tecnológico de Oaxaca
        </div>
        <div
          style={{
            fontSize: 10,
            color: isDark ? "rgba(255,255,255,0.45)" : "#a3a3a3",
            marginTop: 1,
          }}
        >
          Mapa 3D del Campus
        </div>
      </div>
    </footer>
  );
}
