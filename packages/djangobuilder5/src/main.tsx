import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { applyTheme, getInitialTheme } from "@/lib/theme";
import { initAuth } from "@/store/authStore";

applyTheme(getInitialTheme());
initAuth();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
