"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { themes } from "@/lib/theme";
import { useTranslations } from "next-intl";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const t = useTranslations("Common");
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center
        text-gray-700 hover:text-green-600
        transition-colors
        focus-visible:outline-none
        ${className}
      `}
      aria-label={t("toggleTheme")}
    >
      {theme === themes.light ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
