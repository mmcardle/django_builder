import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Splash } from "@/features/splash/Splash";
import { BuilderPage } from "@/features/builder/BuilderPage";

// Vite sets BASE_URL to the build --base (e.g. "/db5/") so client routing works
// when the app is served under a subpath; "/" in dev.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="flex h-full flex-col">
        <TopNav />
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/build" element={<BuilderPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
