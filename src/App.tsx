import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./lib/api";
import { getSessionId, getSource } from "./lib/analytics";
import { PublicLayout } from "./components/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { ApplyPage } from "./pages/ApplyPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminApplicationsPage } from "./pages/admin/AdminApplicationsPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!location.pathname.startsWith("/admin")) {
      void api.trackEvent({
        name: "page_view",
        path: location.pathname,
        source: getSource(),
        sessionId: getSessionId(),
      }).catch(() => undefined);
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <PageTracker />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="content" element={<AdminContentPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
