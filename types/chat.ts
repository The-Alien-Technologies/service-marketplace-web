export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  user: ChatUser;
  provider: ChatUser;
  messages: Message[]; // Usually just the latest message when fetching list
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
