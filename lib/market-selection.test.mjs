import assert from "node:assert/strict";
import test from "node:test";
import { suggestMarketCode } from "./market-selection.ts";

const markets = [
  { id: "gh", code: "GH", status: "ACTIVE" },
  { id: "za", code: "ZA", status: "ACTIVE" },
];

test("explicit global selection remains global", () => {
  assert.equal(
    suggestMarketCode(markets, { persistedCode: "GLOBAL" }),
    "GLOBAL",
  );
});

test("account preference takes precedence over passive location inference", () => {
  assert.equal(
    suggestMarketCode(markets, {
      preferredMarketId: "gh",
      timezone: "Africa/Johannesburg",
    }),
    "GH",
  );
});

test("South African locale or timezone suggests ZA without forcing checkout currency", () => {
  assert.equal(suggestMarketCode(markets, { language: "en-ZA" }), "ZA");
  assert.equal(
    suggestMarketCode(markets, { timezone: "Africa/Johannesburg" }),
    "ZA",
  );
});
