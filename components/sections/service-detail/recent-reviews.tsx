"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ChevronDown, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  date: string;
  reviewText: string;
  likes: number;
  dislikes: number;
  response?: { comment: string; createdAt: string } | null;
}

interface RecentReviewsProps {
  reviews: Review[];
  initialVisible?: number;
  totalReviews?: number;
  isLoadingAll?: boolean;
  onViewAll?: () => Promise<void>;
}

export function RecentReviews({
  reviews,
  initialVisible = 6,
  totalReviews = reviews.length,
  isLoadingAll = false,
  onViewAll,
}: RecentReviewsProps) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const format = useFormatter();
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [showAll, setShowAll] = useState(false);

  const visibleReviews = showAll ? reviews : reviews.slice(0, visibleCount);
  const hasMore = totalReviews > visibleCount;

  const handleShowMore = async () => {
    if (showAll) {
      setShowAll(false);
      setVisibleCount(initialVisible);
    } else {
      if (onViewAll && reviews.length < totalReviews) {
        try {
          await onViewAll();
        } catch {
          return;
        }
      }
      setShowAll(true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("recentReviews")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t("recentReviewsBody")}
        </p>
        {/* Horizontal line */}
        <div className="mt-4 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {visibleReviews.map((review) => (
          <div key={review.id} className="flex gap-4">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {review.reviewerAvatar ? (
                  <Image
                    src={review.reviewerAvatar}
                    alt={review.reviewerName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-green-700 text-sm font-bold text-white">
                    {review.reviewerName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              {/* Reviewer Info */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {review.reviewerName}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {format.number(review.rating, { minimumFractionDigits: 1 })}
                  </span>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                {format.dateTime(new Date(review.date), "short")}
              </p>

              {/* Review Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                &quot;{review.reviewText}&quot;
              </p>

              {/* Provider Response */}
              {review.response && (
                <div className="mb-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/10">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                    {t("providerResponse")}
                  </p>
                  <p className="text-sm text-green-950 dark:text-green-100">
                    {review.response.comment}
                  </p>
                </div>
              )}

              {/* Engagement Metrics — commented out for now */}
              {/* <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {review.likes}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {review.dislikes}
                  </span>
                </div>
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div className="mt-6">
          <button
            onClick={handleShowMore}
            disabled={isLoadingAll}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 dark:text-brand-500 dark:hover:text-brand-400 font-medium text-sm transition-colors"
          >
            <span>{showAll ? t("showLess") : common("viewAll")}</span>
            {isLoadingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showAll ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
