import {
  defaultLocale,
  localeMetadata,
  locales,
  normalizeLocale,
  type Locale
} from "../i18n/config.ts";

export type {Locale};

export const SUPPORTED_LANGUAGES = locales.map((value) => ({
  value,
  ...localeMetadata[value]
}));

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.find(
  ({value}) => value === defaultLocale
)!;

export function getSupportedLanguage(value?: string | null) {
  const locale = normalizeLocale(value) ?? defaultLocale;
  return SUPPORTED_LANGUAGES.find(({value}) => value === locale)!;
}
