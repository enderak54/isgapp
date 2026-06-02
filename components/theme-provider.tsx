"use client";

import { useEffect, createContext, useContext, useState, useCallback } from "react";
import { safeSetTheme } from "@/lib/dom";

interface Theme {
  mode: string;
  color: string;
  font: string;
  size: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  saveTheme: (t: Theme) => void;
}

const defaultTheme: Theme = { mode: "light", color: "", font: "", size: "normal" };
const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
  saveTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [ready, setReady] = useState(false);

  const applyAndPersist = useCallback((t: Theme) => {
    safeSetTheme(document.documentElement, t);
    localStorage.setItem("isg_theme", JSON.stringify(t));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("isg_theme") || "{}");
      const t: Theme = {
        mode: saved.mode || "light",
        color: saved.color || "",
        font: saved.font || "",
        size: saved.size || "normal",
      };
      setThemeState(t);
      applyAndPersist(t);
    } catch {}
    setReady(true);
  }, [applyAndPersist]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyAndPersist(t);
  }, [applyAndPersist]);

  const saveTheme = useCallback(async (t: Theme) => {
    applyAndPersist(t);
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("ayarlar").upsert(
        { key: "theme", value: JSON.stringify(t), type: "theme" },
        { onConflict: "key" }
      );
    } catch {}
  }, [applyAndPersist]);

  if (!ready) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}