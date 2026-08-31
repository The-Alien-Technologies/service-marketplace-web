import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import test from "node:test";
import {
  normalizeLocale,
  resolveAcceptLanguage,
  resolveLocale,
} from "../i18n/config.ts";

const localeFiles = ["en", "fr", "sw"];
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function leafKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object"
      ? leafKeys(child, path)
      : [path];
  });
}

async function loadCatalog(locale) {
  const source = await readFile(
    new URL(`../messages/${locale}.json`, import.meta.url),
    "utf8",
  );
  return JSON.parse(source);
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(entryPath)
        : /\.(?:ts|tsx)$/.test(entry.name)
          ? [entryPath]
          : [];
    }),
  );
  return files.flat();
}

function hasMessage(catalog, messagePath) {
  return messagePath
    .split(".")
    .reduce((value, part) => value?.[part], catalog) !== undefined;
}

test("all locale catalogs have identical message keys", async () => {
  const catalogs = await Promise.all(localeFiles.map(loadCatalog));
  const expectedKeys = leafKeys(catalogs[0]).sort();

  for (const [index, catalog] of catalogs.entries()) {
    assert.deepEqual(
      leafKeys(catalog).sort(),
      expectedKeys,
      `${localeFiles[index]} catalog differs from English`,
    );
  }
});

test("all catalog leaves contain non-empty strings", async () => {
  for (const locale of localeFiles) {
    const catalog = await loadCatalog(locale);
    const values = leafKeys(catalog).map((key) =>
      key.split(".").reduce((value, part) => value[part], catalog),
    );
    assert.ok(values.every((value) => typeof value === "string" && value.trim()));
  }
});

test("direct translation calls reference existing catalog messages", async () => {
  const catalog = await loadCatalog("en");
  const files = (
    await Promise.all(
      ["app", "components"].map((directory) =>
        sourceFiles(path.join(projectRoot, directory)),
      ),
    )
  ).flat();
  const missingMessages = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const declarations = source.matchAll(
      /const\s+(\w+)\s*=\s*useTranslations\(\s*["']([^"']+)["']\s*\)/g,
    );

    for (const [, accessor, namespace] of declarations) {
      const calls = source.matchAll(
        new RegExp(`\\b${accessor}(?:\\.rich)?\\(\\s*["']([^"']+)["']`, "g"),
      );
      for (const [, key] of calls) {
        const messagePath = `${namespace}.${key}`;
        if (!hasMessage(catalog, messagePath)) {
          missingMessages.push(
            `${path.relative(projectRoot, file)}: ${messagePath}`,
          );
        }
      }
    }
  }

  assert.deepEqual(missingMessages, []);
});

test("locale resolution handles regional tags and candidate precedence", () => {
  assert.equal(normalizeLocale(" FR-fr "), "fr");
  assert.equal(normalizeLocale("sw_KE"), "sw");
  assert.equal(normalizeLocale("de-DE"), undefined);
  assert.equal(resolveLocale("de", "fr-CA", "sw"), "fr");
  assert.equal(resolveLocale(null, undefined, "de"), "en");
});

test("Accept-Language resolution respects quality ordering", () => {
  assert.equal(resolveAcceptLanguage("de-DE,de;q=0.9,fr-FR;q=0.8"), "fr");
  assert.equal(resolveAcceptLanguage("sw-KE;q=0.7,en-GB;q=0.9"), "en");
  assert.equal(resolveAcceptLanguage("fr-FR;q=0"), "en");
  assert.equal(resolveAcceptLanguage(undefined), "en");
});
