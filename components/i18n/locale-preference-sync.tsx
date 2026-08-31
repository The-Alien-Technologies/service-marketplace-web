"use client";

import {useEffect, useRef} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import {localeCookieName, normalizeLocale} from "@/i18n/config";
import {useAuthStore} from "@/store/auth-store";

const cookieMaxAge = 60 * 60 * 24 * 365;

export function persistLocaleCookie(locale: string) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${cookieMaxAge}; samesite=lax`;
  document.documentElement.lang = locale;
}

export function LocalePreferenceSync() {
  const locale = useLocale();
  const router = useRouter();
  const {user, hasHydrated} = useAuthStore();
  const synchronizedPreference = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !user) return;

    const preferredLocale = normalizeLocale(user.preferredLanguage);
    if (
      !preferredLocale ||
      preferredLocale === locale ||
      synchronizedPreference.current === preferredLocale
    ) {
      return;
    }

    synchronizedPreference.current = preferredLocale;
    persistLocaleCookie(preferredLocale);
    router.refresh();
  }, [hasHydrated, locale, router, user]);

  return null;
}
