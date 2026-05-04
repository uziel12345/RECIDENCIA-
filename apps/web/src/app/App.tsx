import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WelcomePage } from "../features/welcome/WelcomePage";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { StudentPage } from "../features/student/StudentPage";
import { VisitorPage } from "../features/visitor/VisitorPage";
import { StaffDashboard } from "../features/staff/StaffDashboard";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { useAuthStore } from "../store/auth-store";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.WELCOME} element={<WelcomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

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

        {/* Admin Dashboard */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy map route - redirect based on role */}
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
