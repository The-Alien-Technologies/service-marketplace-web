import { use } from "react";
import { Header } from "@/components/layout/header";
import Image from "next/image";
import Link from "next/link";
import { Mail, Info } from "lucide-react";
import {
  mockOrders,
  progressStages,
  type OrderWithSummary,
} from "@/lib/orders-data";
import {useFormatter, useTranslations} from "next-intl";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

function getStatusLabel(status: OrderWithSummary["status"]) {
  if (status === "in-progress") return "In-progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const t = useTranslations("Orders");
  const common = useTranslations("Common");
  const format = useFormatter();
  const { id } = use(params);

  const order = mockOrders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-center text-gray-600 dark:text-gray-300">
            {t("notFound")}
          </p>
        </main>
      </div>
    );
  }

  const isDeclined = order.status === "declined";
  const statusLabel = (status: OrderWithSummary["status"] | string) =>
    t(status === "in-progress" ? "inProgress" : status as "awaiting" | "completed" | "declined");
  const stageLabel = (index: number) =>
    t(index === 0 ? "stagePlaced" : index === 1 ? "stageProgress" : "stageDelivered");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t("title")}
        </h1>

        {/* Status tabs (shared top section) */}
        <div className="mb-6">
          <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1 py-1">
            {["awaiting", "in-progress", "completed", "declined"].map(
              (statusKey) => {
                const label = statusLabel(statusKey);

                const isActive = order.status === statusKey;

                return (
                  <Link
                    key={statusKey}
                    href="/orders"
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white dark:bg-gray-900 text-brand-800 dark:text-brand-400 shadow-sm"
                        : "bg-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              }
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1">
          <Link
            href="/orders"
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            {t("title")}
          </Link>
          <span>/</span>
          <span>{statusLabel(order.status)}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {t("orderId", {id: order.orderId})}
          </span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={order.providerAvatar}
              alt={order.providerName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {order.providerName}
            </span>
            <Link
              href={`/services/${order.id}`}
              className="text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 text-sm"
            >
              {t("viewProfile")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-8">
          {/* Left side - summary + progress */}
          <div className="space-y-6">
            {/* Order meta */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("orderId", {id: order.orderId})}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {order.serviceCategory}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-xs font-medium text-orange-700 border border-orange-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {statusLabel(order.status)}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 sm:shrink-0">
                {order.date}
              </span>
            </div>

            {/* Order summary card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("orderSummary")}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("orderId", {id: order.orderId})}
                  </p>
                </div>
              </div>
              <div className="px-4 py-4 text-sm sm:px-6">
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("basicPlanSubtotal")}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {format.number(order.orderSummary.subtotal, {style: "currency", currency: "GHS"})}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("addOns")}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {format.number(order.orderSummary.addOns, {style: "currency", currency: "GHS"})}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("couponDiscount")}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{format.number(order.orderSummary.couponDiscount, {style: "currency", currency: "GHS"})}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">{common("total")}</span>
                  <span className="text-gray-900 dark:text-white">
                    {format.number(order.orderSummary.total, {style: "currency", currency: "GHS"})}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-brand-600 rounded-full"
                  style={{
                    width: `${
                      ((order.progressStage + 1) / progressStages.length) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                {progressStages.map((stage, index) => (
                  <span
                    key={stage}
                    className={`text-xs ${
                      index <= order.progressStage
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stageLabel(index)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - actions / note */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 sm:justify-end">
              {isDeclined ? (
                <>
                  <button
                    className="px-4 py-2 bg-gray-300 text-white rounded-lg font-medium text-sm cursor-not-allowed"
                    disabled
                  >
                    {t("raiseDispute")}
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed"
                    disabled
                  >
                    <Mail className="w-4 h-4" />
                    {t("messageProvider")}
                  </button>
                </>
              ) : (
                <>
                  <button className="px-4 py-2 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors">
                    {t("cancelOrder")}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Mail className="w-4 h-4" />
                    {t("messageProvider")}
                  </button>
                </>
              )}
            </div>

            {isDeclined && (
              <div className="mt-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("importantNote")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t("declinedNote")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
