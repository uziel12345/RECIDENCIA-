export function AppFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "var(--color-border)";
  const titleColor = isDark ? "#f5f5f5" : "var(--color-text)";
  const subtitleColor = isDark ? "rgba(255,255,255,0.45)" : "var(--color-text-subtle)";

  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "12px 16px",
        borderTop: `1px solid ${borderColor}`,
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
            color: titleColor,
            letterSpacing: "0.01em",
          }}
        >
          Instituto Tecnológico de Oaxaca
        </div>
        <div
          style={{
            fontSize: 10,
            color: subtitleColor,
            marginTop: 1,
          }}
        >
          Mapa 3D del Campus
        </div>
      </div>
    </footer>
  );
}
