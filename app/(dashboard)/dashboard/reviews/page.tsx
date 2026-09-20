"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Star,
  Box,
  ThumbsUp,
  ThumbsDown,
  ArrowDown,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { Review, ReviewSummary } from "@/types/order";
import { toast } from "react-toastify";
import { useFormatter, useTranslations } from "next-intl";

const DEFAULT_SUMMARY: ReviewSummary & { completedOrders: number } = {
  average: 0,
  total: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  completedOrders: 0,
};

export default function ReviewsPage() {
  const t = useTranslations("Reviews");
  const common = useTranslations("Common");
  const marketplace = useTranslations("Marketplace");
  const format = useFormatter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.getMyReviews({
        sort,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        page,
        limit: 10,
      });
      setReviews(result.data);
      setSummary(result.summary);
      setTotalPages(result.pagination.pages);
    } catch {
      toast.error(t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [sort, ratingFilter, page]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      await apiService.respondToReview(reviewId, responseText.trim());
      toast.success(t("responseSubmitted"));
      setRespondingTo(null);
      setResponseText("");
      fetchReviews();
    } catch {
      toast.error(t("responseFailed"));
    } finally {
      setSubmittingResponse(false);
    }
  };

  const maxBreakdownCount = Math.max(...Object.values(summary.breakdown), 1);

  return (
    <div className="max-w-[1000px] space-y-10 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Ratings Summary */}
      <div className="flex flex-col gap-8">
        {/* Top Stats Group */}
        <div className="flex items-center gap-6 pt-2">
          {/* Rating Circle */}
          <div className="w-20 h-20 rounded-full border-[3px] border-amber-400 flex items-center justify-center text-3xl font-bold text-gray-900 shrink-0">
            {format.number(summary.average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>

          {/* Stars & Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-5 h-5",
                    i <= Math.round(summary.average)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200",
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {t("fromReviews", { count: summary.total })}
            </p>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-gray-200 mx-2 hidden sm:block"></div>

          {/* Orders Completed */}
          <div className="hidden sm:flex items-center gap-2.5 font-medium text-gray-900 text-lg">
            <Box className="w-6 h-6 text-gray-900" />
            <span>{t("ordersCompleted", { count: summary.completedOrders })}</span>
          </div>
        </div>

        {/* Bottom Progress Bars */}
        <div className="w-full max-w-2xl space-y-4">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 shrink-0 w-12">
                <span className="font-medium text-gray-900">{format.number(star, { minimumFractionDigits: 1 })}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>

              <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#15803d] rounded-full transition-all duration-500"
                  style={{
                    width: `${((summary.breakdown[star] || 0) / maxBreakdownCount) * 100}%`,
                  }}
                />
              </div>
              <span className="w-10 text-right text-gray-500 shrink-0">
                {format.number(summary.breakdown[star] || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">{t("recent")}</h2>
            <p className="text-sm text-gray-500">
              {t("recentBody")}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <span className="text-sm font-medium text-gray-700">{t("filter")}</span>
              <Select
                value={ratingFilter}
                onValueChange={(v) => {
                  setRatingFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] h-9 bg-white text-sm">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {[5, 4, 3, 2, 1].map((count) => (
                    <SelectItem key={count} value={String(count)}>{t("stars", { count })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <span className="text-sm font-medium text-gray-700">{marketplace("sortBy")}</span>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9 bg-white text-sm">
                  <SelectValue placeholder={marketplace("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t("mostRecent")}</SelectItem>
                  <SelectItem value="highest">{t("highestRated")}</SelectItem>
                  <SelectItem value="lowest">{t("lowestRated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Star className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{t("none")}</p>
            <p className="text-sm mt-1">
              {t("noneBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 bg-gray-100">
                  {review.client?.avatar ? (
                    <Image
                      src={review.client.avatar}
                      alt={review.client.displayName || "Client"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                      {(review.client?.firstName?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900">
                        {review.client?.displayName ||
                          `${review.client?.firstName} ${review.client?.lastName}`}
                      </h3>
                      <div className="flex items-center gap-0.5 text-xs font-medium text-gray-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {review.rating}.0
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format.dateTime(new Date(review.createdAt), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-800 leading-relaxed max-w-2xl">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Provider response */}
                  {review.response && (
                    <div className="mt-3 rounded-lg bg-green-50 px-4 py-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        {t("yourResponse")}
                      </p>
                      <p className="text-sm text-green-950">
                        {review.response.comment}
                      </p>
                    </div>
                  )}

                  {/* Respond button */}
                  {!review.response && respondingTo !== review.id && (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors mt-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t("respond")}
                    </button>
                  )}

                  {/* Response form */}
                  {respondingTo === review.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={t("responsePlaceholder")}
                        className="w-full max-w-xl h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespond(review.id)}
                          disabled={submittingResponse || !responseText.trim()}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-[#15803d] hover:bg-[#14532d] rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {submittingResponse && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          {common("submit")}
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> {common("cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-2 text-sm font-medium text-[#15803d] hover:text-[#14532d] transition-colors mt-4 disabled:opacity-40"
          >
            {t("showMore")} <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
