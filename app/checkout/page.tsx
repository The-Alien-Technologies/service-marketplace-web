"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { CheckoutHeader } from "@/components/sections/checkout/checkout-header";
import { Button } from "@/components/ui/button";
import { ApiError, apiService } from "@/lib/api";
import { canInitializePayment } from "@/lib/payment-state";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import type { Order } from "@/types/order";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";

function CheckoutContent() {
  const t = useTranslations("Checkout");
  const common = useTranslations("Common");
  const home = useTranslations("Home");
  const errors = useTranslations("Errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrderId = searchParams.get("orderId");
  const { pendingOrder, clearPendingOrder, setCreatedOrderId } =
    useOrderStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showAuth = useAuthStore((state) => state.showAuth);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);

  const existingOrderId = requestedOrderId ?? pendingOrder?.createdOrderId;

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setIsLoading(true);
      setLoadError(null);

      if (!existingOrderId) {
        if (!pendingOrder) {
          router.replace("/");
          return;
        }
        setOrder(null);
        setIsLoading(false);
        return;
      }

      try {
        const existingOrder = await apiService.getOrder(existingOrderId);
        if (!cancelled) setOrder(existingOrder);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : errors("loadFailed"),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadCheckout();
    return () => {
      cancelled = true;
    };
  }, [errors, existingOrderId, loadVersion, pendingOrder, router]);

  const summary = useMemo(() => {
    if (order) {
      return {
        serviceId: order.serviceId,
        serviceTitle: order.service.title,
        providerName:
          order.service.provider?.displayName ||
          [order.service.provider?.firstName, order.service.provider?.lastName]
            .filter(Boolean)
            .join(" ") ||
          t("serviceProvider"),
        planName: order.planTitle || t("customService"),
        planPrice: Number(order.planPrice ?? order.total),
        addOns: order.addOns ?? [],
        addOnsTotal: Number(order.addOnsTotal ?? 0),
        total: Number(order.total),
        currency: order.currency,
        orderNumber: order.orderNumber,
      };
    }

    if (!pendingOrder) return null;
    return {
      serviceId: pendingOrder.serviceId,
      serviceTitle: pendingOrder.service.title,
      providerName: t("serviceProvider"),
      planName: pendingOrder.plan.name,
      planPrice: pendingOrder.plan.price,
      addOns: pendingOrder.addOns.map((addon) => ({
        id: addon.id,
        addonId: addon.id,
        title: addon.name,
        description: addon.description,
        price: addon.price,
      })),
      addOnsTotal: pendingOrder.addOnsTotal,
      total: pendingOrder.subtotal,
      currency: pendingOrder.currency,
      orderNumber: null,
    };
  }, [order, pendingOrder, t]);

  const handleContinueToPaystack = async () => {
    setPaymentError(null);

    if (!isAuthenticated) {
      showAuth("signin");
      return;
    }

    setIsPaying(true);

    try {
      let payableOrder = order;

      if (!payableOrder) {
        if (!pendingOrder) throw new Error(t("missingDetails"));
        payableOrder = await apiService.createOrder({
          serviceId: pendingOrder.serviceId,
          planId: pendingOrder.plan.id,
          addOnIds: pendingOrder.addOns.map((addon) => addon.id),
          checkoutKey: pendingOrder.checkoutKey,
        });
        setOrder(payableOrder);
        setCreatedOrderId(payableOrder.id);
      }

      if (!canInitializePayment(payableOrder.paymentStatus)) {
        router.push(`/dashboard/orders/${payableOrder.id}`);
        return;
      }

      const payment = await apiService.initializePayment(payableOrder.id);
      if (!payment.authorizationUrl) {
        throw new Error(t("missingLink"));
      }

      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setIsPaying(false);
        showAuth("signin");
        return;
      }
      setPaymentError(
        error instanceof Error ? error.message : t("startFailed"),
      );
      setIsPaying(false);
    }
  };

  const handleCancel = () => {
    if (!requestedOrderId) clearPendingOrder();
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main
          className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
            <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
            <span>{t("preparing")}</span>
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
          <section className="w-full rounded-2xl bg-white p-5 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] sm:p-8 dark:bg-gray-900">
            <AlertCircle className="mb-5 h-10 w-10 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-950 dark:text-white">
              {t("prepareFailed")}
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              {loadError || t("detailsUnavailable")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => setLoadVersion((value) => value + 1)}>
                {common("retry")}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                {home("browseServices")}
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const isNotPayable = order
    ? !canInitializePayment(order.paymentStatus)
    : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <CheckoutHeader
        providerName={summary.providerName}
        serviceId={summary.serviceId}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-start lg:gap-10">
          <section className="min-w-0 pt-2">
            <p className="text-sm font-semibold text-brand-800 dark:text-brand-400">
              {t("hosted")}
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-[-0.025em] text-gray-950 sm:text-4xl dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("intro")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
              <Image
                src="/assets/icons/paystack.svg"
                alt="Paystack"
                width={154}
                height={41}
                className="h-auto w-[154px]"
                priority
              />
              <span className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <LockKeyhole className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("encrypted")}
              </div>
            </div>

            <div className="mt-10 max-w-xl space-y-4 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-400" />
                <p>{t("workAfterPayment")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-400" />
                <p>{t("safeRetry")}</p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="order-summary-heading"
            className="rounded-2xl bg-white p-4 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.38)] sm:p-7 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="order-summary-heading"
                  className="text-xl font-bold text-gray-950 dark:text-white"
                >
                  {t("orderSummary")}
                </h2>
                <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                  {summary.serviceTitle}
                </p>
              </div>
              {summary.orderNumber && (
                <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                  #{summary.orderNumber}
                </span>
              )}
            </div>

            <dl className="mt-7 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="min-w-0 text-gray-600 dark:text-gray-300">
                  <span className="block truncate">{summary.planName}</span>
                </dt>
                <dd className="shrink-0 font-medium text-gray-950 dark:text-white">
                  {formatMoney(summary.planPrice, summary.currency)}
                </dd>
              </div>

              {summary.addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="min-w-0 text-gray-600 dark:text-gray-300">
                    <span className="block truncate">{addon.title}</span>
                  </dt>
                  <dd className="shrink-0 font-medium text-gray-950 dark:text-white">
                    {formatMoney(addon.price, summary.currency)}
                  </dd>
                </div>
              ))}

              {summary.addOns.length === 0 && (
                <div className="flex justify-between gap-4 text-gray-500 dark:text-gray-400">
                  <dt>{t("addOns")}</dt>
                  <dd>{common("none")}</dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex items-end justify-between gap-4 border-t border-gray-200 pt-5 dark:border-gray-700">
              <span className="font-semibold text-gray-950 dark:text-white">
                {t("totalDue")}
              </span>
              <span className="text-2xl font-bold tracking-[-0.02em] text-gray-950 dark:text-white">
                {formatMoney(summary.total, summary.currency)}
              </span>
            </div>

            {paymentError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {paymentError} {t("savedRetry")}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                size="lg"
                className="h-12 w-full bg-brand-800 text-white hover:bg-brand-900"
                onClick={handleContinueToPaystack}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("opening")}
                  </>
                ) : isNotPayable ? (
                  t("viewStatus")
                ) : !isAuthenticated ? (
                  t("signInToPay", {
                    amount: formatMoney(summary.total, summary.currency),
                  })
                ) : (
                  t("pay", {
                    amount: formatMoney(summary.total, summary.currency),
                  })
                )}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full text-gray-700 dark:text-gray-200"
                onClick={handleCancel}
                disabled={isPaying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("returnService")}
              </Button>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
              {t("paymentPrivacy")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}
    >
      <CheckoutContent />
    </Suspense>
  );
}
