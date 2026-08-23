"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  FileClock,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiService } from "@/lib/api";
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

const money = (value: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(value);

export default function SystemSettingsPage() {
  const [commissionRate, setCommissionRate] = useState("10");
  const [savedRate, setSavedRate] = useState(10);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSettings = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    apiService
      .getPaymentSettings()
      .then((settings) => {
        const rate = Number(settings.commissionRate);
        setCommissionRate(String(rate));
        setSavedRate(rate);
        setUpdatedAt(settings.updatedAt);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load payment settings";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const parsedRate = Number(commissionRate);
  const isValid =
    Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100;
  const hasChanges = isValid && parsedRate !== savedRate;
  const example = useMemo(
    () => ({
      commission: isValid ? parsedRate : 0,
      provider: isValid ? 100 - parsedRate : 100,
    }),
    [isValid, parsedRate],
  );

  const save = async () => {
    if (!isValid) {
      toast.error("Commission must be between 0% and 100%");
      return;
    }
    setIsSaving(true);
    try {
      const settings = await apiService.updatePaymentSettings(parsedRate);
      const rate = Number(settings.commissionRate);
      setSavedRate(rate);
      setCommissionRate(String(rate));
      setUpdatedAt(settings.updatedAt);
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
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
          System settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
          Control the marketplace financial policy while preserving the exact
          rate promised on every existing order.
        </p>
      </header>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
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
          <Button variant="outline" className="mt-5" onClick={loadSettings}>
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
                  Pavodah absorbs Paystack collection and payout fees from this
                  share.
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-sm">
              <label
                htmlFor="commission"
                className="text-sm font-semibold text-gray-800"
              >
                Commission rate
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
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                  %
                </span>
              </div>
              {!isValid && (
                <p className="mt-2 text-sm text-red-700">
                  Enter a rate from 0% through 100%.
                </p>
              )}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl bg-gray-100">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-5">
                  <p className="text-xs font-medium text-gray-500">
                    Pavodah receives
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-950">
                    {money(example.commission)}
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-gray-500">
                    Provider receives
                  </p>
                  <p className="mt-1 text-xl font-bold text-green-800">
                    {money(example.provider)}
                  </p>
                </div>
              </div>
              <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-600">
                Example split for a retained order amount of GHS 100.00.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {updatedAt
                  ? `Last updated ${new Date(updatedAt).toLocaleString("en-GH")}`
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
                Partial refunds recalculate the same order rate over the amount
                retained, so Pavodah and the provider share the reduction
                proportionally.
              </p>
            </div>
          </aside>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Change commission to {parsedRate}%?</DialogTitle>
            <DialogDescription>
              This applies to every order created after you save it. Existing
              orders keep their original commission snapshot.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            On a retained GHS 100.00 order, Pavodah receives{" "}
            {money(example.commission)} and the provider receives{" "}
            {money(example.provider)}.
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
