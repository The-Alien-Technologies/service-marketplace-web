import assert from "node:assert/strict";
import test from "node:test";
import {
  canInitializePayment,
  isValidPartialRefund,
  remainingRefundAmount,
} from "./payment-state.ts";

test("only unpaid, failed, and processing orders can enter initialization", () => {
  assert.equal(canInitializePayment("UNPAID"), true);
  assert.equal(canInitializePayment("FAILED"), true);
  assert.equal(canInitializePayment("PROCESSING"), true);
  assert.equal(canInitializePayment("PAID"), false);
  assert.equal(canInitializePayment("REFUND_PENDING"), false);
  assert.equal(canInitializePayment("PARTIALLY_REFUNDED"), false);
  assert.equal(canInitializePayment("REFUNDED"), false);
});

test("remaining refund amount never drops below zero", () => {
  assert.equal(remainingRefundAmount(100, 25), 75);
  assert.equal(remainingRefundAmount(0.3, 0.1), 0.2);
  assert.equal(remainingRefundAmount("100.00", "100.00"), 0);
  assert.equal(remainingRefundAmount(100, 125), 0);
});

test("partial refunds must stay below the remaining refundable balance", () => {
  assert.equal(isValidPartialRefund(24.99, 25), true);
  assert.equal(isValidPartialRefund(25, 25), false);
  assert.equal(isValidPartialRefund(0, 25), false);
});
