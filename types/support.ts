export type SupportConversationStatus =
  | "BOT"
  | "AWAITING_FOR_ADMIN"
  | "ACTIVE_WITH_ADMIN"
  | "CLOSED";

export type SupportSenderType =
  | "BOT"
  | "USER"
  | "SERVICE_PROVIDER"
  | "ADMIN";

export interface SupportUser {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId?: string | null;
  senderType: SupportSenderType;
  content: string;
  botResponseId?: string | null;
  createdAt: string;
  sender?: SupportUser | null;
}

export interface SupportConversation {
  id: string;
  initiatorId: string;
  initiatorType: SupportSenderType;
  status: SupportConversationStatus;
  adminId?: string | null;
  adminJoinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  initiator: SupportUser;
  admin?: SupportUser | null;
  messages?: SupportMessage[];
}

export interface AdminConversationsResponse {
  waiting: SupportConversation[];
  active: SupportConversation[];
  close: SupportConversation[];
}
