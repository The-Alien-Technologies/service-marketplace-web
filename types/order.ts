import type {
  OrderPaymentStatus,
  PaymentRefundStatus,
  PaymentTransactionStatus,
} from "./payment";
import type { OrderSettlement } from "./payout";

export type OrderStatus =
  | "PENDING"
  | "AWAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "REFUNDED";

export type Order = {
  id: string;
  orderNumber: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  planId?: string;
  planTitle?: string;
  planPrice?: number;
  planInclusions?: string;
  subtotal?: number;
  addOnsTotal?: number;
  couponCode?: string;
  couponDiscount?: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  source: "SERVICE_PLAN" | "QUOTE";
  paidAt?: string | null;
  commissionRate?: number | string;
  settlement?: OrderSettlement | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar: string;
  };
  service: {
    id: string;
    title: string;
    category: {
      name: string;
    };
    provider?: {
      id: string;
      firstName: string;
      lastName: string;
      displayName: string;
      avatar: string;
    };
  };
  addOns?: Array<{
    id: string;
    addonId?: string;
    title: string;
    description?: string;
    price: number;
  }>;
  paymentTransactions?: Array<{
    id: string;
    reference: string;
    status: PaymentTransactionStatus;
    amount: number | string;
    currency: string;
    channel?: string | null;
    paidAt?: string | null;
    createdAt: string;
  }>;
  refunds?: Array<{
    id: string;
    amount: number | string;
    currency: string;
    status: PaymentRefundStatus;
    affectsOrderBalance: boolean;
    reason?: string | null;
    failureMessage?: string | null;
    processedAt?: string | null;
    createdAt: string;
  }>;
};

export type ReviewResponse = {
  id: string;
  reviewId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  orderId: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
  };
  service?: {
    id: string;
    title: string;
  };
  response?: ReviewResponse | null;
};

export type ReviewSummary = {
  average: number;
  total: number;
  breakdown: Record<number, number>;
};
