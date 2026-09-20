import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_STATE_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  SessionExpiredError,
  clearStoredAuthSession,
  isSessionExpiredError,
  shouldExpireSession,
  throwIfSessionExpired,
} from "./client-session.ts";

test("a 401 expires an authenticated session", () => {
  assert.equal(shouldExpireSession(401, true), true);
  assert.equal(shouldExpireSession(401, false), false);
  assert.equal(shouldExpireSession(403, true), false);
  assert.equal(shouldExpireSession(500, true), false);
});

test("clearing a session removes tokens and persisted auth state", () => {
  const removedKeys = [];

  clearStoredAuthSession({
    removeItem(key) {
      removedKeys.push(key);
    },
  });

  assert.deepEqual(removedKeys, [
    AUTH_TOKEN_STORAGE_KEY,
    REFRESH_TOKEN_STORAGE_KEY,
    AUTH_STATE_STORAGE_KEY,
  ]);
});

test("expired sessions clear storage and replace protected history", () => {
  const removedKeys = [];
  const redirects = [];
  globalThis.window = {
    localStorage: {
      removeItem(key) {
        removedKeys.push(key);
      },
    },
    location: {
      replace(path) {
        redirects.push(path);
      },
    },
  };

  try {
    assert.throws(
      () => throwIfSessionExpired(401, true),
      (error) =>
        error instanceof SessionExpiredError && isSessionExpiredError(error),
    );
    assert.deepEqual(removedKeys, [
      AUTH_TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
      AUTH_STATE_STORAGE_KEY,
    ]);
    assert.deepEqual(redirects, ["/"]);
    assert.doesNotThrow(() => throwIfSessionExpired(401, false));
  } finally {
    delete globalThis.window;
  }
});
