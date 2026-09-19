"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuperAdminMarkets } from "@/components/market/super-admin-markets";
import { apiService } from "@/lib/api";
import { marketDisplayName } from "@/lib/market-display";
import { useAuthStore } from "@/store/auth-store";
import {
  Market,
  ProviderMarketMembership,
  ProviderMarketMembershipStatus,
} from "@/types/market";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function MarketsPage() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === "SUPER_ADMIN") return <SuperAdminMarkets />;
  if (user?.role === "ADMIN") return <CountryAdminMemberships />;
  return <ProviderMarkets />;
}

function PageHeading({ title, body }: { title: string; body: string }) {
  const t = useTranslations("Markets");
  return (
    <div className="mb-8">
      <p className="text-sm font-semibold text-green-700">
        {t("countryOperations")}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
        {body}
      </p>
    </div>
  );
}

function ProviderMarkets() {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [memberships, setMemberships] = useState<ProviderMarketMembership[]>(
    [],
  );
  const [busy, setBusy] = useState<string | null>("load");

  const refresh = useCallback(async () => {
    setBusy("load");
    try {
      const [marketData, membershipData] = await Promise.all([
        apiService.getMarkets(),
        apiService.getProviderMarketMemberships(),
      ]);
      setMarkets(marketData);
      setMemberships(membershipData);
    } catch (error) {
      toast.error(errorMessage(error, t("somethingWentWrong")));
    } finally {
      setBusy(null);
    }
  }, [t]);
  useEffect(() => void refresh(), [refresh]);

  const apply = async (market: Market) => {
    setBusy(market.id);
    try {
      await apiService.applyToMarket(market.id);
      toast.success(
        t("applicationSent", { market: marketDisplayName(locale, market) }),
      );
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, t("somethingWentWrong")));
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeading title={t("providerTitle")} body={t("providerBody")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {markets.map((market) => {
          const membership = memberships.find(
            (item) => item.marketId === market.id,
          );
          return (
            <section
              key={market.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-800">
                  <MapPin className="h-5 w-5" />
                </span>
                <Badge variant="outline">
                  {membership
                    ? t(`membershipStatus.${membership.status}`)
                    : t("membershipStatus.NOT_JOINED")}
                </Badge>
              </div>
              <h2 className="mt-5 text-lg font-bold text-gray-950">
                {marketDisplayName(locale, market)}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("servicesAndPayouts", { currency: market.currency })}
              </p>
              {membership?.rejectionReason && (
                <p className="mt-3 text-xs text-red-700">
                  {membership.rejectionReason}
                </p>
              )}
              {(!membership ||
                membership.status === "REJECTED" ||
                membership.status === "SUSPENDED") && (
                <Button
                  className="mt-5 w-full"
                  onClick={() => void apply(market)}
                  disabled={
                    busy === market.id ||
                    market.status !== "ACTIVE" ||
                    !market.providerOnboardingEnabled
                  }
                >
                  {busy === market.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("applyToOperate")}
                </Button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CountryAdminMemberships() {
  const t = useTranslations("Markets");
  const common = useTranslations("Common");
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const [applications, setApplications] = useState<ProviderMarketMembership[]>(
    [],
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!user?.adminMarketId) {
      setApplications([]);
      setTotal(0);
      setTotalPages(0);
      setLoadError(null);
      setIsLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await apiService.getMarketMembershipApplications({
        status: "PENDING",
        search: search.trim() || undefined,
        page,
        limit: 10,
        orderBy: sort,
      });
      if (currentRequest !== requestId.current) return;
      if (result.totalPages > 0 && page > result.totalPages) {
        setPage(result.totalPages);
        return;
      }
      setApplications(result.applications);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setLoadError(errorMessage(error, t("applicationsLoadFailedBody")));
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [page, search, sort, t, user?.adminMarketId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 300);
    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [refresh]);

  const review = async (
    membership: ProviderMarketMembership,
    status: Exclude<ProviderMarketMembershipStatus, "PENDING">,
  ) => {
    const reason = reasons[membership.id]?.trim();
    if (status === "REJECTED" && !reason)
      return toast.error(t("rejectionReasonRequired"));
    setBusy(membership.id);
    try {
      await apiService.reviewMarketMembership(membership.id, status, reason);
      toast.success(
        status === "ACTIVE" ? t("providerApproved") : t("applicationRejected"),
      );
      setReasons((current) => {
        const next = { ...current };
        delete next[membership.id];
        return next;
      });
      if (applications.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await refresh();
      }
    } catch (error) {
      toast.error(errorMessage(error, t("somethingWentWrong")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeading title={t("adminTitle")} body={t("adminBody")} />
      {!user?.adminMarketId ? (
        <div className="mb-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {t("noCountryAssigned")}
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("searchMarketApplications")}
                  aria-label={t("searchMarketApplications")}
                  className="pl-9"
                />
              </div>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value as "asc" | "desc");
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-40"
                  aria-label={t("sortApplications")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t("oldestFirst")}</SelectItem>
                  <SelectItem value="desc">{t("newestFirst")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-600" aria-live="polite">
              {isLoading
                ? t("loadingApplications")
                : t("applicationsCount", { count: total })}
            </p>
          </div>

          {loadError ? (
            <div
              className="rounded-xl bg-red-50 px-6 py-10 text-center ring-1 ring-inset ring-red-200"
              role="alert"
            >
              <AlertCircle className="mx-auto h-7 w-7 text-red-700" />
              <h2 className="mt-4 font-semibold text-red-950">
                {t("applicationsLoadFailed")}
              </h2>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-red-800">
                {loadError}
              </p>
              <Button
                className="mt-5 border-red-300 bg-white text-red-900 hover:bg-red-100"
                variant="outline"
                onClick={() => void refresh()}
              >
                {common("retry")}
              </Button>
            </div>
          ) : isLoading ? (
            <div
              className="flex min-h-64 items-center justify-center"
              role="status"
            >
              <Loader2 className="h-7 w-7 animate-spin text-green-700" />
              <span className="sr-only">{t("loadingApplications")}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              {search ? (
                <Search className="mx-auto h-8 w-8 text-gray-400" />
              ) : (
                <Check className="mx-auto h-8 w-8 text-green-700" />
              )}
              <h2 className="mt-4 font-bold text-gray-900">
                {search ? t("noMatchingApplications") : t("queueClear")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? t("noMatchingApplicationsBody")
                  : t("noPendingApplications")}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {applications.map((membership) => {
                const providerName =
                  membership.provider?.displayName ||
                  [
                    membership.provider?.firstName,
                    membership.provider?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  membership.provider?.email ||
                  t("unknownProvider");
                const isVerified =
                  membership.provider?.isServiceProviderVerified === true;
                return (
                  <li
                    key={membership.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words font-bold text-gray-950">
                            {providerName}
                          </h2>
                          <Badge
                            variant="outline"
                            className={
                              isVerified
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-amber-200 bg-amber-50 text-amber-900"
                            }
                          >
                            {isVerified
                              ? t("verifiedProvider")
                              : t("verificationRequired")}
                          </Badge>
                        </div>
                        <p className="mt-1 break-all text-sm text-gray-500">
                          {membership.provider?.email} ·{" "}
                          {marketDisplayName(locale, membership.market)}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {t("submittedOn", {
                            date: new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                            }).format(new Date(membership.createdAt)),
                          })}
                        </p>
                        {membership.provider?.id && (
                          <Link
                            href={`/dashboard/provider-applications?application=${encodeURIComponent(membership.provider.id)}`}
                            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {t("viewProviderApplication")}
                          </Link>
                        )}
                      </div>
                      <Button
                        onClick={() => void review(membership, "ACTIVE")}
                        disabled={busy === membership.id || !isVerified}
                        aria-describedby={
                          !isVerified
                            ? `verification-note-${membership.id}`
                            : undefined
                        }
                      >
                        {busy === membership.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {t("approve")}
                      </Button>
                    </div>
                    {!isVerified && (
                      <p
                        id={`verification-note-${membership.id}`}
                        className="mt-3 text-sm text-amber-800"
                      >
                        {t("verifyBeforeApproval")}
                      </p>
                    )}
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`rejection-reason-${membership.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-800"
                        >
                          {t("rejectionReasonLabel", { name: providerName })}
                        </label>
                        <Input
                          id={`rejection-reason-${membership.id}`}
                          value={reasons[membership.id] ?? ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [membership.id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          placeholder={t("rejectionReasonPlaceholder")}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => void review(membership, "REJECTED")}
                        disabled={busy === membership.id}
                      >
                        {t("reject")}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!isLoading && !loadError && totalPages > 1 && (
            <nav
              className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              aria-label={t("applicationsPagination")}
            >
              <p className="text-sm text-gray-600">
                {t("pageOf", { page, totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {common("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                >
                  {common("next")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
