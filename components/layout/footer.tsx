"use client";

import Image from "next/image";
import Link from "next/link";
import { useContactSupport } from "@/hooks/use-contact-support";
import { useCategories } from "@/store/categories-store";
import {useTranslations} from "next-intl";

export function Footer() {
  const { topLevelCategories, isLoading } = useCategories();
  const contactSupport = useContactSupport();
  const nav = useTranslations("Navigation");
  const common = useTranslations("Common");
  const legal = useTranslations("Legal");
  const helpLinks = [
    {label: nav("helpCenter"), href: "/help"},
    {label: legal("trustSafety"), href: "/trust-and-safety"}
  ];
  const legalLinks = [
    {label: legal("termsTitle"), href: "/terms"},
    {label: legal("privacyTitle"), href: "/privacy"}
  ];

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:gap-12 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col items-start space-y-5 text-left lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo/logo.svg"
                alt="Pavodah"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-gray-400">
              {legal("footerDescription")}
            </p>
            <p className="text-sm text-gray-500">© Pavodah 2026</p>
          </div>

          <div>
            <h2 className="mb-4 text-base font-semibold">{nav("categories")}</h2>
            <ul className="space-y-2.5">
              {isLoading && <li className="text-sm text-gray-500">{common("loading")}</li>}
              {!isLoading &&
                topLevelCategories.length > 0 &&
                topLevelCategories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.id}`}
                      className="inline-flex min-h-10 items-center text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              {!isLoading && topLevelCategories.length === 0 && (
                <li className="text-sm text-gray-500">
                  {legal("noCategories")}
                </li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-base font-semibold">{legal("help")}</h2>
            <ul className="space-y-2.5">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={contactSupport}
                  className="min-h-10 text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  {nav("contactSupport")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-base font-semibold">{legal("legal")}</h2>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
