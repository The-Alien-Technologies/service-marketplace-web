export const locales = ["en", "fr", "sw"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "pavodah-locale";

export const localeMetadata: Record<
  Locale,
  {label: string; shortLabel: string; intlLocale: string}
> = {
  en: {label: "English", shortLabel: "EN", intlLocale: "en-GH"},
  fr: {label: "Français", shortLabel: "FR", intlLocale: "fr-FR"},
  sw: {label: "Kiswahili", shortLabel: "SW", intlLocale: "sw-KE"}
};

export function isLocale(value?: string | null): value is Locale {
  return locales.includes(value as Locale);
}

export function normalizeLocale(value?: string | null): Locale | undefined {
  if (!value) return undefined;

  const baseLocale = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(baseLocale) ? baseLocale : undefined;
}

export function resolveLocale(
  ...candidates: Array<string | null | undefined>
): Locale {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }

  return defaultLocale;
}

export function resolveAcceptLanguage(value?: string | null): Locale {
  if (!value) return defaultLocale;

  const candidates = value
    .split(",")
    .map((part) => {
      const [tag, quality = "q=1"] = part.trim().split(";");
      const weight = Number(quality.replace(/^q=/, "")) || 0;
      return {tag, weight};
    })
    .filter(({weight}) => weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return resolveLocale(...candidates.map(({tag}) => tag));
}
