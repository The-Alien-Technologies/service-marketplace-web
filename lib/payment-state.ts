import type { OrderPaymentStatus } from "../types/payment";

const PAYABLE_STATUSES = new Set<OrderPaymentStatus>([
  "UNPAID",
  "FAILED",
  "PROCESSING",
]);

export function canInitializePayment(status: OrderPaymentStatus) {
  return PAYABLE_STATUSES.has(status);
}

export function remainingRefundAmount(
  total: number | string,
  refunded: number | string,
) {
  const totalNumber = Number(total);
  const refundedNumber = Number(refunded);
  if (!Number.isFinite(totalNumber) || !Number.isFinite(refundedNumber)) {
    return 0;
  }
  const remainingMinor =
    Math.round(totalNumber * 100) - Math.round(refundedNumber * 100);
  return Math.max(0, remainingMinor) / 100;
}

export function isValidPartialRefund(
  amount: number,
  refundableAmount: number,
) {
  return (
    Number.isFinite(amount) &&
    Number.isFinite(refundableAmount) &&
    amount > 0 &&
    amount < refundableAmount
  );
}
