import assert from "node:assert/strict";
import test from "node:test";
import {
  getProviderEntryRoute,
  isProviderAccessRestricted,
} from "./provider-access.ts";

test("pending and rejected providers are restricted until approval", () => {
  assert.equal(
    isProviderAccessRestricted({
      role: "SERVICE_PROVIDER",
      status: "PENDING",
    }),
    true,
  );
  assert.equal(
    isProviderAccessRestricted({
      role: "SERVICE_PROVIDER",
      status: "REJECTED",
    }),
    true,
  );
  assert.equal(
    isProviderAccessRestricted({
      role: "SERVICE_PROVIDER",
      status: "ACTIVE",
    }),
    false,
  );
  assert.equal(
    isProviderAccessRestricted({ role: "USER", status: "PENDING" }),
    false,
  );
});

test("providers enter onboarding, application status, or dashboard by state", () => {
  assert.equal(
    getProviderEntryRoute({
      role: "SERVICE_PROVIDER",
      status: "PENDING",
      hasCompletedOnboarding: false,
    }),
    "/",
  );
  assert.equal(
    getProviderEntryRoute({
      role: "SERVICE_PROVIDER",
      status: "PENDING",
      hasCompletedOnboarding: true,
    }),
    "/provider-application",
  );
  assert.equal(
    getProviderEntryRoute({
      role: "SERVICE_PROVIDER",
      status: "ACTIVE",
      hasCompletedOnboarding: true,
    }),
    "/dashboard",
  );
});
