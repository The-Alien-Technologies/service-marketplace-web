export type ContactSupportAction =
  | "SIGN_IN"
  | "OPEN_SUPPORT_CHAT"
  | "OPEN_ADMIN_SUPPORT";

export function resolveContactSupportAction(
  isAuthenticated: boolean,
  role?: string,
): ContactSupportAction {
  if (!isAuthenticated) return "SIGN_IN";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "OPEN_ADMIN_SUPPORT";
  return "OPEN_SUPPORT_CHAT";
}
