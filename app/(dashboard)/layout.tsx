"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { apiService } from "@/lib/api";
import { isProviderAccessRestricted } from "@/lib/provider-access";
import { Loader2 } from "lucide-react";
import {useTranslations} from "next-intl";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const t = useTranslations("Dashboard");
  const nav = useTranslations("Navigation");
  const providerAccessRestricted = isProviderAccessRestricted(user);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/");
      setIsCheckingAccess(false);
      return;
    }

    if (providerAccessRestricted) {
      router.replace("/provider-application");
      return;
    }

    let cancelled = false;
    void apiService
      .getProfile()
      .then(({ user: freshUser }) => {
        if (cancelled) return;
        setUser(freshUser);
        if (isProviderAccessRestricted(freshUser)) {
          router.replace("/provider-application");
          return;
        }
        setIsCheckingAccess(false);
      })
      .catch(() => {
        if (!cancelled) setIsCheckingAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    isAuthenticated,
    providerAccessRestricted,
    router,
    setUser,
  ]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Show loading while hydrating
  if (!hasHydrated || isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        <span className="sr-only">{t("checkingAccess")}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (providerAccessRestricted) {
    return null;
  }

  return (
    <div className="flex h-dvh min-h-[32rem] overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="sticky top-0" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={nav("dashboardNavigation")}
        >
          <button
            type="button"
            aria-label={nav("closeNavigation")}
            className="absolute inset-0 h-full w-full bg-gray-950/50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] bg-white shadow-xl">
             <Sidebar isMobile={true} onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
