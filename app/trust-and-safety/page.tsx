import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { TrustSafetyContent } from "@/components/support/trust-safety-content";
import {getTranslations} from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {title: `${t("trustTitle")} | Pavodah`, description: t("trustDescription")};
}

export default function TrustSafetyPage() {
  return (
    <>
      <Header />
      <TrustSafetyContent />
      <Footer />
    </>
  );
}
