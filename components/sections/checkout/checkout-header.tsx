"use client";

import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import {useTranslations} from "next-intl";

interface CheckoutHeaderProps {
  providerName: string;
  serviceId?: string;
}

export function CheckoutHeader({
  providerName,
  serviceId,
}: CheckoutHeaderProps) {
  const common = useTranslations("Common");
  const t = useTranslations("Checkout");
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={common("searchPlaceholder")}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-brand-900 dark:hover:text-brand-500 transition-colors"
          >
            {t("home")}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">...</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {serviceId ? (
            <Link
              href={`/services/${serviceId}`}
              className="text-brand-900 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 transition-colors font-medium"
            >
              {providerName}
            </Link>
          ) : (
            <span className="text-brand-900 dark:text-brand-500 font-medium">
              {providerName}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-500 font-medium">
            {t("payments")}
          </span>
        </nav>
      </div>
    </div>
  );
}
