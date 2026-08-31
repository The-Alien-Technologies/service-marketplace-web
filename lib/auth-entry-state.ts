export function getSignUpEntryState(flow: "user" | "provider") {
  if (flow === "provider") {
    return {
      authFlow: "provider" as const,
      authStep: "signup" as const,
      providerAuthStep: "provider-signup" as const,
      showAuthModal: true as const,
    };
  }

  return {
    authFlow: "user" as const,
    authStep: "signup" as const,
    userAuthStep: "signup" as const,
    showAuthModal: true as const,
  };
}
