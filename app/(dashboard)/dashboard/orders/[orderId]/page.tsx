"use client";

import { ChevronRight, Mail, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { Order, OrderStatus } from "@/types/order";
import { useState, useEffect, use } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// --- Helpers ---

const progressSteps = ["Order placed", "Awaiting", "In-progress", "Completed"];

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

const getStatusLabel = (status: OrderStatus): string =>
  status.replace("_", " ");

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
  role: "USER" | "SERVICE_PROVIDER" | "ADMIN";
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (
    newStatus: "IN_PROGRESS" | "COMPLETED" | "DECLINED",
  ) => {
    if (!order) return;
    setActionLoading(newStatus);
    try {
      const updated = await apiService.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      const messages: Record<string, string> = {
        IN_PROGRESS: "Order accepted successfully",
        COMPLETED: "Order marked as completed",
        DECLINED: "Order declined",
      };
      toast.success(messages[newStatus]);
      // Navigate back to the relevant tab
      if (newStatus === "DECLINED") {
        router.push("/dashboard/orders?tab=Declined");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update order status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClientCancel = async () => {
    if (!order) return;
    setActionLoading("DECLINED");
    try {
      const updated = await apiService.updateOrderStatus(order.id, "DECLINED");
      setOrder(updated);
      toast.success("Order cancelled");
      router.push("/dashboard/orders?tab=Declined");
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel order");
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
        Order not found.{" "}
        <Link href="/dashboard/orders" className="text-green-600 underline">
          Go back
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

  const subtotal = Number(order.subtotal ?? order.planPrice ?? 0);
  const addOnsTotal = Number(order.addOnsTotal ?? 0);
  const couponDiscount = Number(order.couponDiscount ?? 0);
  const total = Number(order.total ?? 0);

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">
            Stay on top of your orders to deliver great results.
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
              {tab}
            </Link>
          ))}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/orders"
            className="hover:text-gray-900 transition-colors"
          >
            My orders
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/dashboard/orders?tab=${activeTab}`}
            className="text-green-600 font-medium hover:underline"
          >
            {activeTab}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400">Order ID: #{order.orderNumber}</span>
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
                  : "Unknown"}
              </span>
            </div>

            {/* Order meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-gray-900 text-base">
                Order ID: #{order.orderNumber}
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
            </div>
          </div>

          {/* Top Right: Date & Actions */}
          <div className="flex flex-col items-end gap-4">
            <span className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
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
                          "Accept Order"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                        onClick={() => handleStatusUpdate("DECLINED")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "DECLINED" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Decline Order"
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
                        "Mark as Completed"
                      )}
                    </Button>
                  )}

                {/* Client actions */}
                {role === "USER" &&
                  (order.status === "PENDING" ||
                    order.status === "AWAITING") && (
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                      onClick={handleClientCancel}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "DECLINED" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Cancel Order"
                      )}
                    </Button>
                  )}

                {order.status === "COMPLETED" && (
                  <Link href={`/orders/${order.id}/review`}>
                    <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[150px] rounded-lg">
                      Leave a Review
                    </Button>
                  </Link>
                )}

                {/* Message button — placeholder, left for future */}
                <Button
                  variant="outline"
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 gap-2 font-medium rounded-lg"
                  disabled
                >
                  <Mail className="w-4 h-4" />
                  {role === "SERVICE_PROVIDER"
                    ? "Message Client"
                    : "Message Provider"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Split View: Summary & Add-ons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Order Summary */}
          <div className="bg-gray-50 rounded-xl p-8 space-y-6">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-bold text-gray-900">Order summary</h3>
              <span className="text-sm text-gray-400">
                Order ID: #{order.orderNumber}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Subtotal({order.planTitle ?? "Plan"})
                </span>
                <span className="font-bold text-gray-900">
                  GHS {subtotal.toFixed(2)}
                </span>
              </div>

              {addOnsTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Add-ons</span>
                  <span className="font-bold text-gray-900">
                    GHS {addOnsTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Coupon discount</span>
                  <span className="font-bold text-red-600">
                    -GHS {couponDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  GHS {total.toFixed(2)}
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
                  {order.status === "REFUNDED" ? "Refunded" : "Declined"}
                </span>
              </div>
            )}
          </div>

          {/* Right: Add-ons Selected */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Add-ons selected
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
                        GHS {Number(addon.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                No add-ons selected
              </div>
            )}
          </div>
        </div>
      </div>
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
      : user?.role === "ADMIN"
        ? "ADMIN"
        : "USER";

  return <OrderDetailsView orderId={orderId} role={role} />;
}
