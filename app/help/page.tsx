import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HelpCenterContent } from "@/components/support/help-center-content";
import {getTranslations} from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {title: `${t("helpTitle")} | Pavodah`, description: t("helpDescription")};
}

export default function HelpCenterPage() {
  return (
    <>
      <Header />
      <HelpCenterContent />
      <Footer />
    </>
  );
}
