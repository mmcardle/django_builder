import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { currentTheme, toggleTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme());
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(toggleTheme())}
    >
      <span aria-hidden>{theme === "dark" ? "☾" : "☀"}</span>
    </Button>
  );
}
