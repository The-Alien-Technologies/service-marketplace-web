export type DisputeIssueType =
  | "LATE_DELIVERY"
  | "NON_DELIVERY"
  | "QUALITY_ISSUE"
  | "PAYMENT_DISPUTE"
  | "MISCOMMUNICATION"
  | "OTHER";

export type DisputeStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";

export type DisputePriority = "LOW" | "MEDIUM" | "HIGH";

export interface DisputeParty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
}

export interface DisputeOrder {
  orderNumber: string;
  planTitle: string;
  planPrice?: string;
  total: string;
  createdAt?: string;
  service: { title: string };
}

export interface Dispute {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  clientId: string;
  providerId: string;
  client: DisputeParty;
  provider: DisputeParty;
  order: DisputeOrder;
  issueType: DisputeIssueType;
  description: string;
  priority: DisputePriority;
  status: DisputeStatus;
  adminNote: string | null;
  resolvedAt: string | null;
}

export const ISSUE_TYPE_LABELS: Record<DisputeIssueType, string> = {
  LATE_DELIVERY: "Late Delivery",
  NON_DELIVERY: "Non-delivery",
  QUALITY_ISSUE: "Quality Issue",
  PAYMENT_DISPUTE: "Payment Dispute",
  MISCOMMUNICATION: "Miscommunication",
  OTHER: "Other",
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  INVESTIGATING: "Investigating",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const DISPUTE_PRIORITY_LABELS: Record<DisputePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
