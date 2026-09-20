"use client";

import {useState, useTransition} from "react";
import {Check, ChevronDown, Globe, Loader2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {toast} from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {apiService} from "@/lib/api";
import {SUPPORTED_LANGUAGES, type Locale} from "@/lib/languages";
import {useAuthStore} from "@/store/auth-store";
import {cn} from "@/lib/utils";
import {persistLocaleCookie} from "./locale-preference-sync";

interface LanguageSwitcherProps {
  variant?: "header" | "dashboard";
  align?: "start" | "center" | "end";
  className?: string;
}

export function LanguageSwitcher({
  variant = "header",
  align = "end",
  className
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("Language");
  const {user, isAuthenticated, setUser} = useAuthStore();
  const [savingLocale, setSavingLocale] = useState<Locale | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const current =
    SUPPORTED_LANGUAGES.find(({value}) => value === locale) ??
    SUPPORTED_LANGUAGES[0];

  const changeLocale = async (nextLocale: Locale) => {
    if (nextLocale === locale || savingLocale) return;

    const previousUser = user;
    setSavingLocale(nextLocale);
    persistLocaleCookie(nextLocale);

    if (isAuthenticated && user) {
      setUser({...user, preferredLanguage: nextLocale});
    }

    startTransition(() => router.refresh());

    if (!isAuthenticated || !user) {
      setSavingLocale(null);
      return;
    }

    try {
      const {user: updatedUser} = await apiService.updateUserProfile({
        preferredLanguage: nextLocale
      });
      setUser(updatedUser);
    } catch {
      persistLocaleCookie(locale);
      setUser(previousUser);
      toast.error(t("changeFailed"));
      startTransition(() => router.refresh());
    } finally {
      setSavingLocale(null);
    }
  };

  const triggerContent = (
    <>
      {isRefreshing || savingLocale ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Globe className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      <span className="text-sm font-medium">{current.shortLabel}</span>
      <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "dashboard" ? (
          <Button
            variant="ghost"
            className={cn(
              "flex min-w-fit items-center gap-1 px-2 font-normal text-gray-600 hover:text-gray-900 sm:px-3",
              className
            )}
            aria-label={`${t("label")}: ${current.label}`}
          >
            {triggerContent}
          </Button>
        ) : (
          <button
            type="button"
            className={cn(
              "flex min-h-11 min-w-fit cursor-pointer items-center gap-1 text-gray-700 hover:text-green-600",
              className
            )}
            aria-label={`${t("label")}: ${current.label}`}
          >
            {triggerContent}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-40">
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onSelect={() => void changeLocale(language.value)}
            disabled={Boolean(savingLocale)}
            className="flex min-h-11 items-center justify-between gap-4"
          >
            <span lang={language.value}>{language.label}</span>
            {language.value === locale && (
              <Check className="h-4 w-4 text-green-700" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
