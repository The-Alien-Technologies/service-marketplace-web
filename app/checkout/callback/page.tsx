"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { useOrderStore } from "@/store/order-store";

type CallbackState = "verifying" | "success" | "processing" | "failed";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const clearPendingOrder = useOrderStore((state) => state.clearPendingOrder);
  const [state, setState] = useState<CallbackState>("verifying");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!reference) {
      setState("failed");
      setMessage(
        "Paystack did not return a payment reference. Your order has not been changed.",
      );
      return;
    }

    setState("verifying");
    setMessage(null);

    try {
      const result = await apiService.verifyPayment(reference);
      setOrderId(result.orderId);

      if (result.paymentStatus === "PAID") {
        clearPendingOrder();
        if (result.duplicateCapture) {
          setMessage(
            result.duplicateRefundStatus === "PROCESSED"
              ? "Your order was already paid. We detected the additional charge and refunded it through Paystack."
              : result.duplicateRefundStatus === "FAILED" ||
                  result.duplicateRefundStatus === "NEEDS_ATTENTION"
                ? "Your order was already paid. We detected an additional charge and flagged its refund for support. Do not pay again."
                : "Your order was already paid. We detected the additional charge and its Paystack refund is processing. Do not pay again.",
          );
        }
        setState("success");
        return;
      }

      if (
        result.paymentStatus === "PARTIALLY_REFUNDED" ||
        result.paymentStatus === "REFUNDED"
      ) {
        clearPendingOrder();
        setMessage(
          result.paymentStatus === "REFUNDED"
            ? "This payment has been refunded. Open the order for the latest details."
            : "This payment was confirmed and later partially refunded. Open the order for the current balance.",
        );
        setState("success");
        return;
      }

      if (
        result.paymentStatus === "PROCESSING" ||
        result.paymentStatus === "REFUND_PENDING"
      ) {
        if (result.paymentStatus === "REFUND_PENDING") {
          clearPendingOrder();
          setMessage(
            "The payment was confirmed and a refund is now being processed. You do not need to pay again.",
          );
        }
        setState("processing");
        return;
      }

      setState("failed");
      setMessage(
        result.paystackStatus === "abandoned"
          ? "Checkout was closed before payment completed."
          : "Paystack could not confirm this payment.",
      );
    } catch (error) {
      setState("failed");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not verify the payment right now.",
      );
    }
  }, [clearPendingOrder, reference]);

  useEffect(() => {
    void verify();
  }, [verify]);

  const retryPayment = () => {
    if (orderId) {
      router.push(`/checkout?orderId=${orderId}`);
    } else {
      router.push("/dashboard/orders");
    }
  };

  const content = {
    verifying: {
      icon: <Loader2 className="h-11 w-11 animate-spin text-brand-700" />,
      title: "Confirming your payment",
      body: "We’re checking the final transaction status with Paystack. Keep this page open for a moment.",
    },
    success: {
      icon: <CheckCircle2 className="h-12 w-12 text-brand-700" />,
      title: "Payment confirmed",
      body:
        message ||
        "Your order is paid and ready for the service provider to review.",
    },
    processing: {
      icon: <Clock3 className="h-12 w-12 text-amber-600" />,
      title: "Payment is still processing",
      body:
        message ||
        "Mobile Money confirmations can take a little longer. You won’t be charged again by checking the status.",
    },
    failed: {
      icon: <AlertCircle className="h-12 w-12 text-red-600" />,
      title: "Payment not confirmed",
      body:
        message ||
        "Your order is saved and no service will begin until payment is confirmed.",
    },
  }[state];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center px-4 py-14 sm:px-6">
        <section
          aria-live="polite"
          aria-busy={state === "verifying"}
          className="w-full rounded-2xl bg-white px-6 py-10 text-center shadow-[0_22px_70px_-34px_rgba(15,23,42,0.42)] sm:px-12 sm:py-14 dark:bg-gray-900"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
            {content.icon}
          </div>
          <h1 className="mt-7 text-3xl font-bold tracking-[-0.025em] text-gray-950 dark:text-white">
            {content.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
            {content.body}
          </p>

          {reference && (
            <p className="mt-5 break-all text-xs text-gray-500 dark:text-gray-400">
              Reference: {reference}
            </p>
          )}

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {state === "success" && orderId && (
              <Button
                size="lg"
                className="bg-brand-800 text-white hover:bg-brand-900"
                onClick={() => router.push(`/dashboard/orders/${orderId}`)}
              >
                View your order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {state === "processing" && (
              <>
                <Button
                  size="lg"
                  className="bg-brand-800 text-white hover:bg-brand-900"
                  onClick={() => void verify()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check again
                </Button>
                {orderId && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/orders/${orderId}`)}
                  >
                    View order
                  </Button>
                )}
              </>
            )}

            {state === "failed" && (
              <>
                {reference && (
                  <Button
                    size="lg"
                    className="bg-brand-800 text-white hover:bg-brand-900"
                    onClick={() => void verify()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify again
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={retryPayment}>
                  Return to payment
                </Button>
              </>
            )}
          </div>

          <div className="mx-auto mt-9 flex max-w-md items-start justify-center gap-2 border-t border-gray-200 pt-6 text-left text-xs leading-5 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" />
            <p>
              Pavodah only activates an order after Paystack confirms the exact
              amount and currency.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
