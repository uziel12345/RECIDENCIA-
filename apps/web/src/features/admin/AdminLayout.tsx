import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { ROUTES } from "../../types/routes";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAdminAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 860);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 860);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    logout();
    void navigate(ROUTES.ADMIN_LOGIN, { replace: true });
  }

  return (
    <div style={styles.shell}>
      {(!isMobile || sidebarOpen) ? (
        <div style={isMobile ? styles.mobileSidebar : undefined}>
          <AdminSidebar
            role={user?.role}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      ) : null}

      <main style={styles.content}>
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen((current) => !current)}
          onLogout={handleLogout}
        />
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#f8fafc",
    color: "#0f172a",
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: "28px",
    boxSizing: "border-box",
  },
  mobileSidebar: {
    position: "fixed",
    inset: "0 auto 0 0",
    zIndex: 20,
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.25)",
  },
};
