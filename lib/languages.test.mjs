import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LANGUAGE,
  getSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from "./languages.ts";

test("English, French, and Swahili are supported", () => {
  assert.deepEqual(SUPPORTED_LANGUAGES, [
    {
      value: "en",
      label: "English",
      shortLabel: "EN",
      intlLocale: "en-GH",
    },
    {
      value: "fr",
      label: "Français",
      shortLabel: "FR",
      intlLocale: "fr-FR",
    },
    {
      value: "sw",
      label: "Kiswahili",
      shortLabel: "SW",
      intlLocale: "sw-KE",
    },
  ]);
  assert.equal(DEFAULT_LANGUAGE.value, "en");
});

test("regional preferences normalize and unsupported values fall back", () => {
  assert.equal(getSupportedLanguage("en").value, "en");
  assert.equal(getSupportedLanguage("en-GB").value, "en");
  assert.equal(getSupportedLanguage("fr-FR").value, "fr");
  assert.equal(getSupportedLanguage("sw_KE").value, "sw");
  assert.equal(getSupportedLanguage("de").value, "en");
  assert.equal(getSupportedLanguage(undefined).value, "en");
});
