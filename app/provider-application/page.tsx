"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  FileCheck2,
  Loader2,
  LogOut,
  Mail,
  PencilLine,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { apiService } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  mapBackendStepToFrontendStep,
  type ProviderAuthStep,
} from "@/types/auth";
import { useFormatter, useTranslations } from "next-intl";

export default function ProviderApplicationPage() {
  const t = useTranslations("ProviderApplication");
  const navigation = useTranslations("Navigation");
  const format = useFormatter();
  const router = useRouter();
  const {
    user,
    setUser,
    signOut,
    hasHydrated,
    isAuthenticated,
    setProviderAuthStep,
  } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const refreshRequestId = useRef(0);

  const refreshApplication = useCallback(async () => {
    const requestId = ++refreshRequestId.current;
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const { user: freshUser } = await apiService.getProfile();
      if (requestId !== refreshRequestId.current) return;
      setUser(freshUser);

      if (freshUser.role !== "SERVICE_PROVIDER") {
        router.replace("/dashboard");
      } else if (freshUser.status === "ACTIVE") {
        router.replace("/dashboard");
      } else if (!freshUser.hasCompletedOnboarding) {
        let nextStep: ProviderAuthStep = "provider-profile";
        try {
          const onboardingStatus = await apiService.getOnboardingStatus();
          nextStep = mapBackendStepToFrontendStep(
            onboardingStatus.nextRequiredStep || "basic_profile",
            "SERVICE_PROVIDER",
          ) as ProviderAuthStep;
        } catch {
          // The profile step is a safe recovery point if status lookup fails.
        }
        setProviderAuthStep(nextStep);
        router.replace("/");
      }
    } catch (error) {
      if (requestId !== refreshRequestId.current) return;
      setLoadError(
        error instanceof Error
          ? error.message
          : t("refreshFailed"),
      );
    } finally {
      if (requestId === refreshRequestId.current) setIsRefreshing(false);
    }
  }, [router, setProviderAuthStep, setUser, t]);

  useEffect(
    () => () => {
      refreshRequestId.current += 1;
    },
    [],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    void refreshApplication();
  }, [hasHydrated, isAuthenticated, refreshApplication, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    const refreshOnFocus = () => void refreshApplication();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [hasHydrated, isAuthenticated, refreshApplication]);

  const handleSignOut = async () => {
    refreshRequestId.current += 1;
    await signOut();
    router.replace("/");
  };

  const handleEditApplication = () => {
    setProviderAuthStep("provider-profile");
    router.push("/");
  };

  if (!hasHydrated || (isRefreshing && !user)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SERVICE_PROVIDER") return null;

  const rejected = user.status === "REJECTED";

  return (
    <div className="min-h-dvh bg-[#f6f8f5] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOut}
            className="gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            <LogOut className="h-4 w-4" />
            {navigation("signOut")}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <section aria-labelledby="application-title" className="max-w-3xl">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                rejected
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {rejected ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
              {rejected ? t("changesRequested") : t("reviewInProgress")}
            </div>

            <h1
              id="application-title"
              className="mt-6 max-w-2xl text-balance text-4xl font-bold tracking-[-0.03em] text-slate-950 sm:text-5xl"
            >
              {rejected
                ? t("changesTitle")
                : t("reviewTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              {rejected
                ? t("changesBody")
                : t("reviewBody")}
            </p>

            {rejected && (
              <div
                className="mt-8 rounded-xl bg-red-50 p-5 text-red-950 ring-1 ring-inset ring-red-200 sm:p-6"
                role="alert"
              >
                <h2 className="font-semibold">{t("reviewNote")}</h2>
                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-red-900">
                  {user.providerApplicationRejectionReason ||
                    t("reviewNoteFallback")}
                </p>
              </div>
            )}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              {rejected ? (
                <Button
                  type="button"
                  onClick={handleEditApplication}
                  className="h-11 gap-2 bg-green-700 px-5 text-white hover:bg-green-800"
                >
                  <PencilLine className="h-4 w-4" />
                  {t("updateApplication")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshApplication()}
                  disabled={isRefreshing}
                  className="h-11 gap-2 border-slate-300 bg-white px-5 text-slate-800"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t("refreshStatus")}
                </Button>
              )}
              <span className="text-sm text-slate-500">
                {user.providerApplicationSubmittedAt
                  ? t("submittedDate", { date: format.dateTime(new Date(user.providerApplicationSubmittedAt), "long") })
                  : t("submittedRecently")}
              </span>
            </div>

            {loadError && (
              <p className="mt-4 text-sm font-medium text-red-700" role="alert">
                {loadError} {t("refreshHint")}
              </p>
            )}

            <ol className="mt-14 grid gap-0 border-y border-slate-200 sm:grid-cols-3">
              <li className="flex gap-4 py-6 sm:pr-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{t("submitted")}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {t("received")}
                  </p>
                </div>
              </li>
              <li className="flex gap-4 border-slate-200 py-6 sm:border-x sm:px-5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    rejected
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {rejected ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{t("teamReview")}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {rejected
                      ? t("changesWereRequested")
                      : t("checksUnderway")}
                  </p>
                </div>
              </li>
              <li className="flex gap-4 py-6 sm:pl-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {t("providerAccess")}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {t("enabledAfterApproval")}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <aside className="border-t border-slate-200 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-2">
            <FileCheck2 className="h-6 w-6 text-green-700" />
            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              {t("whatNext")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("whatNextBody")}
            </p>

            <div className="mt-7 flex gap-3 border-t border-slate-200 pt-6">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t("decisionEmail")}
                </p>
                <p className="mt-1 break-words text-sm leading-5 text-slate-500">
                  {t("decisionSent", { email: user.email })}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
