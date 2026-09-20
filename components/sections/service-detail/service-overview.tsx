"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ServiceOverviewProps {
  title?: string;
  description: string;
  shortDescription?: string;
}

export function ServiceOverview({
  title,
  description,
  shortDescription,
}: ServiceOverviewProps) {
  const t = useTranslations("Marketplace");
  const [isExpanded, setIsExpanded] = useState(false);

  // Use shortDescription if provided, otherwise take first 300 characters
  const displayShort = shortDescription || description.slice(0, 300) + "...";
  const displayText = isExpanded ? description : displayShort;
  const showButton = description.length > (shortDescription?.length || 300);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title ?? t("overview")}
      </h2>
      <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {displayText}
      </div>
      {showButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-brand-900 hover:text-brand-700 dark:text-brand-500 dark:hover:text-brand-400 font-medium text-sm mt-4 transition-colors"
        >
          {isExpanded ? t("showLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}
