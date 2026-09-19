export type SettlementStatus =
  | "HELD"
  | "ELIGIBLE"
  | "RESERVED"
  | "PAID"
  | "VOID";

export type ReleaseReviewStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type PayoutDestinationType = "GHIPSS" | "MOBILE_MONEY" | "BASA";

export type ProviderPayoutStatus =
  | "REQUESTED"
  | "PROCESSING"
  | "OTP_REQUIRED"
  | "SUCCESS"
  | "FAILED"
  | "REVERSED"
  | "REJECTED";

export interface OrderSettlement {
  id: string;
  orderId: string;
  providerId: string;
  grossAmount: number | string;
  refundedAmount: number | string;
  retainedAmount: number | string;
  commissionRate: number | string;
  commissionAmount: number | string;
  providerAmount: number | string;
  status: SettlementStatus;
  acceptedAt?: string | null;
  acceptedBy?: "CUSTOMER" | "ADMIN" | null;
  releaseReviewStatus: ReleaseReviewStatus;
  releaseReviewRequestedAt?: string | null;
  releaseReviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutAccount {
  id: string;
  type: PayoutDestinationType;
  institutionCode: string;
  institutionName: string;
  accountName?: string | null;
  accountNumberLast4: string;
  currency: string;
  status: "ACTIVE" | "INACTIVE";
  verifiedAt: string;
  updatedAt: string;
}

export interface PayoutInstitution {
  name: string;
  code: string;
  type: PayoutDestinationType;
}

export interface ProviderPayout {
  id: string;
  marketId: string;
  reference: string;
  amount: number | string;
  grossEarningsAmount: number | string;
  adjustmentAmount: number | string;
  currency: string;
  status: ProviderPayoutStatus;
  institutionName: string;
  accountName?: string | null;
  accountNumberLast4: string;
  requestedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  processedAt?: string | null;
  failureMessage?: string | null;
  provider?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
    avatar?: string | null;
  };
  items?: Array<{
    id: string;
    amount: number | string;
    settlement: OrderSettlement & {
      order: { id: string; orderNumber: string; planTitle: string };
    };
  }>;
}

export interface EarningsSummary {
  currency: string;
  held: number | string;
  eligible: number | string;
  reserved: number | string;
  paid: number | string;
  adjustmentBalance: number | string;
  available: number | string;
  negativeBalance: number | string;
  payoutsEnabled: boolean;
  account: PayoutAccount | null;
  activePayout: Pick<
    ProviderPayout,
    "id" | "amount" | "status" | "requestedAt"
  > | null;
}

export interface ProviderEarning extends OrderSettlement {
  order: {
    id: string;
    orderNumber: string;
    planTitle: string;
    status: string;
    paymentStatus: string;
    service: { id: string; title: string };
  };
}

export interface ReleaseReview extends OrderSettlement {
  provider: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
  };
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
    service: { id: string; title: string };
  };
}
