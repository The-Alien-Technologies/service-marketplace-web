import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HelpCenterContent } from "@/components/support/help-center-content";

export const metadata: Metadata = {
  title: "Help Center | Pavodah",
  description:
    "Find help with Pavodah accounts, services, orders, payments, disputes, and provider work.",
};

export default function HelpCenterPage() {
  return (
    <>
      <Header />
      <HelpCenterContent />
      <Footer />
    </>
  );
}
