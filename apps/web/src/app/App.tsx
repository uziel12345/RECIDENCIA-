import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { WelcomePage } from "../features/welcome/WelcomePage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage";
import { useAuthStore } from "../store/auth-store";
import { useAdminAuthStore } from "../store/admin-auth-store";
import { ROUTES } from "../types/routes";

const StudentPage = lazy(async () => {
  const { StudentPage } = await import("../features/student/StudentPage");
  return { default: StudentPage };
});

const VisitorPage = lazy(async () => {
  const { VisitorPage } = await import("../features/visitor/VisitorPage");
  return { default: VisitorPage };
});

const AdminBuildingsPage = lazy(async () => {
  const { AdminBuildingsPage } = await import("../features/admin/pages/AdminBuildingsPage");
  return { default: AdminBuildingsPage };
});

const AdminNavigationPage = lazy(async () => {
  const { AdminNavigationPage } = await import("../features/admin/pages/AdminNavigationPage");
  return { default: AdminNavigationPage };
});

function MapLoadingFallback() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #1e3a8a 100%)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          className="animate-spin"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.12)",
            borderTopColor: "#3b82f6",
            margin: "0 auto 20px",
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: "0.02em",
          }}
        >
          Cargando mapa 3D…
        </p>
      </div>
    </div>
  );
}

function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loadSession, user } = useAdminAuthStore();
  // Token in storage but user not yet hydrated from backend (direct nav / page reload)
  const [verifying, setVerifying] = useState(isAuthenticated && !user);

  useEffect(() => {
    if (!verifying) return;
    void loadSession().finally(() => setVerifying(false));
  }, [verifying, loadSession]);

  if (verifying) return null;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.WELCOME} element={<WelcomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

        {/* Real Admin Auth */}
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        <Route
          path={ROUTES.ADMIN_BUILDINGS}
          element={
            <AdminProtectedRoute>
              <Suspense fallback={null}>
                <AdminBuildingsPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_NAVIGATION}
          element={
            <AdminProtectedRoute>
              <Suspense fallback={<MapLoadingFallback />}>
                <AdminNavigationPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />

        {/* Student View */}
        <Route
          path={ROUTES.STUDENT}
          element={
            <PublicRoute requiresRole="student">
              <Suspense fallback={<MapLoadingFallback />}>
                <StudentPage />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Visitor View */}
        <Route
          path={ROUTES.VISITOR}
          element={
            <PublicRoute requiresRole="visitor">
              <Suspense fallback={<MapLoadingFallback />}>
                <VisitorPage />
              </Suspense>
            </PublicRoute>
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
    default:
      return <Navigate to={ROUTES.WELCOME} replace />;
  }
}
