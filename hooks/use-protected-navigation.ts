"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useProtectedNavigation() {
  const router = useRouter();
  const { isAuthenticated, showAuth } = useAuthStore();

  return (href: string) => {
    if (href.startsWith("/dashboard") && !isAuthenticated) {
      showAuth("signin");
      return;
    }
    router.push(href);
  };
}
