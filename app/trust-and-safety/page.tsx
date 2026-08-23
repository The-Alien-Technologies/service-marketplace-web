import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { TrustSafetyContent } from "@/components/support/trust-safety-content";

export const metadata: Metadata = {
  title: "Trust & Safety | Pavodah",
  description:
    "Guidance for safer accounts, payments, orders, conversations, and reporting on Pavodah.",
};

export default function TrustSafetyPage() {
  return (
    <>
      <Header />
      <TrustSafetyContent />
      <Footer />
    </>
  );
}
