import assert from "node:assert/strict";
import test from "node:test";
import {getSignUpEntryState} from "./auth-entry-state.ts";

test("provider entry opens the provider sign-up popup", () => {
  assert.deepEqual(getSignUpEntryState("provider"), {
    authFlow: "provider",
    authStep: "signup",
    providerAuthStep: "provider-signup",
    showAuthModal: true,
  });
});

test("user entry opens the user sign-up popup", () => {
  assert.deepEqual(getSignUpEntryState("user"), {
    authFlow: "user",
    authStep: "signup",
    userAuthStep: "signup",
    showAuthModal: true,
  });
});
