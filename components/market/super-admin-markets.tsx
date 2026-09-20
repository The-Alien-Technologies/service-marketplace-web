"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe2,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { marketDisplayName } from "@/lib/market-display";
import { isPaymentIntegrationReady } from "@/lib/payment-readiness";
import { Market, MarketStatus, PaymentIntegration } from "@/types/market";

function statusStyles(status: MarketStatus) {
  if (status === "ACTIVE") return "border-green-200 bg-green-50 text-green-800";
  if (status === "PAUSED") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-gray-200 bg-gray-100 text-gray-700";
}

export function SuperAdminMarkets() {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MarketStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [marketData, integrationData] = await Promise.all([
        apiService.getAllMarkets({
          search: search.trim() || undefined,
          status: status === "ALL" ? undefined : status,
        }),
        apiService.getPaymentIntegrations(),
      ]);
      setMarkets(marketData);
      setIntegrations(integrationData);
    } catch (error) {
      setLoadError(true);
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 300);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const filteredMarkets = markets;

  const integrationFor = (marketId: string) =>
    integrations.find((integration) => integration.market.id === marketId);

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-700">
            {t("countryOperations")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            {t("marketsTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
            {t("marketsBody")}
          </p>
        </div>
        <Link
          href="/dashboard/country-administrators"
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {t("manageAdministrators")}
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchMarkets")}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as MarketStatus | "ALL")}
          >
            <SelectTrigger
              className="w-full sm:w-44"
              aria-label={t("filterByStatus")}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("marketStatus.ACTIVE")}</SelectItem>
              <SelectItem value="PAUSED">{t("marketStatus.PAUSED")}</SelectItem>
              <SelectItem value="INACTIVE">
                {t("marketStatus.INACTIVE")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-green-700" />
          </div>
        ) : loadError ? (
          <div className="px-6 py-16 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-gray-400" />
            <h2 className="mt-4 font-semibold text-gray-900">
              {t("loadFailed")}
            </h2>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => void refresh()}
            >
              {t("tryAgain")}
            </Button>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-gray-400" />
            <h2 className="mt-4 font-semibold text-gray-900">
              {t("noMarketsFound")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("adjustMarketFilters")}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-5 py-3.5">{t("market")}</th>
                    <th className="px-4 py-3.5">{t("status")}</th>
                    <th className="px-4 py-3.5 text-right">
                      {t("administrators")}
                    </th>
                    <th className="px-4 py-3.5 text-right">{t("providers")}</th>
                    <th className="px-4 py-3.5 text-right">{t("orders")}</th>
                    <th className="px-4 py-3.5">{t("operations")}</th>
                    <th className="px-4 py-3.5">{t("payment")}</th>
                    <th className="px-5 py-3.5">
                      <span className="sr-only">{t("manage")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMarkets.map((market) => {
                    const integration = integrationFor(market.id);
                    const configured = isPaymentIntegrationReady(integration);
                    const enabledCount = [
                      market.checkoutEnabled,
                      market.providerOnboardingEnabled,
                      market.servicePublishingEnabled,
                    ].filter(Boolean).length;
                    return (
                      <tr
                        key={market.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-950">
                            {marketDisplayName(locale, market)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {market.code} · {market.currency} · {market.locale}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={statusStyles(market.status)}
                          >
                            {t(`marketStatus.${market.status}`)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-800">
                          {market._count?.admins ?? 0}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {market._count?.providerMemberships ?? 0}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {market._count?.orders ?? 0}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {t("operationsEnabled", { count: enabledCount })}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-gray-700">
                            {configured ? (
                              <CheckCircle2 className="h-4 w-4 text-green-700" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-amber-600" />
                            )}
                            {configured ? t("configured") : t("needsKey")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/markets/${market.id}`}
                            className={buttonVariants({
                              size: "sm",
                              variant: "ghost",
                            })}
                          >
                            {t("manage")}{" "}
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {filteredMarkets.map((market) => {
                const integration = integrationFor(market.id);
                const configured = isPaymentIntegrationReady(integration);
                const enabledCount = [
                  market.checkoutEnabled,
                  market.providerOnboardingEnabled,
                  market.servicePublishingEnabled,
                ].filter(Boolean).length;
                return (
                  <Link
                    key={market.id}
                    href={`/dashboard/markets/${market.id}`}
                    className="block p-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-950">
                          {marketDisplayName(locale, market)}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                          {market.code} · {market.currency}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusStyles(market.status)}
                      >
                        {t(`marketStatus.${market.status}`)}
                      </Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-gray-500">{t("administrators")}</dt>
                        <dd className="mt-1 font-semibold text-gray-900">
                          {market._count?.admins ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{t("providers")}</dt>
                        <dd className="mt-1 font-semibold text-gray-900">
                          {market._count?.providerMemberships ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{t("orders")}</dt>
                        <dd className="mt-1 font-semibold text-gray-900">
                          {market._count?.orders ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{t("operations")}</dt>
                        <dd className="mt-1 font-semibold text-gray-900">
                          {t("operationsEnabled", { count: enabledCount })}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      {configured ? (
                        <CheckCircle2 className="h-4 w-4 text-green-700" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-amber-600" />
                      )}
                      {t("payment")}:{" "}
                      {configured ? t("configured") : t("needsKey")}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
