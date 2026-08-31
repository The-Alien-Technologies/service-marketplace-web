import type { User } from "../types/auth.ts";

type ProviderAccessUser = Pick<
  User,
  "role" | "status" | "hasCompletedOnboarding"
>;

export function isProviderAccessRestricted(
  user: Pick<ProviderAccessUser, "role" | "status"> | null | undefined,
): boolean {
  return user?.role === "SERVICE_PROVIDER" && user.status !== "ACTIVE";
}

export function getProviderEntryRoute(
  user: ProviderAccessUser,
): "/" | "/dashboard" | "/provider-application" {
  if (user.role !== "SERVICE_PROVIDER") return "/dashboard";
  if (!user.hasCompletedOnboarding) return "/";
  return user.status === "ACTIVE" ? "/dashboard" : "/provider-application";
}
