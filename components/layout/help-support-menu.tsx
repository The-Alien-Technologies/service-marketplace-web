"use client";

import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useContactSupport } from "@/hooks/use-contact-support";
import {useTranslations} from "next-intl";

const mobileLinkClass =
  "block py-2 text-left text-base text-gray-600 transition-colors hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2";

export function HelpSupportDropdownItems() {
  const contactSupport = useContactSupport();
  const t = useTranslations("Navigation");
  const legal = useTranslations("Legal");

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/help">{t("helpCenter")}</Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={contactSupport}>
        {t("contactSupport")}
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/trust-and-safety">{legal("trustSafety")}</Link>
      </DropdownMenuItem>
    </>
  );
}

export function HelpSupportMobileLinks({
  onNavigate,
}: {
  readonly onNavigate?: () => void;
}) {
  const contactSupport = useContactSupport();
  const t = useTranslations("Navigation");
  const legal = useTranslations("Legal");

  return (
    <div className="mt-3 flex flex-col pl-4">
      <Link href="/help" onClick={onNavigate} className={mobileLinkClass}>
        {t("helpCenter")}
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          contactSupport();
        }}
        className={mobileLinkClass}
      >
        {t("contactSupport")}
      </button>
      <Link
        href="/trust-and-safety"
        onClick={onNavigate}
        className={mobileLinkClass}
      >
        {legal("trustSafety")}
      </Link>
    </div>
  );
}
