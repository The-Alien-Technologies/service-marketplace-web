interface ConversationVisibilityInput {
  activeConversationId?: string | null;
  conversationId: string;
  isConversationVisible: boolean;
  documentVisibility?: string;
}

export function canAcknowledgeConversation({
  activeConversationId,
  conversationId,
  isConversationVisible,
  documentVisibility,
}: ConversationVisibilityInput) {
  return (
    Boolean(activeConversationId) &&
    activeConversationId === conversationId &&
    isConversationVisible &&
    documentVisibility === "visible"
  );
}
