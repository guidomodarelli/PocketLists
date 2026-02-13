"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./ThemeToggle.module.scss";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "theme";

function getStoredTheme(): ThemeMode | null {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return null;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? "dark";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const buttonLabel = theme === "dark" ? "Activar modo claro" : "Activar modo oscuro";

  const handleToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className={styles["theme-toggle"]} data-testid="theme-toggle">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={buttonLabel}
        title={buttonLabel}
        onClick={handleToggle}
      >
        {theme === "dark" ? <Sun /> : <Moon />}
        <span className="sr-only">{buttonLabel}</span>
      </Button>
    </div>
  );
}
