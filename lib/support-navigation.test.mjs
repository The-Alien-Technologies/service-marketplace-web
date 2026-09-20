import assert from "node:assert/strict";
import test from "node:test";
import { resolveContactSupportAction } from "./support-navigation.ts";

test("guests are prompted to sign in before contacting support", () => {
  assert.equal(resolveContactSupportAction(false), "SIGN_IN");
});

test("clients and providers open their support conversation", () => {
  assert.equal(resolveContactSupportAction(true, "USER"), "OPEN_SUPPORT_CHAT");
  assert.equal(
    resolveContactSupportAction(true, "SERVICE_PROVIDER"),
    "OPEN_SUPPORT_CHAT",
  );
});

test("admins are routed to the support operations dashboard", () => {
  assert.equal(
    resolveContactSupportAction(true, "ADMIN"),
    "OPEN_ADMIN_SUPPORT",
  );
});
