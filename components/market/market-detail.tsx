"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { marketDisplayName } from "@/lib/market-display";
import { isPaymentIntegrationReady } from "@/lib/payment-readiness";
import { PartnerPayoutPanel } from "./partner-payout-panel";
import {
  CountryAdministrator,
  Market,
  PaymentIntegration,
} from "@/types/market";

export function MarketDetail({ marketId }: { marketId: string }) {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const [market, setMarket] = useState<Market | null>(null);
  const [integration, setIntegration] = useState<PaymentIntegration | null>(
    null,
  );
  const [administrators, setAdministrators] = useState<CountryAdministrator[]>(
    [],
  );
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState<string | null>("load");
  const [loadError, setLoadError] = useState(false);
  const [credentialToActivate, setCredentialToActivate] = useState<
    string | null
  >(null);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

  const refresh = useCallback(async () => {
    setBusy("load");
    setLoadError(false);
    const [marketResult, integrationResult, adminResult] =
      await Promise.allSettled([
        apiService.getAllMarkets(),
        apiService.getPaymentIntegrations(),
        apiService.getCountryAdministrators({ marketId }),
      ]);
    if (marketResult.status === "fulfilled") {
      setMarket(
        marketResult.value.find((item) => item.id === marketId) ?? null,
      );
    } else {
      setMarket(null);
      setLoadError(true);
    }
    if (integrationResult.status === "fulfilled") {
      setIntegration(
        integrationResult.value.find((item) => item.market.id === marketId) ??
          null,
      );
    } else {
      setLoadError(true);
    }
    if (adminResult.status === "fulfilled") {
      setAdministrators(adminResult.value);
    } else {
      setLoadError(true);
    }
    if (
      [marketResult, integrationResult, adminResult].some(
        (result) => result.status === "rejected",
      )
    ) {
      toast.error(t("loadFailed"));
    }
    setBusy(null);
  }, [marketId, t]);

  useEffect(() => void refresh(), [refresh]);

  const updateMarket = async (change: Partial<Market>) => {
    if (!market) return;
    setBusy("market");
    try {
      await apiService.updateMarket(market.id, change);
      toast.success(
        t("marketUpdated", { market: marketDisplayName(locale, market) }),
      );
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
      setBusy(null);
    }
  };

  const stageCredential = async () => {
    if (!integration || !secret.trim()) return toast.error(t("secretRequired"));
    setBusy("credential");
    try {
      await apiService.stagePaymentCredential(integration.id, secret.trim());
      setSecret("");
      toast.success(t("credentialStaged"));
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
      setBusy(null);
    }
  };

  const credentialAction = async (
    id: string,
    action: "activate" | "revoke",
  ) => {
    setBusy(id);
    try {
      if (action === "activate") await apiService.activatePaymentCredential(id);
      else await apiService.revokePaymentCredential(id);
      toast.success(
        action === "activate"
          ? t("credentialActivated")
          : t("credentialRevoked"),
      );
      await refresh();
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
      setBusy(null);
      return false;
    }
  };

  if (busy === "load" && !market) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-950">
          {loadError ? t("loadFailed") : t("marketNotFound")}
        </h1>
        {loadError ? (
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => void refresh()}
          >
            {t("tryAgain")}
          </Button>
        ) : (
          <Link
            href="/dashboard/markets"
            className={buttonVariants({
              variant: "outline",
              className: "mt-5",
            })}
          >
            {t("backToMarkets")}
          </Link>
        )}
      </div>
    );
  }

  const paymentReady = isPaymentIntegrationReady(integration);
  const displayName = marketDisplayName(locale, market);

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <Link
        href="/dashboard/markets"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-950"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToMarkets")}
      </Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-700">
            {t("countryOperations")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            {displayName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {market.code} · {market.currency} · {market.locale}
          </p>
        </div>
        <Select
          value={market.status}
          onValueChange={(value) =>
            void updateMarket({ status: value as Market["status"] })
          }
          disabled={busy === "market"}
        >
          <SelectTrigger
            className="w-full bg-white sm:w-40"
            aria-label={t("marketStatusLabel")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">{t("marketStatus.ACTIVE")}</SelectItem>
            <SelectItem value="PAUSED">{t("marketStatus.PAUSED")}</SelectItem>
            <SelectItem value="INACTIVE">
              {t("marketStatus.INACTIVE")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("partialLoadFailed")}</span>
          <Button size="sm" variant="outline" onClick={() => void refresh()}>
            {t("tryAgain")}
          </Button>
        </div>
      )}

      <Tabs defaultValue="overview" className="mt-7 gap-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 min-w-max bg-gray-200/70 p-1">
            <TabsTrigger value="overview" className="px-4">
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger value="operations" className="px-4">
              {t("operations")}
            </TabsTrigger>
            <TabsTrigger value="payments" className="px-4">
              {t("payments")}
            </TabsTrigger>
            <TabsTrigger value="administrators" className="px-4">
              {t("administrators")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              {t("marketOverview")}
            </h2>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
              {[
                [t("administrators"), market._count?.admins ?? 0],
                [t("providers"), market._count?.providerMemberships ?? 0],
                [t("services"), market._count?.services ?? 0],
                [t("orders"), market._count?.orders ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white p-4 sm:p-5">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="mt-2 text-2xl font-bold text-gray-950">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              {paymentReady ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
              ) : (
                <CreditCard className="mt-0.5 h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {paymentReady
                    ? t("paymentReady")
                    : t("paymentNeedsAttention")}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {paymentReady
                    ? t("paymentReadyBody")
                    : t("paymentNeedsAttentionBody")}
                </p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="operations">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              {t("operationalControls")}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("operationalControlsBody")}
            </p>
            <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200">
              {(
                [
                  ["checkoutEnabled", t("checkout"), t("checkoutHelp")],
                  [
                    "providerOnboardingEnabled",
                    t("providerOnboarding"),
                    t("providerOnboardingHelp"),
                  ],
                  [
                    "servicePublishingEnabled",
                    t("publishing"),
                    t("publishingHelp"),
                  ],
                ] as const
              ).map(([field, label, help]) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-5 p-4 sm:p-5"
                >
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="mt-1 text-sm text-gray-500">{help}</p>
                  </div>
                  <Switch
                    checked={market[field]}
                    disabled={busy === "market"}
                    onCheckedChange={(checked) =>
                      void updateMarket({ [field]: checked })
                    }
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="payments">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-800">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-950">
                    {t("paystackCredentials")}
                  </h2>
                  {integration && (
                    <Badge variant="outline">
                      {t(`integrationStatus.${integration.status}`)}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {t("paymentSecurityBody")}
                </p>
              </div>
            </div>
            {!integration ? (
              <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                {t("noPaymentIntegration")}
              </p>
            ) : (
              <div className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    placeholder={t("paystackSecretKey")}
                    aria-label={t("paystackSecretKeyAria", {
                      market: displayName,
                    })}
                  />
                  <Button
                    onClick={() => void stageCredential()}
                    disabled={busy === "credential"}
                    className="shrink-0"
                  >
                    {busy === "credential" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("stageNewKey")}
                  </Button>
                </div>
                <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {integration.credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          v{credential.version} · …
                          {credential.fingerprint.slice(-8)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {t(`credentialStatus.${credential.status}`)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {(credential.status === "STAGED" ||
                          (credential.status === "ACTIVE" &&
                            !credential.ownershipAttestedAt)) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setOwnershipConfirmed(false);
                              setCredentialToActivate(credential.id);
                            }}
                            disabled={busy === credential.id}
                          >
                            {credential.status === "ACTIVE"
                              ? t("attestOwnership")
                              : t("activate")}
                          </Button>
                        )}
                        {(credential.status === "STAGED" ||
                          credential.status === "RETIRING") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void credentialAction(credential.id, "revoke")
                            }
                            disabled={busy === credential.id}
                          >
                            {t("revoke")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const base =
                      process.env.NEXT_PUBLIC_API_URL ||
                      "http://localhost:3000/api";
                    void navigator.clipboard.writeText(
                      `${base}/payments/paystack/${integration.webhookKey}/webhook`,
                    );
                    toast.success(t("webhookCopied"));
                  }}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-green-800 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  <Copy className="h-4 w-4" /> {t("copyWebhookUrl")}
                </button>
              </div>
            )}
          </section>
          {paymentReady && <PartnerPayoutPanel market={market} />}
        </TabsContent>

        <TabsContent value="administrators">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  {t("marketAdministrators")}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {t("marketAdministratorsBody")}
                </p>
              </div>
              <Link
                href={`/dashboard/country-administrators?marketId=${market.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("manageAdministrators")}
              </Link>
            </div>
            {administrators.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <Users className="mx-auto h-7 w-7 text-gray-400" />
                <p className="mt-3 font-medium text-gray-900">
                  {t("noMarketAdministrators")}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {t("noMarketAdministratorsBody")}
                </p>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200">
                {administrators.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {admin.displayName ||
                          [admin.firstName, admin.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          admin.email}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {admin.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        admin.status === "ACTIVE"
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }
                    >
                      {t(`adminStatus.${admin.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
      <Dialog
        open={credentialToActivate !== null}
        onOpenChange={(open) => {
          if (!open && busy !== credentialToActivate) {
            setCredentialToActivate(null);
            setOwnershipConfirmed(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmPavodahOwnershipTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmPavodahOwnershipBody", { market: displayName })}
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-sm leading-relaxed text-gray-700">
            <Checkbox
              className="mt-0.5"
              checked={ownershipConfirmed}
              onCheckedChange={(checked) =>
                setOwnershipConfirmed(checked === true)
              }
            />
            <span>{t("confirmPavodahOwnershipCheckbox")}</span>
          </label>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCredentialToActivate(null)}
              disabled={busy === credentialToActivate}
            >
              {t("cancel")}
            </Button>
            <Button
              disabled={
                !ownershipConfirmed || busy === credentialToActivate
              }
              onClick={() => {
                if (!credentialToActivate) return;
                const id = credentialToActivate;
                void credentialAction(id, "activate").then((succeeded) => {
                  if (succeeded) {
                    setCredentialToActivate(null);
                    setOwnershipConfirmed(false);
                  }
                });
              }}
            >
              {busy === credentialToActivate && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("confirmAndActivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
