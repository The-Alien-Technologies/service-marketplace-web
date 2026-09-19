import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney } from "./money.ts";

test("formats Ghana and South Africa service currencies independently", () => {
  assert.match(formatMoney(1250, "GHS", "en-GH"), /1,250/);
  assert.match(formatMoney(1250, "ZAR", "en-ZA"), /1[\s,]250/);
  assert.notEqual(
    formatMoney(1250, "GHS", "en-GH"),
    formatMoney(1250, "ZAR", "en-ZA"),
  );
});

test("does not invent a value for invalid amounts", () => {
  assert.equal(formatMoney("not-a-number", "GHS"), "—");
});
