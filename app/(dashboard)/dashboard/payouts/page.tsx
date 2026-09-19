"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock3,
  FileCheck2,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiService } from "@/lib/api";
import {
  AdminRefund,
  ExternalPaymentDispute,
  PaymentRefundStatus,
  RefundInstitution,
  ResolvedRefundAccount,
} from "@/types/payment";
import {
  ProviderPayout,
  ProviderPayoutStatus,
  ReleaseReview,
} from "@/types/payout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

type Tab = "requests" | "release" | "refunds" | "chargebacks";
type Pagination = { page: number; limit: number; total: number; pages: number };

const PAGE_SIZE = 25;

const money = (
  value: number | string | undefined = 0,
  currency = "GHS",
  locale = currency === "ZAR" ? "en-ZA" : "en-GH",
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));

const payoutMeta: Record<
  ProviderPayoutStatus,
  { label: string; className: string }
> = {
  REQUESTED: {
    label: "Needs approval",
    className: "bg-amber-50 text-amber-800",
  },
  PROCESSING: { label: "Processing", className: "bg-blue-50 text-blue-800" },
  OTP_REQUIRED: {
    label: "OTP required",
    className: "bg-violet-50 text-violet-800",
  },
  SUCCESS: { label: "Paid", className: "bg-green-50 text-green-800" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700" },
  REVERSED: { label: "Reversed", className: "bg-red-50 text-red-700" },
  REJECTED: { label: "Rejected", className: "bg-gray-100 text-gray-700" },
};

const refundMeta: Record<
  PaymentRefundStatus,
  { label: string; className: string }
> = {
  INITIALIZED: { label: "Initialized", className: "bg-blue-50 text-blue-800" },
  PENDING: { label: "Pending", className: "bg-blue-50 text-blue-800" },
  PROCESSING: { label: "Processing", className: "bg-blue-50 text-blue-800" },
  NEEDS_ATTENTION: {
    label: "Needs account details",
    className: "bg-amber-50 text-amber-800",
  },
  PROCESSED: { label: "Processed", className: "bg-green-50 text-green-800" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-800" },
};

export default function AdminPayoutsPage() {
  const t = useTranslations("AdminOps");
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [payouts, setPayouts] = useState<ProviderPayout[]>([]);
  const [releaseReviews, setReleaseReviews] = useState<ReleaseReview[]>([]);
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [chargebacks, setChargebacks] = useState<ExternalPaymentDispute[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [releasePage, setReleasePage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  const [chargebackPage, setChargebackPage] = useState(1);
  const [payoutPagination, setPayoutPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [releasePagination, setReleasePagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [chargebackPagination, setChargebackPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [refundPagination, setRefundPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [action, setAction] = useState<{
    kind:
      | "approve-payout"
      | "reject-payout"
      | "review-release"
      | "retry-refund"
      | "reattempt-refund"
      | "otp";
    payout?: ProviderPayout;
    review?: ReleaseReview;
    refund?: AdminRefund;
    approve?: boolean;
  } | null>(null);
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundBankCode, setRefundBankCode] = useState("");
  const [refundInstitutions, setRefundInstitutions] = useState<
    RefundInstitution[]
  >([]);
  const [resolvedRefundAccount, setResolvedRefundAccount] =
    useState<ResolvedRefundAccount | null>(null);
  const [refundResolveError, setRefundResolveError] = useState<string | null>(
    null,
  );
  const [isResolvingRefundAccount, setIsResolvingRefundAccount] =
    useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(
    async (quiet = false) => {
      if (quiet) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError(null);
      try {
        const [payoutResult, reviewResult, refundResult, chargebackResult] =
          await Promise.allSettled([
            apiService.getAdminPayouts({
              page: payoutPage,
              limit: PAGE_SIZE,
              search: search.trim() || undefined,
            }),
            apiService.getReleaseReviews(releasePage, PAGE_SIZE),
            apiService.getAdminRefunds(refundPage, PAGE_SIZE),
            apiService.getExternalPaymentDisputes(chargebackPage, PAGE_SIZE),
          ]);
        if (payoutResult.status === "fulfilled") {
          setPayouts(payoutResult.value.data);
          setPayoutPagination(payoutResult.value.pagination);
        }
        if (reviewResult.status === "fulfilled") {
          setReleaseReviews(reviewResult.value.data);
          setReleasePagination(reviewResult.value.pagination);
        }
        if (refundResult.status === "fulfilled") {
          setRefunds(refundResult.value.data);
          setRefundPagination(refundResult.value.pagination);
        }
        if (chargebackResult.status === "fulfilled") {
          setChargebacks(chargebackResult.value.data);
          setChargebackPagination(chargebackResult.value.pagination);
        }
        const failedCount = [
          payoutResult,
          reviewResult,
          refundResult,
          chargebackResult,
        ].filter((result) => result.status === "rejected").length;
        if (failedCount > 0) {
          setLoadError(
            `${failedCount} operations queue${failedCount === 1 ? " is" : "s are"} temporarily unavailable. Existing results were kept; retry to refresh them.`,
          );
        }
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load payout operations. Please retry.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [chargebackPage, payoutPage, refundPage, releasePage, search],
  );

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const reconcileTransfers = async () => {
    setIsRefreshing(true);
    try {
      const result = await apiService.reconcilePendingTransfers();
      toast.success(
        `Checked ${result.checked} transfer${result.checked === 1 ? "" : "s"}; updated ${result.reconciled}.`,
      );
      await loadData(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not reconcile transfers",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const reconcileRefunds = async () => {
    setIsRefreshing(true);
    try {
      const result = await apiService.reconcilePendingRefunds();
      toast.success(
        `Checked ${result.checked} refund${result.checked === 1 ? "" : "s"}; updated ${result.reconciled}.`,
      );
      await loadData(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reconcile refunds",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const openRefundRecovery = async (refund: AdminRefund) => {
    setRefundAccountNumber("");
    setRefundBankCode("");
    setResolvedRefundAccount(null);
    setRefundResolveError(null);
    setRefundInstitutions([]);
    setAction({ kind: "retry-refund", refund });
    try {
      setRefundInstitutions(
        await apiService.getRefundInstitutions(refund.order.marketId),
      );
    } catch (error) {
      setRefundResolveError(
        error instanceof Error
          ? error.message
          : "Could not load supported refund banks.",
      );
    }
  };

  const resolveRefundAccount = async () => {
    if (!/^\d{7,20}$/.test(refundAccountNumber)) {
      setRefundResolveError("Enter a valid customer account number.");
      return;
    }
    if (!refundBankCode) {
      setRefundResolveError("Select the customer’s receiving bank.");
      return;
    }
    if (!action?.refund) return;
    setIsResolvingRefundAccount(true);
    setRefundResolveError(null);
    setResolvedRefundAccount(null);
    try {
      setResolvedRefundAccount(
        await apiService.resolveRefundAccount(
          refundAccountNumber,
          refundBankCode,
          action.refund.order.marketId,
        ),
      );
    } catch (error) {
      setRefundResolveError(
        error instanceof Error
          ? error.message
          : "Paystack could not verify this account.",
      );
    } finally {
      setIsResolvingRefundAccount(false);
    }
  };

  const submitDialogAction = async () => {
    if (!action) return;
    setIsSaving(true);
    try {
      if (action.kind === "approve-payout" && action.payout) {
        const updated = await apiService.approvePayout(action.payout.id);
        if (updated.status === "OTP_REQUIRED") {
          setAction({ kind: "otp", payout: updated });
          setOtp("");
          toast.info("Paystack requires the transfer OTP");
          await loadData(true);
          return;
        }
        toast.success("Transfer submitted to Paystack");
      }
      if (action.kind === "reject-payout" && action.payout) {
        if (!note.trim()) throw new Error("Enter a rejection reason");
        await apiService.rejectPayout(action.payout.id, note.trim());
        toast.success("Payout request rejected and earnings released");
      }
      if (action.kind === "review-release" && action.review) {
        await apiService.reviewRelease(
          action.review.orderId,
          Boolean(action.approve),
          note.trim() || undefined,
        );
        toast.success(
          action.approve
            ? "Provider earnings released"
            : "Release request rejected",
        );
      }
      if (action.kind === "otp" && action.payout) {
        if (otp.length !== 6) throw new Error("Enter the 6-digit transfer OTP");
        await apiService.finalizePayout(action.payout.id, otp);
        toast.success("Transfer OTP submitted");
      }
      if (action.kind === "retry-refund" && action.refund) {
        if (!/^\d{7,20}$/.test(refundAccountNumber)) {
          throw new Error("Enter a valid customer account number");
        }
        if (
          !resolvedRefundAccount ||
          resolvedRefundAccount.accountNumber !== refundAccountNumber ||
          resolvedRefundAccount.bankCode !== refundBankCode
        ) {
          throw new Error("Verify the customer account before retrying");
        }
        await apiService.retryRefund(action.refund.id, {
          accountNumber: refundAccountNumber,
          bankCode: refundBankCode,
          currency: action.refund.currency,
          marketId: action.refund.order.marketId,
        });
        toast.success("Customer details submitted to Paystack");
      }
      if (action.kind === "reattempt-refund" && action.refund) {
        await apiService.reattemptExcessRefund(action.refund.id);
        toast.success("Duplicate-charge refund submitted again");
      }
      setAction(null);
      setNote("");
      setOtp("");
      setRefundAccountNumber("");
      setRefundBankCode("");
      setResolvedRefundAccount(null);
      setRefundResolveError(null);
      await loadData(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Action could not be completed",
      );
      await loadData(true);
      if (action.kind === "approve-payout") setAction(null);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const providerName =
      payout.provider?.displayName ||
      `${payout.provider?.firstName || ""} ${payout.provider?.lastName || ""}`;
    return [
      payout.reference,
      payout.institutionName,
      providerName,
      payout.provider?.email,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term));
  });

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    {
      id: "requests",
      label: t("payoutRequests"),
      count: payoutPagination.total,
    },
    {
      id: "release",
      label: t("releaseReviews"),
      count: releasePagination.total,
    },
    { id: "refunds", label: t("refunds"), count: refundPagination.total },
    {
      id: "chargebacks",
      label: t("paystackDisputes"),
      count: chargebackPagination.total,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 pb-14 dark:[&_.bg-white]:bg-gray-900 dark:[&_.bg-gray-100]:bg-gray-800 dark:[&_.border-gray-100]:border-gray-800 dark:[&_.border-gray-200]:border-gray-700 dark:[&_.text-gray-950]:text-white dark:[&_.text-gray-900]:text-gray-100 dark:[&_.text-gray-800]:text-gray-200 dark:[&_.text-gray-700]:text-gray-300 dark:[&_.text-gray-600]:text-gray-300 dark:[&_.text-gray-500]:text-gray-400">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
            {t("payoutsTitle")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t("payoutsSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={reconcileTransfers}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            {t("reconcileTransfers")}
          </Button>
          <Button
            variant="outline"
            onClick={reconcileRefunds}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            {t("reconcileRefunds")}
          </Button>
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
          >
            {t("refreshQueues")}
          </Button>
        </div>
      </header>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-950/40 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{loadError}</p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-100"
            onClick={() => void loadData(true)}
            disabled={isRefreshing}
          >
            Retry unavailable queues
          </Button>
        </div>
      )}

      <nav
        className="flex gap-1 overflow-x-auto border-b border-gray-200"
        aria-label={t("payoutsTitle")}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex min-h-11 shrink-0 items-center gap-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2",
              activeTab === tab.id
                ? "text-green-800"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "min-w-5 rounded-md px-1.5 py-0.5 text-xs",
                  activeTab === tab.id
                    ? "bg-green-100 text-green-800"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-green-700" />
            )}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <div className="flex min-h-[45vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </div>
      ) : activeTab === "requests" ? (
        <section className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              aria-label={t("searchPayouts")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPayoutPage(1);
              }}
              placeholder={t("searchPayouts")}
              className="h-11 pl-9"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {filteredPayouts.length === 0 ? (
              <QueueEmpty
                icon={WalletCards}
                title="No payout requests"
                description="New provider withdrawals will appear here for approval."
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPayouts.map((payout) => {
                  const meta = payoutMeta[payout.status];
                  const providerName =
                    payout.provider?.displayName ||
                    `${payout.provider?.firstName || ""} ${payout.provider?.lastName || ""}`.trim() ||
                    "Provider";
                  return (
                    <article key={payout.id} className="p-5 sm:p-6">
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-bold text-gray-950">
                              {providerName}
                            </h2>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-semibold",
                                meta.className,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {payout.provider?.email} · {payout.reference}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">
                                Destination
                              </p>
                              <p className="mt-0.5 font-semibold text-gray-900">
                                {payout.institutionName} ••••{" "}
                                {payout.accountNumberLast4}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Included earnings
                              </p>
                              <p className="mt-0.5 font-semibold text-gray-900">
                                {payout.items?.length || 0} orders ·{" "}
                                {money(
                                  payout.grossEarningsAmount,
                                  payout.currency,
                                )}
                              </p>
                            </div>
                            {Number(payout.adjustmentAmount) > 0 && (
                              <div>
                                <p className="text-xs text-gray-500">
                                  Adjustments recovered
                                </p>
                                <p className="mt-0.5 font-semibold text-amber-800">
                                  −
                                  {money(
                                    payout.adjustmentAmount,
                                    payout.currency,
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <p className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
                            {money(payout.amount, payout.currency)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {payout.status === "REQUESTED" && (
                              <>
                                <Button
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setNote("");
                                    setAction({
                                      kind: "reject-payout",
                                      payout,
                                    });
                                  }}
                                >
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-700 text-white hover:bg-green-800"
                                  onClick={() =>
                                    setAction({
                                      kind: "approve-payout",
                                      payout,
                                    })
                                  }
                                  disabled={isSaving}
                                >
                                  Approve transfer
                                </Button>
                              </>
                            )}
                            {payout.status === "OTP_REQUIRED" && (
                              <Button
                                className="bg-violet-700 text-white hover:bg-violet-800"
                                onClick={() => {
                                  setOtp("");
                                  setAction({ kind: "otp", payout });
                                }}
                              >
                                Enter transfer OTP
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      {(payout.failureMessage || payout.rejectionReason) && (
                        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                          {payout.failureMessage || payout.rejectionReason}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : activeTab === "release" ? (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {releaseReviews.length === 0 ? (
            <QueueEmpty
              icon={FileCheck2}
              title="No release reviews"
              description="Provider requests for unresponsive customers will appear here."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {releaseReviews.map((review) => {
                const providerName =
                  review.provider.displayName ||
                  `${review.provider.firstName || ""} ${review.provider.lastName || ""}`.trim();
                const clientName =
                  review.order.client.displayName ||
                  `${review.order.client.firstName || ""} ${review.order.client.lastName || ""}`.trim();
                return (
                  <article
                    key={review.id}
                    className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-gray-950">
                          {review.order.service.title}
                        </h2>
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Customer response needed
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Order #{review.order.orderNumber} · Provider{" "}
                        {providerName} · Customer {clientName}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">
                        {review.releaseReviewNote ||
                          "The provider requested an admin review after completing this order."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>
                          Provider due{" "}
                          {money(review.providerAmount, review.order.currency)}
                        </span>
                        <span>
                          Requested{" "}
                          {review.releaseReviewRequestedAt
                            ? new Date(
                                review.releaseReviewRequestedAt,
                              ).toLocaleString("en-GH")
                            : "recently"}
                        </span>
                        <Link
                          href={`/dashboard/orders/${review.orderId}`}
                          className="inline-flex items-center gap-1 font-semibold text-green-800 hover:underline"
                        >
                          Review order <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setNote("");
                          setAction({
                            kind: "review-release",
                            review,
                            approve: false,
                          });
                        }}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      <Button
                        className="bg-green-700 text-white hover:bg-green-800"
                        onClick={() => {
                          setNote("");
                          setAction({
                            kind: "review-release",
                            review,
                            approve: true,
                          });
                        }}
                      >
                        <Check className="h-4 w-4" /> Release
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : activeTab === "refunds" ? (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {refunds.length === 0 ? (
            <QueueEmpty
              icon={RefreshCw}
              title="No refunds"
              description="Paystack refund attempts and recovery states will appear here."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {refunds.map((refund) => {
                const meta = refundMeta[refund.status];
                const customerName =
                  refund.order.client.displayName ||
                  `${refund.order.client.firstName || ""} ${refund.order.client.lastName || ""}`.trim() ||
                  refund.order.client.email;
                return (
                  <article
                    key={refund.id}
                    className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-gray-950">
                          Order #{refund.order.orderNumber}
                        </h2>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                        {!refund.affectsOrderBalance && (
                          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                            Duplicate charge protection
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-words text-xs text-gray-500">
                        {customerName} · {refund.order.client.email} ·{" "}
                        {refund.reference}
                      </p>
                      <p className="mt-3 text-sm text-gray-700">
                        {refund.reason || "Customer payment refund"}
                      </p>
                      {refund.failureMessage && (
                        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                          {refund.failureMessage}
                        </p>
                      )}
                      <Link
                        href={`/dashboard/orders/${refund.order.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-800 hover:underline"
                      >
                        View order <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xl font-bold text-gray-950">
                        {money(refund.amount, refund.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(refund.createdAt).toLocaleString("en-GH")}
                      </p>
                      {refund.status === "NEEDS_ATTENTION" &&
                        refund.providerRefundId && (
                          <Button
                            className="bg-amber-700 text-white hover:bg-amber-800"
                            onClick={() => void openRefundRecovery(refund)}
                          >
                            Add customer details
                          </Button>
                        )}
                      {refund.status === "FAILED" &&
                        !refund.affectsOrderBalance && (
                          <Button
                            className="bg-red-700 text-white hover:bg-red-800"
                            onClick={() =>
                              setAction({ kind: "reattempt-refund", refund })
                            }
                          >
                            Retry duplicate refund
                          </Button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {chargebacks.length === 0 ? (
            <QueueEmpty
              icon={ShieldAlert}
              title="No Paystack disputes"
              description="External chargebacks will appear here without mixing into service disputes."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {chargebacks.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-950">
                        Order #{item.order.orderNumber}
                      </h2>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          ["OPEN", "REMINDER"].includes(item.status)
                            ? "bg-red-50 text-red-800"
                            : item.status === "RESOLVED_WON"
                              ? "bg-green-50 text-green-800"
                              : "bg-slate-100 text-slate-700",
                        )}
                      >
                        {item.status.replaceAll("_", " ").toLowerCase()}
                      </span>
                      {!item.affectsOrderBalance && (
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                          Duplicate charge only
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Paystack dispute {item.providerDisputeId} ·{" "}
                      {item.order.client.email}
                    </p>
                    <p className="mt-3 text-sm text-gray-700">
                      Provider:{" "}
                      {item.order.provider.displayName ||
                        item.order.provider.email}
                      {item.balanceAdjustment
                        ? ` · Future balance adjustment ${money(item.balanceAdjustment.amount, item.currency)}`
                        : " · Unpaid earnings are held"}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-gray-500">Disputed amount</p>
                    <p className="mt-1 text-lg font-bold text-gray-950">
                      {money(item.refundAmount, item.currency)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("en-GH")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!isLoading && (
        <QueuePagination
          pagination={
            activeTab === "requests"
              ? payoutPagination
              : activeTab === "release"
                ? releasePagination
                : activeTab === "refunds"
                  ? refundPagination
                  : chargebackPagination
          }
          onPageChange={
            activeTab === "requests"
              ? setPayoutPage
              : activeTab === "release"
                ? setReleasePage
                : activeTab === "refunds"
                  ? setRefundPage
                  : setChargebackPage
          }
        />
      )}

      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && !isSaving && setAction(null)}
      >
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900 dark:text-gray-100 dark:[&_.bg-gray-100]:bg-gray-800 dark:[&_.text-gray-500]:text-gray-400 dark:[&_.text-gray-700]:text-gray-200">
          <DialogHeader>
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                action?.kind === "otp"
                  ? "bg-violet-100 text-violet-800"
                  : action?.kind === "retry-refund"
                    ? "bg-amber-100 text-amber-800"
                    : action?.kind === "approve-payout" || action?.approve
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800",
              )}
            >
              {action?.kind === "otp" ? (
                <Landmark className="h-5 w-5" />
              ) : action?.kind === "retry-refund" ? (
                <RefreshCw className="h-5 w-5" />
              ) : action?.kind === "approve-payout" || action?.approve ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <DialogTitle>
              {action?.kind === "otp"
                ? "Enter Paystack transfer OTP"
                : action?.kind === "retry-refund"
                  ? "Provide customer refund details"
                  : action?.kind === "reattempt-refund"
                    ? "Retry this duplicate-charge refund?"
                    : action?.kind === "approve-payout"
                      ? "Approve this transfer?"
                      : action?.kind === "reject-payout"
                        ? "Reject this payout request?"
                        : action?.approve
                          ? "Release provider earnings?"
                          : "Reject the release request?"}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {action?.kind === "otp"
                ? "Paystack requires the one-time code sent to the business transfer approver."
                : action?.kind === "retry-refund"
                  ? `Paystack needs the customer's receiving account before it can retry this exact ${money(action.refund?.amount, action.refund?.currency)} refund.`
                  : action?.kind === "reattempt-refund"
                    ? `This resubmits the failed ${money(action.refund?.amount, action.refund?.currency)} refund for the additional charge. It does not change the order balance or provider earnings.`
                    : action?.kind === "approve-payout"
                      ? `This sends ${money(action.payout?.amount, action.payout?.currency)} to ${action.payout?.institutionName} •••• ${action.payout?.accountNumberLast4}. The transfer cannot be recalled from Pavodah after Paystack accepts it.`
                      : action?.kind === "reject-payout"
                        ? "The reserved order earnings will return to the provider’s eligible balance."
                        : action?.approve
                          ? "This is equivalent to customer acceptance and makes the earnings withdrawable."
                          : "The earnings remain held. Explain what evidence or customer response is still required."}
            </DialogDescription>
          </DialogHeader>
          {action?.kind === "otp" ? (
            <Input
              aria-label="6-digit Paystack transfer OTP"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit OTP"
              className="h-12 text-center text-lg font-semibold tracking-[0.25em]"
            />
          ) : action?.kind === "retry-refund" ? (
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gray-700">
                  Customer account number
                </span>
                <Input
                  aria-label="Customer refund account number"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={20}
                  value={refundAccountNumber}
                  onChange={(event) => {
                    setRefundAccountNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 20),
                    );
                    setResolvedRefundAccount(null);
                    setRefundResolveError(null);
                  }}
                  placeholder="Account number"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gray-700">
                  Receiving bank
                </span>
                <Select
                  value={refundBankCode}
                  onValueChange={(value) => {
                    setRefundBankCode(value);
                    setResolvedRefundAccount(null);
                    setRefundResolveError(null);
                  }}
                  disabled={refundInstitutions.length === 0}
                >
                  <SelectTrigger className="h-11 w-full bg-white dark:bg-gray-900">
                    <SelectValue
                      placeholder={
                        refundInstitutions.length
                          ? "Select the receiving bank"
                          : "Loading supported banks…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {refundInstitutions.map((institution) => (
                      <SelectItem
                        key={institution.code}
                        value={institution.code}
                      >
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void resolveRefundAccount()}
                disabled={
                  isResolvingRefundAccount ||
                  !refundBankCode ||
                  refundAccountNumber.length < 7
                }
              >
                {isResolvingRefundAccount && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Verify account with Paystack
              </Button>
              {refundResolveError && (
                <p
                  role="alert"
                  className="text-sm text-red-700 dark:text-red-300"
                >
                  {refundResolveError}
                </p>
              )}
              {resolvedRefundAccount && (
                <div className="rounded-xl bg-green-50 p-4 text-sm text-green-950 dark:bg-green-950/40 dark:text-green-100">
                  <p className="font-semibold">
                    {resolvedRefundAccount.accountName}
                  </p>
                  <p className="mt-1 text-green-800 dark:text-green-200">
                    {resolvedRefundAccount.bankName} · ••••
                    {resolvedRefundAccount.accountNumber.slice(-4)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-green-800 dark:text-green-200">
                    Confirm this name belongs to the customer before submitting.
                  </p>
                </div>
              )}
            </div>
          ) : action?.kind === "reattempt-refund" ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-900 dark:bg-red-950/40 dark:text-red-100">
              Confirm in Paystack that the previous refund is failed before
              continuing. Pavodah will keep the original refund audit record.
            </div>
          ) : action?.kind === "approve-payout" ? (
            <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
              Verify the amount and masked destination before continuing.
            </div>
          ) : (
            <Textarea
              aria-label={
                action?.kind === "reject-payout"
                  ? "Payout rejection reason"
                  : "Release review note"
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                action?.kind === "reject-payout"
                  ? "Required rejection reason"
                  : "Admin review note (optional)"
              }
              className="min-h-28 resize-none"
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAction(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                action?.kind === "otp"
                  ? "bg-violet-700 hover:bg-violet-800"
                  : action?.kind === "retry-refund"
                    ? "bg-amber-700 hover:bg-amber-800"
                    : action?.kind === "approve-payout" || action?.approve
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-red-700 hover:bg-red-800",
                "text-white",
              )}
              onClick={submitDialogAction}
              disabled={
                isSaving ||
                (action?.kind === "retry-refund" && !resolvedRefundAccount)
              }
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {action?.kind === "approve-payout"
                ? "Send transfer"
                : action?.kind === "retry-refund"
                  ? "Retry refund"
                  : action?.kind === "reattempt-refund"
                    ? "Resubmit refund"
                    : "Confirm action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QueueEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Icon className="mx-auto h-6 w-6 text-gray-400" />
      <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}

function QueuePagination({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  if (pagination.pages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Queue pagination"
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        disabled={pagination.page <= 1}
      >
        Previous
      </Button>
      <p className="text-sm text-gray-600">
        Page {pagination.page} of {pagination.pages} · {pagination.total} total
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onPageChange(Math.min(pagination.pages, pagination.page + 1))
        }
        disabled={pagination.page >= pagination.pages}
      >
        Next
      </Button>
    </nav>
  );
}
