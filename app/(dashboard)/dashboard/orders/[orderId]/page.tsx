"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  Layers,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { remainingRefundAmount } from "@/lib/payment-state";
import { formatMoney } from "@/lib/money";
import { Order, OrderStatus } from "@/types/order";
import { useState, useEffect, use } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ChatBox } from "@/components/sections/service-detail/chat-box";
import { RaiseDisputeModal } from "@/components/sections/orders/raise-dispute-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormatter, useTranslations } from "next-intl";

// --- Helpers ---

const getProgressIndex = (status: OrderStatus): number => {
  switch (status) {
    case "PENDING":
      return 0;
    case "AWAITING":
      return 1;
    case "IN_PROGRESS":
      return 2;
    case "COMPLETED":
      return 3;
    default:
      return 0;
  }
};

const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
    case "AWAITING":
      return { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
    case "IN_PROGRESS":
      return { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" };
    case "COMPLETED":
      return { dot: "bg-green-500", badge: "bg-green-50 text-green-700" };
    case "DECLINED":
    case "REFUNDED":
      return { dot: "bg-red-500", badge: "bg-red-50 text-red-700" };
    default:
      return { dot: "bg-gray-500", badge: "bg-gray-50 text-gray-700" };
  }
};

const getActiveTab = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
    case "AWAITING":
      return "Awaiting";
    case "IN_PROGRESS":
      return "In-progress";
    case "COMPLETED":
      return "Completed";
    case "DECLINED":
    case "REFUNDED":
      return "Declined";
    default:
      return "Awaiting";
  }
};

// --- Order Details Component ---

