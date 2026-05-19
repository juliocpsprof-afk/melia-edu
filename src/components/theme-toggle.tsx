"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    return (
      <div className="h-11 w-[92px] rounded-full border border-white/10 bg-slate-900/60" />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="
        group relative flex h-11 w-[92px] items-center rounded-full
        border border-white/10 bg-slate-950/70 p-1
        shadow-[0_0_22px_rgba(124,58,237,0.28)]
        backdrop-blur-xl transition-all duration-500
        hover:scale-[1.03] hover:border-violet-400/50
        hover:shadow-[0_0_30px_rgba(124,58,237,0.42)]
        active:scale-95
        dark:bg-slate-950/70
      "
    >
      <span
        className={`
          absolute inset-0 rounded-full transition-all duration-500
          ${
            isDark
              ? "bg-gradient-to-r from-slate-950 via-violet-950/70 to-blue-950/70"
              : "bg-gradient-to-r from-cyan-100 via-white to-violet-100"
          }
        `}
      />

      <span
        className={`
          relative z-10 flex h-9 w-9 items-center justify-center rounded-full
          shadow-lg transition-all duration-500 ease-out
          ${
            isDark
              ? "translate-x-[46px] bg-slate-900 text-violet-200 shadow-violet-500/30"
              : "translate-x-0 bg-white text-amber-500 shadow-cyan-500/20"
          }
        `}
      >
        {isDark ? (
          <Moon className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12" />
        ) : (
          <Sun className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
        )}
      </span>

      <span
        className={`
          absolute left-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full
          transition-all duration-500
          ${isDark ? "bg-violet-300/70 opacity-100" : "bg-amber-300/80 opacity-100"}
        `}
      />

      <span
        className={`
          absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full
          transition-all duration-500
          ${isDark ? "bg-blue-300/70 opacity-100" : "bg-cyan-300/80 opacity-100"}
        `}
      />
    </button>
  );
}