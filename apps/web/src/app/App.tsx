import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WelcomePage } from "../features/welcome/WelcomePage";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { StudentPage } from "../features/student/StudentPage";
import { VisitorPage } from "../features/visitor/VisitorPage";
import { StaffDashboard } from "../features/staff/StaffDashboard";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage";
import { AdminBuildingsPage } from "../features/admin/pages/AdminBuildingsPage";
import { useAuthStore } from "../store/auth-store";
import { useAdminAuthStore } from "../store/admin-auth-store";
import { ROUTES } from "../types/routes";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({
  children,
  requiresRole,
}: {
  children: React.ReactNode;
  requiresRole?: string;
}) {
  const { user, isAuthenticated } = useAuthStore();

  if (requiresRole && (!isAuthenticated || user?.role !== requiresRole)) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loadSession, isAuthenticated } = useAdminAuthStore();
  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const isValid = await loadSession();

      if (!mounted) return;

      setValidSession(isValid);
      setCheckingSession(false);
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [loadSession]);

  if (checkingSession) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          padding: "24px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "22px",
            padding: "28px",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#0f172a",
            }}
          >
            Validando sesión...
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Estamos verificando tu acceso administrativo.
          </p>
        </section>
      </main>
    );
  }

  if (!validSession || !isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.WELCOME} element={<WelcomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

        {/* Real Admin Auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/buildings"
          element={
            <AdminProtectedRoute>
              <AdminBuildingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Student View */}
        <Route
          path={ROUTES.STUDENT}
          element={
            <PublicRoute requiresRole="student">
              <StudentPage />
            </PublicRoute>
          }
        />

        {/* Visitor View */}
        <Route
          path={ROUTES.VISITOR}
          element={
            <PublicRoute requiresRole="visitor">
              <VisitorPage />
            </PublicRoute>
          }
        />

        {/* Staff Dashboard */}
        <Route
          path={ROUTES.STAFF}
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Mock Admin Dashboard. Se conserva separado del admin real con JWT */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy map route, redirect based on role */}
        <Route path={ROUTES.MAP} element={<MapRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function MapRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  switch (user.role) {
    case "student":
      return <Navigate to={ROUTES.STUDENT} replace />;
    case "visitor":
      return <Navigate to={ROUTES.VISITOR} replace />;
    case "staff":
      return <Navigate to={ROUTES.STAFF} replace />;
    case "admin":
      return <Navigate to={ROUTES.ADMIN} replace />;
    default:
      return <Navigate to={ROUTES.WELCOME} replace />;
  }
}