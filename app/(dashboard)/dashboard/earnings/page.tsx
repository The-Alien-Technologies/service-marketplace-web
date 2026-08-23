"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Banknote,
  Building2,
  CircleDollarSign,
  Clock3,
  Landmark,
  Loader2,
  LockKeyhole,
  Phone,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiService } from "@/lib/api";
import {
  EarningsSummary,
  PayoutDestinationType,
  PayoutInstitution,
  ProviderEarning,
  ProviderPayout,
  ProviderPayoutStatus,
  SettlementStatus,
} from "@/types/payout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const money = (value: number | string = 0) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));

type Pagination = { page: number; limit: number; total: number; pages: number };

const settlementMeta: Record<
  SettlementStatus,
  { label: string; className: string }
> = {
  HELD: { label: "Held", className: "bg-amber-50 text-amber-800" },
  ELIGIBLE: { label: "Available", className: "bg-green-50 text-green-800" },
  RESERVED: { label: "In payout", className: "bg-blue-50 text-blue-800" },
  PAID: { label: "Paid", className: "bg-gray-100 text-gray-700" },
  VOID: { label: "Refunded", className: "bg-red-50 text-red-700" },
};

const payoutMeta: Record<
  ProviderPayoutStatus,
  { label: string; className: string }
> = {
  REQUESTED: {
    label: "Awaiting approval",
    className: "bg-amber-50 text-amber-800",
  },
  PROCESSING: { label: "Processing", className: "bg-blue-50 text-blue-800" },
  OTP_REQUIRED: {
    label: "Admin verification",
    className: "bg-violet-50 text-violet-800",
  },
  SUCCESS: { label: "Paid", className: "bg-green-50 text-green-800" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700" },
  REVERSED: { label: "Reversed", className: "bg-red-50 text-red-700" },
  REJECTED: { label: "Rejected", className: "bg-gray-100 text-gray-700" },
};

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<ProviderEarning[]>([]);
  const [payouts, setPayouts] = useState<ProviderPayout[]>([]);
  const [earningsPage, setEarningsPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [earningsPagination, setEarningsPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [payoutPagination, setPayoutPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(
    async (quiet = false) => {
      if (quiet) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const [summaryData, earningsData, payoutsData] = await Promise.all([
          apiService.getEarningsSummary(),
          apiService.getProviderEarnings(earningsPage, 20),
          apiService.getProviderPayouts(payoutPage, 20),
        ]);
        setSummary(summaryData);
        setEarnings(earningsData.data);
        setPayouts(payoutsData.data);
        setEarningsPagination(earningsData.pagination);
        setPayoutPagination(payoutsData.pagination);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not load earnings",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [earningsPage, payoutPage],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      await apiService.requestPayout();
      toast.success("Payout request sent for admin approval");
      setWithdrawOpen(false);
      await loadData(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not request payout",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-24 text-center">
        <p className="font-semibold text-gray-900">Earnings are unavailable</p>
        <Button variant="outline" className="mt-4" onClick={() => loadData()}>
          Try again
        </Button>
      </div>
    );
  }

  const available = Number(summary.available);
  const canWithdraw =
    available > 0 &&
    Boolean(summary.account) &&
    !summary.activePayout &&
    summary.payoutsEnabled;

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 pb-14 dark:[&_.bg-white]:bg-gray-900 dark:[&_.bg-gray-100]:bg-gray-800 dark:[&_.border-gray-200]:border-gray-700 dark:[&_.text-gray-950]:text-white dark:[&_.text-gray-900]:text-gray-100 dark:[&_.text-gray-800]:text-gray-200 dark:[&_.text-gray-700]:text-gray-300 dark:[&_.text-gray-600]:text-gray-300 dark:[&_.text-gray-500]:text-gray-400">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
            Earnings & payouts
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
            Follow every paid order from customer acceptance to your verified
            Ghana bank or mobile-money destination.
          </p>
        </div>
        <Button
          variant="outline"
          className="self-start border-gray-200 bg-white sm:self-auto"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </header>

      <section className="overflow-hidden rounded-2xl bg-[#103c25] text-white shadow-[0_14px_32px_-20px_rgba(6,78,45,0.75)]">
        <div className="grid gap-8 px-6 py-7 md:grid-cols-[1.15fr_1fr] md:px-8 md:py-9">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-100">
              <CircleDollarSign className="h-4 w-4" />
              Available to withdraw
            </div>
            <p className="mt-3 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
              {money(summary.available)}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-green-100/85">
              This balance contains only customer-accepted work, less any
              resolved chargeback adjustments. The order’s marketplace
              commission is already deducted.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="bg-white font-semibold text-green-950 hover:bg-green-50"
                onClick={() => setWithdrawOpen(true)}
                disabled={!canWithdraw}
              >
                <ArrowDownToLine className="h-4 w-4" />
                Withdraw full balance
              </Button>
              {!summary.account && (
                <Button
                  variant="outline"
                  className="border-green-300/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setAccountOpen(true)}
                >
                  Set up payout account
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-7 gap-y-6 border-green-200/20 md:border-l md:pl-8">
            <BalanceStat label="Awaiting acceptance" value={summary.held} />
            <BalanceStat label="In payout" value={summary.reserved} />
            <BalanceStat label="Paid to date" value={summary.paid} />
            <BalanceStat
              label="Balance adjustments"
              value={summary.adjustmentBalance}
              warning={Number(summary.adjustmentBalance) > 0}
            />
          </div>
        </div>
        {!summary.payoutsEnabled && (
          <div className="flex items-start gap-3 bg-amber-300 px-6 py-3 text-sm text-amber-950 md:px-8">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Live withdrawals are not enabled yet. Your eligible balance is
              recorded and will remain available when payouts launch.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Order earnings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  The release state and financial split for each paid order.
                </p>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {earningsPagination.total} total entries
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {earnings.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No earnings yet"
                  description="Paid orders will appear here as soon as their payments are verified."
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {earnings.map((earning) => {
                    const meta = settlementMeta[earning.status];
                    return (
                      <div
                        key={earning.id}
                        className="grid gap-4 px-5 py-4 transition-colors hover:bg-gray-50/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-950">
                              {earning.order.service.title}
                            </p>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-semibold",
                                meta.className,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>#{earning.order.orderNumber}</span>
                            <span aria-hidden>·</span>
                            <span>{earning.order.planTitle}</span>
                            <span aria-hidden>·</span>
                            <span>
                              {new Date(earning.createdAt).toLocaleDateString(
                                "en-GH",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-end justify-between gap-5 sm:block sm:text-right">
                          <p className="text-sm font-bold text-gray-950">
                            {money(earning.providerAmount)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            from {money(earning.grossAmount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <ListPagination
              pagination={earningsPagination}
              onPageChange={setEarningsPage}
            />
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-950">
                Payout history
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Combined transfers approved against your available balance.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {payouts.length === 0 ? (
                <EmptyState
                  icon={ArrowDownToLine}
                  title="No payout requests"
                  description="Your first full-balance withdrawal will be tracked here."
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {payouts.map((payout) => {
                    const meta = payoutMeta[payout.status];
                    return (
                      <div key={payout.id} className="px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-950">
                                {payout.institutionName} ••••{" "}
                                {payout.accountNumberLast4}
                              </p>
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
                              Requested{" "}
                              {new Date(payout.requestedAt).toLocaleString(
                                "en-GH",
                              )}
                              {payout.items?.length
                                ? ` · ${payout.items.length} orders`
                                : ""}
                            </p>
                          </div>
                          <p className="text-base font-bold text-gray-950">
                            {money(payout.amount)}
                          </p>
                        </div>
                        {(payout.failureMessage || payout.rejectionReason) && (
                          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                            {payout.failureMessage || payout.rejectionReason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <ListPagination
              pagination={payoutPagination}
              onPageChange={setPayoutPage}
            />
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-gray-950">
                  Payout destination
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Protected with phone verification
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            {summary.account ? (
              <div className="mt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-800">
                  {summary.account.type === "GHIPSS" ? (
                    <Landmark className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-950">
                  {summary.account.institutionName}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {summary.account.accountName || "Verified recipient"}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-950">
                  •••• {summary.account.accountNumberLast4}
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={() => setAccountOpen(true)}
                  disabled={Boolean(summary.activePayout)}
                >
                  Change destination
                </Button>
                {summary.activePayout && (
                  <p className="mt-2 text-xs leading-relaxed text-amber-700">
                    Destination changes are locked while a payout is active.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm leading-relaxed text-gray-600">
                  Add a Ghana bank or mobile-money account before requesting
                  your first withdrawal.
                </p>
                <Button
                  className="mt-5 w-full bg-green-700 text-white hover:bg-green-800"
                  onClick={() => setAccountOpen(true)}
                >
                  Add payout destination
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl bg-gray-100 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-950">
              <LockKeyhole className="h-4 w-4" />
              How release works
            </div>
            <ol className="mt-4 space-y-4 text-sm text-gray-600">
              {[
                "You mark the service completed.",
                "The customer accepts it, or an admin reviews your release request.",
                "You withdraw the full eligible balance for admin approval.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-xs font-bold text-green-800">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <PayoutAccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        onSaved={() => loadData(true)}
      />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-800">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <DialogTitle>Withdraw your full balance?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {money(summary.available)} will be reserved across all eligible
              orders and sent to {summary.account?.institutionName} ••••{" "}
              {summary.account?.accountNumberLast4} after admin approval.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={handleWithdraw}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BalanceStat({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number | string;
  warning?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-green-100/75">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", warning && "text-amber-200")}>
        {money(value)}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Banknote;
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <Icon className="mx-auto h-6 w-6 text-gray-400" />
      <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}

function ListPagination({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  if (pagination.pages <= 1) return null;

  return (
    <nav
      className="mt-4 flex items-center justify-between gap-4"
      aria-label="List pagination"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        disabled={pagination.page <= 1}
      >
        Previous
      </Button>
      <p className="text-xs text-gray-600">
        Page {pagination.page} of {pagination.pages}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
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

function PayoutAccountDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<PayoutDestinationType>("MOBILE_MONEY");
  const [institutions, setInstitutions] = useState<PayoutInstitution[]>([]);
  const [institutionCode, setInstitutionCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInstitutionCode("");
    setInstitutions([]);
    setIsLoadingInstitutions(true);
    apiService
      .getPayoutInstitutions(type)
      .then(setInstitutions)
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load institutions",
        ),
      )
      .finally(() => setIsLoadingInstitutions(false));
  }, [open, type]);

  const selectedInstitution = useMemo(
    () => institutions.find((item) => item.code === institutionCode),
    [institutionCode, institutions],
  );

  const sendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const result = await apiService.sendPayoutAccountOtp();
      setOtpSentTo(result.phoneNumber);
      toast.success("Verification code sent");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send code",
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const save = async () => {
    if (
      !institutionCode ||
      !accountNumber ||
      !accountName ||
      otpCode.length !== 6
    ) {
      toast.error(
        "Complete the destination details and enter the 6-digit code",
      );
      return;
    }
    setIsSaving(true);
    try {
      await apiService.updatePayoutAccount({
        type,
        institutionCode,
        accountNumber,
        accountName,
        otpCode,
      });
      toast.success("Payout destination verified");
      onOpenChange(false);
      onSaved();
      setAccountNumber("");
      setOtpCode("");
      setOtpSentTo("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save destination",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-lg dark:bg-gray-900 dark:[&_.bg-white]:bg-gray-900 dark:[&_.bg-gray-100]:bg-gray-800 dark:[&_.text-gray-950]:text-white dark:[&_.text-gray-900]:text-gray-100 dark:[&_.text-gray-800]:text-gray-200 dark:[&_.text-gray-600]:text-gray-300 dark:[&_.text-gray-500]:text-gray-400">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-800">
            <WalletCards className="h-5 w-5" />
          </div>
          <DialogTitle>Set your payout destination</DialogTitle>
          <DialogDescription>
            Paystack verifies the destination. Pavodah stores only the recipient
            token and masked account details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            {(["MOBILE_MONEY", "GHIPSS"] as PayoutDestinationType[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={type === value}
                  onClick={() => setType(value)}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    type === value
                      ? "bg-white text-gray-950 shadow-sm"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {value === "MOBILE_MONEY" ? (
                    <Phone className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {value === "MOBILE_MONEY" ? "Mobile money" : "Bank account"}
                </button>
              ),
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="payout-institution"
              className="text-sm font-semibold text-gray-800"
            >
              {type === "MOBILE_MONEY" ? "Mobile-money network" : "Bank"}
            </label>
            <Select
              value={institutionCode}
              onValueChange={setInstitutionCode}
              disabled={isLoadingInstitutions}
            >
              <SelectTrigger id="payout-institution" className="h-11 bg-white">
                <SelectValue
                  placeholder={
                    isLoadingInstitutions ? "Loading…" : "Select institution"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((institution) => (
                  <SelectItem key={institution.code} value={institution.code}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="payout-account-name"
              className="text-sm font-semibold text-gray-800"
            >
              Account holder name
            </label>
            <Input
              id="payout-account-name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Name registered on the account"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="payout-account-number"
              className="text-sm font-semibold text-gray-800"
            >
              {type === "MOBILE_MONEY"
                ? "Mobile-money number"
                : "Account number"}
            </label>
            <Input
              id="payout-account-number"
              inputMode="numeric"
              maxLength={20}
              value={accountNumber}
              onChange={(event) =>
                setAccountNumber(
                  event.target.value.replace(/\D/g, "").slice(0, 20),
                )
              }
              placeholder={
                type === "MOBILE_MONEY"
                  ? "024 000 0000"
                  : "Enter account number"
              }
              className="h-11"
            />
            {selectedInstitution && (
              <p className="text-xs text-gray-500">
                Destination: {selectedInstitution.name}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Confirm with your verified phone
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {otpSentTo
                    ? `Enter the code sent to ${otpSentTo}.`
                    : "Request a fresh code before saving this destination."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 bg-white"
                onClick={sendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {otpSentTo ? "Resend" : "Send code"}
              </Button>
            </div>
            {otpSentTo && (
              <Input
                aria-label="6-digit payout verification code"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6-digit code"
                className="mt-3 h-11 bg-white text-center text-lg font-semibold tracking-[0.25em]"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={save}
            disabled={isSaving || !otpSentTo}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify destination
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
