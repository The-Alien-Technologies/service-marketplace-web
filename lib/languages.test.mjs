import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LANGUAGE,
  getSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from "./languages.ts";

test("English is the only currently supported language", () => {
  assert.deepEqual(SUPPORTED_LANGUAGES, [
    { value: "en", label: "English", shortLabel: "EN" },
  ]);
  assert.equal(DEFAULT_LANGUAGE.value, "en");
});

test("unsupported and legacy preferences fall back to English", () => {
  assert.equal(getSupportedLanguage("en").value, "en");
  assert.equal(getSupportedLanguage("en-GB").value, "en");
  assert.equal(getSupportedLanguage("fr").value, "en");
  assert.equal(getSupportedLanguage(undefined).value, "en");
});
