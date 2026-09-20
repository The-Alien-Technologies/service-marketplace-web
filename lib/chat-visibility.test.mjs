import assert from "node:assert/strict";
import test from "node:test";
import { canAcknowledgeConversation } from "./chat-visibility.ts";

test("only a visible active conversation acknowledges a message", () => {
  const visibleConversation = {
    activeConversationId: "conversation-1",
    conversationId: "conversation-1",
    isConversationVisible: true,
    documentVisibility: "visible",
  };

  assert.equal(canAcknowledgeConversation(visibleConversation), true);
  assert.equal(
    canAcknowledgeConversation({
      ...visibleConversation,
      isConversationVisible: false,
    }),
    false,
  );
  assert.equal(
    canAcknowledgeConversation({
      ...visibleConversation,
      documentVisibility: "hidden",
    }),
    false,
  );
  assert.equal(
    canAcknowledgeConversation({
      ...visibleConversation,
      activeConversationId: "conversation-2",
    }),
    false,
  );
});
