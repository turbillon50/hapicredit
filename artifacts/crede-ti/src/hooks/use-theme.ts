import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "credeti_theme";

function current(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

/** Lee/escribe el tema y lo aplica a <html data-theme>. El valor inicial
 *  ya lo fija el script inline de index.html (sin parpadeo). */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== "undefined" ? current() : "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState(t => (t === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return { theme, toggle, setTheme };
}
