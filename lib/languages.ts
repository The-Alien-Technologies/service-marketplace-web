export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English", shortLabel: "EN" },
] as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

export function getSupportedLanguage(value?: string | null) {
  const normalizedValue = value?.trim().toLowerCase();

  return (
    SUPPORTED_LANGUAGES.find(
      (language) => language.value === normalizedValue,
    ) ?? DEFAULT_LANGUAGE
  );
}
