"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleDollarSign,
  FileClock,
  Handshake,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiService } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Market } from "@/types/market";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const money = (value: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);

export default function SystemSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [commissionRate, setCommissionRate] = useState("10");
  const [savedRate, setSavedRate] = useState(10);
  const [pavodahShareRate, setPavodahShareRate] = useState("50");
  const [savedPavodahShareRate, setSavedPavodahShareRate] = useState(50);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [marketName, setMarketName] = useState("your country");
  const [currency, setCurrency] = useState("GHS");
  const [locale, setLocale] = useState("en-GH");
  const loadSequence = useRef(0);

  const loadSettings = useCallback((marketId?: string) => {
    const requestSequence = ++loadSequence.current;
    setIsLoading(true);
    setLoadError(null);
    apiService
      .getPaymentSettings(marketId)
      .then((settings) => {
        if (requestSequence !== loadSequence.current) return;
        const rate = Number(settings.commissionRate);
        const centralRate = Number(settings.pavodahShareRate);
        setCommissionRate(String(rate));
        setSavedRate(rate);
        setPavodahShareRate(String(centralRate));
        setSavedPavodahShareRate(centralRate);
        setUpdatedAt(settings.updatedAt);
        setMarketName(settings.market.name);
        setCurrency(settings.market.currency);
        setLocale(settings.market.locale);
      })
      .catch((error) => {
        if (requestSequence !== loadSequence.current) return;
        const message =
          error instanceof Error
            ? error.message
            : "Could not load payment settings";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (requestSequence === loadSequence.current) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      loadSettings();
      return;
    }
    setIsLoading(true);
    apiService
      .getAllMarkets()
      .then((result) => {
        setMarkets(result);
        setSelectedMarketId((current) => current || result[0]?.id || "");
        if (result.length === 0) {
          setLoadError("No country markets have been configured");
          setIsLoading(false);
        }
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error ? error.message : "Could not load markets",
        );
        setIsLoading(false);
      });
  }, [isSuperAdmin, loadSettings]);

  useEffect(() => {
    if (isSuperAdmin && selectedMarketId) loadSettings(selectedMarketId);
  }, [isSuperAdmin, loadSettings, selectedMarketId]);

  const parsedRate = Number(commissionRate);
  const parsedPavodahShareRate = Number(pavodahShareRate);
  const isCommissionValid =
    commissionRate.trim() !== "" &&
    Number.isFinite(parsedRate) &&
    parsedRate >= 0 &&
    parsedRate <= 100;
  const isPavodahShareValid =
    pavodahShareRate.trim() !== "" &&
    Number.isFinite(parsedPavodahShareRate) &&
    parsedPavodahShareRate >= 0 &&
    parsedPavodahShareRate <= 100;
  const isValid = isCommissionValid && isPavodahShareValid;
  const hasChanges =
    isValid &&
    (parsedRate !== savedRate ||
      (isSuperAdmin && parsedPavodahShareRate !== savedPavodahShareRate));
  const example = useMemo(() => {
    const commission = isCommissionValid ? parsedRate : 0;
    const pavodah = isPavodahShareValid
      ? (commission * parsedPavodahShareRate) / 100
      : 0;
    return {
      commission,
      provider: 100 - commission,
      pavodah,
      partner: commission - pavodah,
    };
  }, [
    isCommissionValid,
    isPavodahShareValid,
    parsedPavodahShareRate,
    parsedRate,
  ]);

  const save = async () => {
    if (!isValid) {
      toast.error("Both percentages must be between 0% and 100%");
      return;
    }
    setIsSaving(true);
    const marketIdAtSave = isSuperAdmin ? selectedMarketId : undefined;
    try {
      const settings = await apiService.updatePaymentSettings(
        parsedRate,
        marketIdAtSave,
        isSuperAdmin ? parsedPavodahShareRate : undefined,
      );
      if (
        marketIdAtSave &&
        settings.market.id !== selectedMarketId
      ) {
        toast.success("Commission updated for the selected country");
        return;
      }
      const rate = Number(settings.commissionRate);
      const centralRate = Number(settings.pavodahShareRate);
      setSavedRate(rate);
      setCommissionRate(String(rate));
      setSavedPavodahShareRate(centralRate);
      setPavodahShareRate(String(centralRate));
      setUpdatedAt(settings.updatedAt);
      setMarketName(settings.market.name);
      setCurrency(settings.market.currency);
      setLocale(settings.market.locale);
      setConfirmOpen(false);
      toast.success("Commission updated for future orders");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-14 dark:[&_.bg-white]:bg-gray-900 dark:[&_.bg-gray-100]:bg-gray-800 dark:[&_.border-gray-200]:border-gray-700 dark:[&_.text-gray-950]:text-white dark:[&_.text-gray-900]:text-gray-100 dark:[&_.text-gray-800]:text-gray-200 dark:[&_.text-gray-700]:text-gray-300 dark:[&_.text-gray-600]:text-gray-300 dark:[&_.text-gray-500]:text-gray-400">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
            Payment settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
            Control each country&apos;s financial policy while preserving the
            exact rate promised on every existing order.
          </p>
        </div>
        {isSuperAdmin && markets.length > 0 && (
          <Select
            value={selectedMarketId}
            onValueChange={setSelectedMarketId}
            disabled={isSaving || confirmOpen}
          >
            <SelectTrigger className="w-full bg-white sm:w-56">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.id} value={market.id}>
                  {market.name} · {market.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {isLoading ? (
        <div
          className="flex min-h-[40vh] items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-green-700"
            aria-hidden="true"
          />
          <span className="sr-only">Loading payment settings</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="font-semibold text-red-900">
            Payment settings could not be loaded
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-red-700">
            {loadError}. Editing is disabled so an unknown commission is never
            replaced by the displayed fallback.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() =>
              loadSettings(isSuperAdmin ? selectedMarketId : undefined)
            }
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Marketplace commission
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
                  This percentage is deducted from the retained order amount.
                  Paystack collection and payout fees are recorded separately
                  from this allocation.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="commission"
                  className="text-sm font-semibold text-gray-800"
                >
                  Order commission
                </label>
                <div className="relative mt-2">
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(event.target.value)}
                    className="h-12 pr-12 text-base font-semibold"
                    aria-invalid={!isCommissionValid}
                    aria-describedby="commission-help commission-error"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                    %
                  </span>
                </div>
                {!isCommissionValid && (
                  <p
                    id="commission-error"
                    className="mt-2 text-sm text-red-700"
                  >
                    Enter a commission from 0% through 100%.
                  </p>
                )}
                <p id="commission-help" className="sr-only">
                  Percentage deducted from the retained order amount.
                </p>
              </div>

              <div>
                <label
                  htmlFor="pavodah-share"
                  className="text-sm font-semibold text-gray-800"
                >
                  Pavodah share of commission
                </label>
                <div className="relative mt-2">
                  <Input
                    id="pavodah-share"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={pavodahShareRate}
                    onChange={(event) =>
                      setPavodahShareRate(event.target.value)
                    }
                    disabled={!isSuperAdmin}
                    className="h-12 pr-12 text-base font-semibold"
                    aria-invalid={!isPavodahShareValid}
                    aria-describedby="pavodah-share-help pavodah-share-error"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                    %
                  </span>
                </div>
                {!isPavodahShareValid ? (
                  <p
                    id="pavodah-share-error"
                    className="mt-2 text-sm text-red-700"
                  >
                    Enter a share from 0% through 100%.
                  </p>
                ) : (
                  <p
                    id="pavodah-share-help"
                    className="mt-2 text-xs leading-relaxed text-gray-500"
                  >
                    {isSuperAdmin
                      ? "The country partner receives the remainder of the commission."
                      : "Only a super administrator can change this split."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl bg-gray-100">
              <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-gray-200">
                <div className="p-5">
                  <p className="text-xs font-medium text-gray-500">
                    Provider receives
                  </p>
                  <p className="mt-1 text-xl font-bold text-green-800">
                    {money(example.provider, currency, locale)}
                  </p>
                </div>
                <div className="border-t border-gray-200 p-5 sm:border-t-0">
                  <p className="text-xs font-medium text-gray-500">
                    Country partner receives
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-950">
                    {money(example.partner, currency, locale)}
                  </p>
                </div>
                <div className="border-t border-gray-200 p-5 sm:border-t-0">
                  <p className="text-xs font-medium text-gray-500">
                    Pavodah receives
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-950">
                    {money(example.pavodah, currency, locale)}
                  </p>
                </div>
              </div>
              <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-600">
                Example for a retained {money(100, currency, locale)} order in{" "}
                {marketName}. The {money(example.commission, currency, locale)}
                commission is divided only after the provider share is set
                aside.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {updatedAt
                  ? `Last updated ${new Date(updatedAt).toLocaleString(locale)}`
                  : "No recorded changes"}
              </p>
              <Button
                className="bg-green-700 text-white hover:bg-green-800"
                onClick={() => setConfirmOpen(true)}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save for future orders
              </Button>
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <Handshake className="h-5 w-5 text-green-800" />
              <h2 className="mt-4 text-sm font-bold text-gray-950">
                Local collection, delayed release
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Customer funds stay refundable in the Pavodah-controlled local
                collection account. Provider and partner balances become
                withdrawable after acceptance; each payout is transferred and
                reconciled independently.
              </p>
            </div>
            <div className="rounded-xl bg-[#103c25] p-5 text-white">
              <ShieldCheck className="h-5 w-5 text-green-200" />
              <h2 className="mt-4 text-sm font-bold">
                Historical rates are locked
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-green-100/85">
                Changing the setting never alters an order already created. Its
                original commission snapshot remains authoritative through
                refunds and payouts.
              </p>
            </div>
            <div className="rounded-xl bg-gray-100 p-5">
              <FileClock className="h-5 w-5 text-gray-700" />
              <h2 className="mt-4 text-sm font-bold text-gray-950">
                Refund behavior
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Partial refunds recalculate all three allocations over the
                amount retained, using the commission and Pavodah-share rates
                captured when the order was created.
              </p>
            </div>
          </aside>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Save the new payment allocation?</DialogTitle>
            <DialogDescription>
              New orders will use a {parsedRate}% commission
              {isSuperAdmin
                ? ` with ${parsedPavodahShareRate}% of that commission assigned to Pavodah.`
                : "."}{" "}
              Existing orders keep their original allocation.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            On a retained {money(100, currency, locale)} order in {marketName},
            the provider receives {money(example.provider, currency, locale)},
            the country partner receives{" "}
            {money(example.partner, currency, locale)}, and Pavodah receives{" "}
            {money(example.pavodah, currency, locale)}.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={save}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save new rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
