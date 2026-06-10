import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { WelcomePage } from "../features/welcome/WelcomePage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage";
import { useAuthStore } from "../store/auth-store";
import { useAdminAuthStore } from "../store/admin-auth-store";
import { ROUTES } from "../types/routes";
import { ROLE_PERMISSIONS, type RolePermissions } from "@ito-map/shared";

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

const AdminCategoriesPage = lazy(async () => {
  const { AdminCategoriesPage } = await import("../features/admin/pages/AdminCategoriesPage");
  return { default: AdminCategoriesPage };
});

const AdminNavigationPage = lazy(async () => {
  const { AdminNavigationPage } = await import("../features/admin/pages/AdminNavigationPage");
  return { default: AdminNavigationPage };
});

const AdminUsersPage = lazy(async () => {
  const { AdminUsersPage } = await import("../features/admin/pages/AdminUsersPage");
  return { default: AdminUsersPage };
});

const AdminStudentLocationPage = lazy(async () => {
  const { AdminStudentLocationPage } = await import(
    "../features/admin/pages/AdminStudentLocationPage"
  );
  return { default: AdminStudentLocationPage };
});

const AdminProfessorLocationPage = lazy(async () => {
  const { AdminProfessorLocationPage } = await import(
    "../features/admin/pages/AdminProfessorLocationPage"
  );
  return { default: AdminProfessorLocationPage };
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
  permission,
}: {
  children: React.ReactNode;
  permission?: keyof RolePermissions;
}) {
  const { isAuthenticated, loadSession, user } = useAdminAuthStore();
  // On reload, Zustand memory is cleared; verify cookie with server before rendering
  const [verifying, setVerifying] = useState(!user);

  useEffect(() => {
    if (!verifying) return;
    void loadSession().finally(() => setVerifying(false));
  }, [verifying, loadSession]);

  if (verifying) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  if (permission && !ROLE_PERMISSIONS[user.role]?.[permission]) {
    return (
      <Navigate
        to={
          permission === "can_view_buildings"
            ? ROUTES.ADMIN_LOGIN
            : ROUTES.ADMIN_BUILDINGS
        }
        replace
      />
    );
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
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

        {/* Real Admin Auth */}
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        <Route
          path={ROUTES.ADMIN_BUILDINGS}
          element={
            <AdminProtectedRoute permission="can_view_buildings">
              <Suspense fallback={null}>
                <AdminBuildingsPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_CATEGORIES}
          element={
            <AdminProtectedRoute permission="can_view_buildings">
              <Suspense fallback={null}>
                <AdminCategoriesPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_NAVIGATION}
          element={
            <AdminProtectedRoute permission="can_edit_navigation">
              <Suspense fallback={<MapLoadingFallback />}>
                <AdminNavigationPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <AdminProtectedRoute permission="can_manage_admin_users">
              <Suspense fallback={null}>
                <AdminUsersPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_STUDENT_LOCATION}
          element={
            <AdminProtectedRoute permission="can_view_student_location">
              <Suspense fallback={null}>
                <AdminStudentLocationPage />
              </Suspense>
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_PROFESSOR_LOCATION}
          element={
            <AdminProtectedRoute permission="can_view_professor_location">
              <Suspense fallback={null}>
                <AdminProfessorLocationPage />
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
