"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useSupportChatStore } from "@/store/support-chat-store";
import { resolveContactSupportAction } from "@/lib/support-navigation";

export function useContactSupport() {
  const router = useRouter();
  const { isAuthenticated, user, showAuth } = useAuthStore();
  const openChat = useSupportChatStore((state) => state.openChat);

  return () => {
    const action = resolveContactSupportAction(isAuthenticated, user?.role);
    switch (action) {
      case "SIGN_IN":
        showAuth("signin");
        return;
      case "OPEN_ADMIN_SUPPORT":
        router.push("/dashboard/support-chat");
        return;
      case "OPEN_SUPPORT_CHAT":
        openChat();
    }
  };
}
