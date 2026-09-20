"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { isProviderAccessRestricted } from "@/lib/provider-access";

export function useProtectedNavigation() {
  const router = useRouter();
  const { isAuthenticated, showAuth, user } = useAuthStore();

  return (href: string) => {
    if (href.startsWith("/dashboard") && !isAuthenticated) {
      showAuth("signin");
      return;
    }
    if (href.startsWith("/dashboard") && isProviderAccessRestricted(user)) {
      router.push("/provider-application");
      return;
    }
    router.push(href);
  };
}
