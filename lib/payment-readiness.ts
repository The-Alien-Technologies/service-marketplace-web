import { PaymentIntegration } from "@/types/market";

export function isPaymentIntegrationReady(
  integration?: PaymentIntegration | null,
) {
  return (
    integration?.status === "ACTIVE" &&
    integration.credentials.some((credential) => credential.status === "ACTIVE")
  );
}
