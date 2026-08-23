export type QuoteStatus =
  | "NEW"
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";

export interface QuoteParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface QuoteRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client: QuoteParticipant;
  providerId: string;
  provider: QuoteParticipant;
  serviceId: string | null;
  service: { id: string; title: string; coverImage: string | null } | null;
  projectTitle: string;
  description: string;
  deliveryTime: string;
  budget: number | string; // Decimal comes as string from Prisma JSON
  currency: string;
  attachments: string[];
  status: QuoteStatus;
  providerNote: string | null;
  declineReason: string | null;
  order?: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
    total: number | string;
    currency: string;
  } | null;
}