function OrderDetailsView({
  orderId,
  role,
}: {
  orderId: string;
  role: "USER" | "SERVICE_PROVIDER" | "ADMIN" | "SUPER_ADMIN";
}) {
  const t = useTranslations("Orders");
  const common = useTranslations("Common");
  const format = useFormatter();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const progressSteps = [
    t("stagePlaced"),
    t("awaiting"),
    t("inProgress"),
    t("completed"),
  ];
  const getStatusLabel = (status: OrderStatus) =>
    status === "IN_PROGRESS"
      ? t("inProgress")
      : status === "COMPLETED"
        ? t("completed")
        : status === "DECLINED"
          ? t("declined")
          : status === "REFUNDED"
            ? t("refunded")
            : t("awaiting");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error(t("loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, t]);

  const handleStatusUpdate = async (
    newStatus: "IN_PROGRESS" | "COMPLETED" | "DECLINED",
  ) => {
    if (!order) return;
    setActionLoading(newStatus);
    try {
      const updated = await apiService.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      const messages: Record<string, string> = {
        IN_PROGRESS: t("orderAcceptedSuccessfully"),
        COMPLETED: t("markedComplete"),
        DECLINED: t("orderDeclined"),
      };
      toast.success(messages[newStatus]);
      // Navigate back to the relevant tab
      if (newStatus === "DECLINED") {
        router.push("/dashboard/orders?tab=Declined");
      }
    } catch (error: any) {
      toast.error(error?.message || t("updateFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleClientCancel = async () => {
    if (!order) return;
    if (!window.confirm(t("cancelConfirm", { number: order.orderNumber })))
      return;
    setActionLoading("DECLINED");
    try {
      const updated = await apiService.updateOrderStatus(order.id, "DECLINED");
      setOrder(updated);
      toast.success(t("cancelledSuccess"));
      router.push("/dashboard/orders?tab=Declined");
    } catch (error: any) {
      toast.error(error?.message || t("cancelFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    setActionLoading("REFUND");
    try {
      const result = await apiService.refundOrderPayment(
        order.id,
        `Refund remaining balance for order ${order.orderNumber}`,
        refundableAmount,
      );
      const updatedOrder = await apiService.getOrder(order.id);
      setOrder(updatedOrder);
      setIsRefundOpen(false);
      toast.success(
        result.paymentStatus === "REFUNDED"
          ? t("refundCompleted")
          : t("refundProcessing"),
      );
    } catch (error: any) {
      toast.error(error?.message || t("refundFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptWork = async () => {
    if (!order) return;
    setActionLoading("ACCEPT_WORK");
    try {
      const settlement = await apiService.acceptOrder(order.id);
      setOrder({ ...order, settlement });
      setIsAcceptOpen(false);
      toast.success(t("workAccepted"));
    } catch (error: any) {
      toast.error(error?.message || t("acceptWorkFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseReview = async () => {
    if (!order) return;
    setActionLoading("RELEASE_REVIEW");
    try {
      const settlement = await apiService.requestOrderReleaseReview(order.id);
      setOrder({ ...order, settlement });
      toast.success(t("adminReviewRequested"));
    } catch (error: any) {
      toast.error(error?.message || t("adminReviewFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-gray-500">
        {t("notFound")}{" "}
        <Link href="/dashboard/orders" className="text-green-600 underline">
          {common("back")}
        </Link>
      </div>
    );
  }

  const statusStyles = getStatusStyles(order.status);
  const progressIndex = getProgressIndex(order.status);
  const activeTab = getActiveTab(order.status);
  const isDeclinedOrRefunded =
    order.status === "DECLINED" || order.status === "REFUNDED";

  // Determine the "other party" to display
  const otherParty =
    role === "SERVICE_PROVIDER"
      ? order.client
      : (order.provider ?? order.service?.provider);

  const subtotal = Number(order.planPrice ?? order.subtotal ?? 0);
  const addOnsTotal = Number(order.addOnsTotal ?? 0);
  const couponDiscount = Number(order.couponDiscount ?? 0);
  const total = Number(order.total ?? 0);
  const processedRefundAmount =
    order.refunds
      ?.filter(
        (refund) => refund.affectsOrderBalance && refund.status === "PROCESSED",
      )
      .reduce((sum, refund) => sum + Number(refund.amount), 0) ??
    Number(order.settlement?.refundedAmount ?? 0);
  const refundableAmount = remainingRefundAmount(total, processedRefundAmount);
  const settlementHeld =
    order.status === "COMPLETED" &&
    (!order.settlement ||
      (order.settlement.status === "HELD" && !order.settlement.acceptedAt));
  const settlementAcceptedButHeld =
    order.status === "COMPLETED" &&
    order.settlement?.status === "HELD" &&
    Boolean(order.settlement.acceptedAt);
  const settlementReleased =
    order.settlement?.status === "ELIGIBLE" ||
    order.settlement?.status === "RESERVED" ||
    order.settlement?.status === "PAID";
  const hasOpenDispute =
    order.dispute &&
    order.dispute.status !== "RESOLVED" &&
    order.dispute.status !== "CLOSED";

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("myOrders")}</h1>
          <p className="text-gray-500 mt-1">
            {role === "SERVICE_PROVIDER"
              ? t("providerSubtitle")
              : t("clientSubtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {["Awaiting", "In-progress", "Completed", "Declined"].map((tab) => (
            <Link
              key={tab}
              href={`/dashboard/orders?tab=${tab}`}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                tab === activeTab
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              {tab === "Awaiting"
                ? t("awaiting")
                : tab === "In-progress"
                  ? t("inProgress")
                  : tab === "Completed"
                    ? t("completed")
                    : t("declined")}
            </Link>
          ))}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/orders"
            className="hover:text-gray-900 transition-colors"
          >
            {t("myOrders")}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/dashboard/orders?tab=${activeTab}`}
            className="text-green-600 font-medium hover:underline"
          >
            {activeTab === "Awaiting"
              ? t("awaiting")
              : activeTab === "In-progress"
                ? t("inProgress")
                : activeTab === "Completed"
                  ? t("completed")
                  : t("declined")}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400">
            {t("orderId", { id: order.orderNumber })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Order Header Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            {/* Other party info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                {otherParty?.avatar ? (
                  <Image
                    src={otherParty.avatar}
                    alt={
                      otherParty.displayName ||
                      `${otherParty.firstName} ${otherParty.lastName}`
                    }
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">
                    {(otherParty?.firstName?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-lg font-bold text-gray-900">
                {otherParty
                  ? otherParty.displayName ||
                    `${otherParty.firstName} ${otherParty.lastName}`
                  : common("unknown")}
              </span>
            </div>

            {/* Order meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-gray-900 text-base">
                {t("orderId", { id: order.orderNumber })}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">
                {order.service?.category?.name}
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}
                />
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-xs ${statusStyles.badge}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  order.paymentStatus === "PAID"
                    ? "bg-green-50 text-green-700"
                    : order.paymentStatus === "PROCESSING"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-700",
                )}
              >
                {t("paymentStatus", {
                  status: order.paymentStatus.replace("_", " "),
                })}
              </span>
            </div>
          </div>

          {/* Top Right: Date & Actions */}
          <div className="flex flex-col items-end gap-4">
            <span className="text-sm text-gray-500">
              {format.dateTime(new Date(order.createdAt), "long")}
            </span>

            {!isDeclinedOrRefunded && (
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {/* Provider actions */}
                {role === "SERVICE_PROVIDER" &&
                  (order.status === "PENDING" ||
                    order.status === "AWAITING") && (
                    <>
                      <Button
                        className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[130px] rounded-lg"
                        onClick={() => handleStatusUpdate("IN_PROGRESS")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "IN_PROGRESS" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t("acceptOrder")
                        )}
                      </Button>
                    </>
                  )}

                {role === "SERVICE_PROVIDER" &&
                  order.status === "IN_PROGRESS" && (
                    <Button
                      className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[160px] rounded-lg"
                      onClick={() => handleStatusUpdate("COMPLETED")}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "COMPLETED" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("completeOrder")
                      )}
                    </Button>
                  )}

                {/* Client actions */}
                {role === "USER" &&
                  order.paymentStatus !== "PAID" &&
                  order.paymentStatus !== "REFUNDED" &&
                  order.paymentStatus !== "REFUND_PENDING" &&
                  order.paymentStatus !== "PARTIALLY_REFUNDED" && (
                    <Button
                      className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[130px] rounded-lg"
                      onClick={() =>
                        router.push(`/checkout?orderId=${order.id}`)
                      }
                    >
                      {order.paymentStatus === "PROCESSING"
                        ? t("resumePayment")
                        : t("payNow")}
                    </Button>
                  )}

                {role === "USER" && settlementHeld && !hasOpenDispute && (
                  <>
                    <Button
                      className="bg-[#15803d] hover:bg-[#14532d] text-white font-semibold min-w-[150px] rounded-lg"
                      onClick={() => setIsAcceptOpen(true)}
                      disabled={actionLoading !== null}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t("acceptWork")}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-200 text-amber-800 hover:bg-amber-50"
                      onClick={() => setIsDisputeOpen(true)}
                      disabled={actionLoading !== null}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {t("raiseDispute")}
                    </Button>
                  </>
                )}

                {role === "SERVICE_PROVIDER" && settlementHeld && !hasOpenDispute && (
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-800 hover:bg-gray-50"
                    onClick={handleReleaseReview}
                    disabled={
                      actionLoading !== null ||
                      order.settlement?.releaseReviewStatus === "REQUESTED"
                    }
                  >
                    {actionLoading === "RELEASE_REVIEW" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock3 className="w-4 h-4" />
                    )}
                    {order.settlement?.releaseReviewStatus === "REQUESTED"
                      ? t("adminReviewPending")
                      : t("requestAdminReview")}
                  </Button>
                )}

                {(role === "ADMIN" || role === "SUPER_ADMIN") &&
                  (order.paymentStatus === "PAID" ||
                    order.paymentStatus === "PARTIALLY_REFUNDED") &&
                  refundableAmount > 0 &&
                  !order.settlement?.acceptedAt && (
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setIsRefundOpen(true)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "REFUND" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : order.paymentStatus === "PARTIALLY_REFUNDED" ? (
                        t("refundRemaining")
                      ) : (
                        t("issueFullRefund")
                      )}
                    </Button>
                  )}

                {role === "USER" &&
                  (order.status === "PENDING" || order.status === "AWAITING") &&
                  (order.paymentStatus === "UNPAID" ||
                    order.paymentStatus === "FAILED") && (
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                      onClick={handleClientCancel}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "DECLINED" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("cancelOrder")
                      )}
                    </Button>
                  )}

                {role === "USER" &&
                  order.status === "COMPLETED" &&
                  !order.review &&
                  settlementReleased && (
                    <Link href={`/orders/${order.id}/review`}>
                      <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[150px] rounded-lg">
                        {t("leaveReview")}
                      </Button>
                    </Link>
                  )}

                {/* Message button */}
                <Button
                  variant="outline"
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 gap-2 font-medium rounded-lg"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Mail className="w-4 h-4" />
                  {role === "SERVICE_PROVIDER"
                    ? t("messageClient")
                    : t("messageProvider")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {order.status === "COMPLETED" && (
          <div
            className={cn(
              "rounded-xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
              settlementReleased
                ? "bg-green-50 text-green-950"
                : "bg-amber-50 text-amber-950",
            )}
          >
            <div className="flex items-start gap-3">
              {settlementReleased ? (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              ) : (
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {settlementReleased
                    ? t("paymentReleasedTitle")
                    : settlementAcceptedButHeld
                      ? t("paymentReviewTitle")
                      : t("paymentHeldTitle")}
                </p>
                <p className="mt-1 max-w-2xl text-sm opacity-80">
                  {settlementReleased
                    ? role === "USER"
                      ? t("customerReleasedBody", {
                          amount: formatMoney(refundableAmount, order.currency),
                        })
                      : t("providerReleasedBody", {
                          amount: formatMoney(
                            order.settlement?.providerAmount ?? 0,
                            order.currency,
                          ),
                          status: order.settlement?.status.toLowerCase() ?? "",
                        })
                    : settlementAcceptedButHeld
                      ? t("paymentReviewBody")
                      : role === "SERVICE_PROVIDER"
                        ? t("providerHeldBody")
                        : t("customerHeldBody")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Split View: Summary & Add-ons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Order Summary */}
          <div className="space-y-6 rounded-xl bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                {t("orderSummary")}
              </h3>
              <span className="text-sm text-gray-400">
                {t("orderId", { id: order.orderNumber })}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {t("planSubtotal", { plan: order.planTitle ?? t("plan") })}
                </span>
                <span className="font-bold text-gray-900">
                  {formatMoney(subtotal, order.currency)}
                </span>
              </div>

              {addOnsTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("addOns")}</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(addOnsTotal, order.currency)}
                  </span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("couponDiscount")}</span>
                  <span className="font-bold text-red-600">
                    -{formatMoney(couponDiscount, order.currency)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  {common("total")}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(total, order.currency)}
                </span>
              </div>
            </div>

            {/* Progress Bar — only for non-declined orders */}
            {!isDeclinedOrRefunded && (
              <div className="pt-6">
                <div className="relative h-1.5 bg-gray-200 rounded-full mb-3">
                  <div
                    className="absolute h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progressIndex / (progressSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  {progressSteps.map((step, index) => (
                    <span
                      key={step}
                      className={cn(
                        index <= progressIndex
                          ? "text-gray-900 font-medium"
                          : "text-gray-400",
                      )}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isDeclinedOrRefunded && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {order.status === "REFUNDED" ? t("refunded") : t("declined")}
                </span>
              </div>
            )}
          </div>

          {/* Right: Add-ons Selected */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              {t("addOnsSelected")}
            </h3>
            {order.addOns && order.addOns.length > 0 ? (
              <div className="space-y-3">
                {order.addOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 text-green-700">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {addon.title}
                      </h4>
                      {addon.description && (
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          {addon.description}
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {formatMoney(addon.price, order.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 sm:p-8">
                {t("noAddOnsSelected")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Box */}
      {otherParty && (
        <ChatBox
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          providerId={otherParty.id}
          providerName={
            otherParty.displayName ||
            `${otherParty.firstName} ${otherParty.lastName}`
          }
          providerAvatar={otherParty.avatar || ""}
        />
      )}

      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle>{t("acceptCompletedTitle")}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {t("acceptCompletedBody", {
                amount: formatMoney(refundableAmount, order.currency),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAcceptOpen(false)}
              disabled={actionLoading !== null}
            >
              {t("reviewAgain")}
            </Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={handleAcceptWork}
              disabled={actionLoading !== null}
            >
              {actionLoading === "ACCEPT_WORK" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("acceptRelease")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              {order.paymentStatus === "PARTIALLY_REFUNDED"
                ? t("refundRemainingTitle")
                : t("fullRefundTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("refundBody", {
                amount: formatMoney(refundableAmount, order.currency),
                number: order.orderNumber,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundOpen(false)}
              disabled={actionLoading !== null}
            >
              {common("cancel")}
            </Button>
            <Button
              className="bg-red-700 text-white hover:bg-red-800"
              onClick={handleRefund}
              disabled={actionLoading !== null}
            >
              {actionLoading === "REFUND" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("confirmRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RaiseDisputeModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onSuccess={(dispute) => {
          setOrder((current) =>
            current
              ? {
                  ...current,
                  dispute: { id: dispute.id, status: dispute.status },
                }
              : current,
          );
          setIsDisputeOpen(false);
          toast.info(t("heldDuringDispute"));
        }}
      />
    </div>
  );
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { user } = useAuthStore();
  const { orderId } = use(params);

  const role =
    user?.role === "SERVICE_PROVIDER"
      ? "SERVICE_PROVIDER"
      : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
        ? "ADMIN"
        : "USER";

  return <OrderDetailsView orderId={orderId} role={role} />;
}
