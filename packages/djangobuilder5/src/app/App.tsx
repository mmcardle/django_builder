import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { ConsentSnackbar } from "@/components/ConsentSnackbar";
import { Splash } from "@/features/splash/Splash";
import { AboutView } from "@/features/about/AboutView";
import { PrivacyPolicy } from "@/features/legal/PrivacyPolicy";
import { BuilderPage } from "@/features/builder/BuilderPage";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { LoginView } from "@/features/auth/LoginView";
import { SignUpView } from "@/features/auth/SignUpView";
import { ResetPasswordView } from "@/features/auth/ResetPasswordView";
import { ActionView } from "@/features/auth/ActionView";
import { UnverifiedView } from "@/features/auth/UnverifiedView";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { isVerified } from "@/domain/firestore/auth";
import { initAnalytics } from "@/lib/analytics";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function Gate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isVerified(user)) return <Navigate to="/unverified" replace />;
  return <>{children}</>;
}

export function App() {
  const authLoaded = useAuthStore((s) => s.authLoaded);
  const user = useAuthStore((s) => s.user);
  const start = useProjectStore((s) => s.start);
  const stop = useProjectStore((s) => s.stop);

  // start/stop the Firestore data subscription with the signed-in user
  useEffect(() => {
    if (user) start(user);
    else stop();
  }, [user, start, stop]);

  // Re-init analytics on mount for a returning user who has already consented.
  useEffect(() => {
    initAnalytics();
  }, []);

  if (!authLoaded) return <div className="flex h-full items-center justify-center text-muted">Loading…</div>;

  return (
    <BrowserRouter basename={basename}>
      <div className="flex h-full flex-col">
        <TopNav />
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/signup" element={<SignUpView />} />
            <Route path="/reset" element={<ResetPasswordView />} />
            <Route path="/action" element={<ActionView />} />
            <Route path="/unverified" element={<UnverifiedView />} />
            <Route path="/projects" element={<Gate><DashboardView /></Gate>} />
            <Route path="/project/:id" element={<Gate><BuilderPage /></Gate>} />
          </Routes>
        </main>
        <ConsentSnackbar />
      </div>
    </BrowserRouter>
  );
}
