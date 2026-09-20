"use client";

import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface ServiceProviderBadgeProps {
  providerName: string;
  providerAvatar?: string;
  providerTitle?: string;
  location: string;
  rating: number;
  isPro?: boolean;
  isOnline?: boolean;
}

export function ServiceProviderBadge({
  providerName,
  providerAvatar,
  providerTitle,
  location,
  rating,
  isPro = false,
  isOnline = false,
}: ServiceProviderBadgeProps) {
  const t = useTranslations("Marketplace");
  const format = useFormatter();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {providerAvatar ? (
              <Image
                src={providerAvatar}
                alt={providerName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-green-700 text-sm font-bold text-white">
                {providerName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          {/* Online Indicator */}
          {isOnline && (
            <div className="absolute bottom-0 right-0">
              <Image
                src="/assets/icons/online_indicator.svg"
                alt={t("online")}
                width={12}
                height={12}
              />
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          {/* First Line - Name, Pro Badge, Location, Rating */}
          <div className="flex items-center justify-between mb-1">
            {/* Name and Pro Badge */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                {providerName}
              </h3>
              {isPro && (
                <div className="flex items-center gap-1 bg-brand-900 px-2 py-0.5 rounded">
                  <span className="text-white text-xs font-semibold">Pro</span>
                  <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-brand-900" />
                  </div>
                </div>
              )}
            </div>

            {/* Location and Rating */}
            <div className="flex items-center gap-3">
              {/* Location */}
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {location}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {format.number(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
            </div>
          </div>

          {/* Second Line - Title */}
          {providerTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {providerTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
