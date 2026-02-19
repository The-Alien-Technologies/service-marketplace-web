"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";

const RATINGS = [
  { value: 1, label: "Very poor" },
  { value: 2, label: "Poor" },
  { value: 3, label: "Average" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
] as const;

interface ReviewFormProps {
  orderId: string;
}

export function ReviewForm({ orderId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const remainingChars = 500 - comment.length;

  // Check if this order already has a review
  useEffect(() => {
    const check = async () => {
      try {
        const existing = await apiService.getOrderReview(orderId);
        if (existing) setAlreadyReviewed(true);
      } catch {
        // ignore
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [orderId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.createReview({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 pb-40">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Already reviewed
        </h2>
        <p className="text-sm text-gray-500 mb-8 text-center">
          You have already submitted a review for this order.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/orders")}
          className="text-sm font-bold text-green-700 hover:text-green-800 hover:underline border-b border-green-700 pb-0.5"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 pb-40">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Your feedback has been submitted!
        </h2>
        <p className="text-sm text-gray-500 mb-8 text-center">
          Thanks for your feedback! Your review will help others.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/orders")}
          className="text-sm font-bold text-green-700 hover:text-green-800 hover:underline border-b border-green-700 pb-0.5"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Share your experience
        </h1>
        <p className="text-sm text-gray-500">
          Your feedback helps others hire with confidence.
        </p>
      </div>

      {/* Rating */}
      <div className="mb-8">
        <p className="text-sm font-bold text-gray-900 mb-3">Your rating</p>
        <div className="flex flex-wrap items-center gap-4">
          {RATINGS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRating(option.value)}
              className="group flex items-center gap-2 cursor-pointer"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  rating === option.value
                    ? "border-green-600"
                    : "border-gray-300 group-hover:border-green-500",
                )}
              >
                {rating === option.value && (
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                )}
              </div>
              <span className="text-sm text-gray-700 font-medium ml-1">
                {option.label}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "w-3 h-3",
                      index < option.value
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 fill-gray-200",
                    )}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-bold text-gray-900">
            Tell us more about your experience
          </p>
          <span className="text-xs text-gray-400">(optional)</span>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Enter a description..."
            className="w-full h-32 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none"
          />
          <div className="flex justify-end px-4 py-2 text-xs text-gray-400 bg-gray-50/50 border-t border-gray-100">
            {500 - remainingChars}/500
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 sm:flex-none sm:w-32 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !rating}
          className="flex-1 sm:flex-none sm:w-48 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#15803d] hover:bg-[#14532d] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit review
        </button>
      </div>
    </form>
  );
}
