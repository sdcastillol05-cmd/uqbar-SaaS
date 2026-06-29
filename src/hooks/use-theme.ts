"use client";

import { useState, useCallback, useEffect } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("uq-theme") as Theme) || "dark";
}

export function useTheme() {
  // Lazy initializer reads localStorage once, on first render —
  // no setState-in-effect needed for the initial value.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // This effect only synchronizes the DOM (an external system),
  // it never calls setState — so it's exempt from the lint rule.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("uq-theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
