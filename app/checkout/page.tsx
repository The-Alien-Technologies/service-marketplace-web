"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { CheckoutHeader } from "@/components/sections/checkout/checkout-header";
import { ChevronDown, Lock, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrderStore, type PendingOrder } from "@/store/order-store";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";

export default function CheckoutPage() {
  const router = useRouter();
  const { pendingOrder, clearPendingOrder } = useOrderStore();
  const [orderData, setOrderData] = useState<PendingOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  useEffect(() => {
    // Load order from Zustand store
    if (!pendingOrder) {
      // No order found, redirect back
      router.push("/");
      return;
    }

    setOrderData(pendingOrder);
    setIsLoading(false);
  }, [pendingOrder, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const providerName = "Service Provider"; // TODO: Get from orderData
  const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const couponDiscount = isCouponApplied ? 50 : 0; // TODO: Implement real coupon logic
  const total = orderData.subtotal - couponDiscount;

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setIsCouponApplied(true);
      // TODO: Validate coupon with backend
    }
  };

  const handleContinueToPaystack = async () => {
    if (!orderData) return;

    try {
      setIsLoading(true);

      const createdOrder = await apiService.createOrder({
        serviceId: orderData.serviceId,
        planId: orderData.plan.id,
        planTitle: orderData.plan.name,
        planPrice: orderData.plan.price,
        planInclusions: "Standard Plan Inclusions", // TODO: Get from orderData
        addOns: orderData.addOns.map((addon) => ({
          id: addon.id,
          title: addon.name,
          description: addon.description,
          price: addon.price,
        })),
        subtotal: orderData.subtotal,
        addOnsTotal: orderData.addOnsTotal,
        couponDiscount: isCouponApplied ? couponDiscount : 0,
        total: total,
      });

      toast.success("Order created successfully!");
      clearPendingOrder();

      // Redirect to Paystack or Order Success page
      // For now, redirect to the order details page in dashboard
      router.push(`/dashboard/orders/${createdOrder.id}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = () => {
    clearPendingOrder();
    router.back();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <CheckoutHeader
        providerName={providerName}
        serviceId={orderData.serviceId}
      />

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Section - Payment Information */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Complete Your Payment
            </h1>

            {/* Powered by Paystack */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by:
              </p>
              <div className="flex items-center">
                <Image
                  src="/assets/icons/paystack.svg"
                  alt="Paystack"
                  width={400}
                  height={106}
                />
              </div>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                You will be redirected to Paystack's secure checkout to complete
                your payment.
              </p>
            </div>
          </div>

          {/* Right Section - Order Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            {/* Coupon Section */}
            <div className="space-y-3">
              <button className="flex items-center gap-2 text-brand-900 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 transition-colors text-sm font-medium">
                <span>Have a coupon?</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-6 py-2.5 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Order summary
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                  Order ID: #{orderId}
                </span>
              </div>

              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subtotal({orderData.plan.name})
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    GHS {orderData.plan.price.toFixed(2)}
                  </span>
                </div>

                {/* Add-ons */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Add-ons
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    GHS {orderData.addOnsTotal.toFixed(2)}
                  </span>
                </div>

                {/* Coupon Discount */}
                {isCouponApplied && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Coupon discount
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -GHS {couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    GHS {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleContinueToPaystack}
                className="w-full px-6 py-3.5 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
              >
                Continue to Paystack
              </button>
              <button
                onClick={handleCancelOrder}
                className="w-full px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel order
              </button>
            </div>

            {/* Security Message */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Secured by Paystack
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
