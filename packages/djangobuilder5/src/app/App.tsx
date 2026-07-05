import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Splash } from "@/features/splash/Splash";
import { BuilderPage } from "@/features/builder/BuilderPage";

export function App() {
  return (
    <BrowserRouter>
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
