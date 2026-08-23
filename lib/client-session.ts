export const AUTH_TOKEN_STORAGE_KEY = "auth_token";
export const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
export const AUTH_STATE_STORAGE_KEY = "auth-storage";

const SESSION_EXPIRED_ERROR_NAME = "SessionExpiredError";
const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

type SessionStorage = Pick<Storage, "removeItem">;

let isRedirectingAfterSessionExpiry = false;

export class SessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED_MESSAGE);
    this.name = SESSION_EXPIRED_ERROR_NAME;
  }
}

export function clearStoredAuthSession(storage?: SessionStorage): void {
  const sessionStorage =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);

  if (!sessionStorage) return;

  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STATE_STORAGE_KEY);
}

export function shouldExpireSession(
  responseStatus: number,
  hadAuthToken: boolean,
): boolean {
  return responseStatus === 401 && hadAuthToken;
}

export function throwIfSessionExpired(
  responseStatus: number,
  hadAuthToken: boolean,
): void {
  if (!shouldExpireSession(responseStatus, hadAuthToken)) return;

  if (typeof window !== "undefined") {
    clearStoredAuthSession(window.localStorage);

    if (!isRedirectingAfterSessionExpiry) {
      isRedirectingAfterSessionExpiry = true;
      window.location.replace("/");
    }
  }

  throw new SessionExpiredError();
}

export function isSessionExpiredError(
  error: unknown,
): error is SessionExpiredError {
  return (
    error instanceof Error && error.name === SESSION_EXPIRED_ERROR_NAME
  );
}
