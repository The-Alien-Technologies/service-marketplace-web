"use client";

import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useContactSupport } from "@/hooks/use-contact-support";

const mobileLinkClass =
  "block py-2 text-left text-base text-gray-600 transition-colors hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2";

export function HelpSupportDropdownItems() {
  const contactSupport = useContactSupport();

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/help">Help Center</Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={contactSupport}>
        Contact Support
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/trust-and-safety">Trust &amp; Safety</Link>
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

  return (
    <div className="mt-3 flex flex-col pl-4">
      <Link href="/help" onClick={onNavigate} className={mobileLinkClass}>
        Help Center
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          contactSupport();
        }}
        className={mobileLinkClass}
      >
        Contact Support
      </button>
      <Link
        href="/trust-and-safety"
        onClick={onNavigate}
        className={mobileLinkClass}
      >
        Trust &amp; Safety
      </Link>
    </div>
  );
}
