export type MarketStatus = "ACTIVE" | "PAUSED" | "INACTIVE";
export type MarketSelection = "GLOBAL" | string;

export interface Market {
  id: string;
  code: string;
  name: string;
  currency: string;
  locale: string;
  minorUnit: number;
  status: MarketStatus;
  checkoutEnabled: boolean;
  providerOnboardingEnabled: boolean;
  servicePublishingEnabled: boolean;
  paystackCountry?: string;
  _count?: {
    admins: number;
    providerMemberships: number;
    services: number;
    orders: number;
  };
}

export type ProviderMarketMembershipStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export interface ProviderMarketMembership {
  id: string;
  marketId: string;
  status: ProviderMarketMembershipStatus;
  isPrimary: boolean;
  createdAt: string;
  rejectionReason?: string | null;
  market: Market;
  provider?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    isServiceProviderVerified?: boolean;
  };
}

export type PaymentCredentialStatus =
  | "STAGED"
  | "ACTIVE"
  | "RETIRING"
  | "REVOKED";

export interface PaymentCredentialVersion {
  id: string;
  version: number;
  fingerprint: string;
  status: PaymentCredentialStatus;
  validatedAt?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface PaymentIntegration {
  id: string;
  provider: "PAYSTACK";
  status: "ACTIVE" | "PAUSED" | "RETIRED";
  webhookKey: string;
  market: Market;
  credentials: PaymentCredentialVersion[];
}

export interface CountryAdministrator {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastActiveAt: string;
  adminMarketId: string;
  adminMarket: Market;
}
