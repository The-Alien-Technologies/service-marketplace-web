"use client";

import { Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    rating: number;
    count: number;
    percentage: number;
  }[];
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingBreakdown,
}: ReviewSummaryProps) {
  const t = useTranslations("Reviews");
  const format = useFormatter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("title")}
      </h2>

      {/* Overall Rating Summary */}
      <div className="flex items-center gap-6 mb-6">
        {/* Circular Progress Bar */}
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
              className="dark:stroke-gray-600"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#F97316"
              strokeWidth="3"
              strokeDasharray={`${(averageRating / 5) * 100}, 100`}
              strokeLinecap="round"
            />
          </svg>
          {/* Rating text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {format.number(averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
        </div>

        {/* Stars and Review Count */}
        <div className="flex flex-col gap-2">
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.floor(averageRating)
                    ? "text-orange-500 fill-orange-500"
                    : star === Math.ceil(averageRating) &&
                      averageRating % 1 !== 0
                    ? "text-orange-500 fill-orange-500"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
          </div>
          {/* Review count */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("fromReviews", { count: totalReviews })}
          </p>
        </div>
      </div>

      {/* Individual Star Rating Breakdown */}
      <div className="space-y-3">
        {ratingBreakdown.map((item) => (
          <div key={item.rating} className="flex items-center gap-3">
            {/* Rating label */}
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {format.number(item.rating, { minimumFractionDigits: 1 })}
              </span>
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>

            {/* Count */}
            <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
              {format.number(item.count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
