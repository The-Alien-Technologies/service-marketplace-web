export type OrderPaymentStatus =
  | "UNPAID"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type PaymentTransactionStatus =
  | "INITIALIZED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "ABANDONED"
  | "AMOUNT_MISMATCH";

export type PaymentRefundStatus =
  | "INITIALIZED"
  | "PENDING"
  | "PROCESSING"
  | "NEEDS_ATTENTION"
  | "PROCESSED"
  | "FAILED";

export interface PaymentInitialization {
  orderId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string | null;
  amount: number | string;
  currency: string;
}

export interface PaymentVerification {
  reference: string;
  orderId: string;
  paystackStatus: string;
  paymentStatus: OrderPaymentStatus;
  paidAt: string | null;
  duplicateCapture?: boolean;
  duplicateRefundStatus?: PaymentRefundStatus | null;
}

export interface AdminPaymentTransaction {
  id: string;
  reference: string;
  amount: number | string;
  currency: string;
  status: PaymentTransactionStatus;
  channel?: string | null;
  paidAt?: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
    avatar?: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    paymentStatus: OrderPaymentStatus;
    service: { id: string; title: string };
  };
}

export interface ExternalPaymentDispute {
  id: string;
  providerDisputeId: string;
  status: "OPEN" | "REMINDER" | "RESOLVED_WON" | "RESOLVED_LOST";
  refundAmount: number | string;
  currency: string;
  affectsOrderBalance: boolean;
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  order: {
    id: string;
    orderNumber: string;
    marketId: string;
    currency: string;
    planTitle: string;
    total: number | string;
    client: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      email: string;
    };
    provider: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      email: string;
    };
  };
  balanceAdjustment?: {
    id: string;
    amount: number | string;
    recoveredAmount: number | string;
    status: string;
  } | null;
}

export interface AdminRefund {
  id: string;
  reference: string;
  providerRefundId?: string | null;
  providerRefundReference?: string | null;
  amount: number | string;
  amountMinor: number;
  currency: string;
  status: PaymentRefundStatus;
  affectsOrderBalance: boolean;
  reason?: string | null;
  failureMessage?: string | null;
  processedAt?: string | null;
  createdAt: string;
  transaction: {
    id: string;
    reference: string;
    providerTransactionId?: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    marketId: string;
    currency: string;
    paymentStatus: OrderPaymentStatus;
    client: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      email: string;
    };
  };
}

export interface RefundInstitution {
  id: string;
  name: string;
  code: string;
}

export interface ResolvedRefundAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  bankId: string;
}
