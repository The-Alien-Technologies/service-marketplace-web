"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { QuoteRequest, QuoteStatus } from "@/types/quote";
import { toast } from "react-toastify";
import { ChatBox } from "@/components/sections/service-detail/chat-box";
import { useChatStore } from "@/store/chat-store";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  NEW: "Submitted",
  PENDING: "Offer Received",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const STATUS_STYLES: Record<QuoteStatus, { badge: string; dot: string }> = {
  NEW: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  PENDING: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  ACCEPTED: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  DECLINED: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  EXPIRED: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

export default function MyQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { startCustomConversation, setActiveConversation } = useChatStore();

  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getQuote(id);
        setQuote(data);
      } catch {
        toast.error("Failed to load quote details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuote();
  }, [id]);

  const handleRespond = async (status: "ACCEPTED" | "DECLINED") => {
    setActionLoading(status);
    try {
      const updated = await apiService.respondToQuoteOffer(id, status);
      setQuote(updated);
      toast.success(
        status === "ACCEPTED" ? "Offer accepted!" : "Offer declined.",
      );
      if (status === "ACCEPTED" && updated.order?.id) {
        router.push(`/checkout?orderId=${updated.order.id}`);
      }
    } catch {
      toast.error("Failed to respond to offer.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageProvider = async () => {
    if (!quote) return;
    try {
      const conv = await startCustomConversation(quote.provider.id);
      if (conv) setActiveConversation(conv);
    } catch {
      // conversation may already exist; open anyway
    }
    setIsChatOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16 text-gray-500">
        Quote not found.{" "}
        <Link href="/dashboard/my-quotes" className="text-green-600 underline">
          Go back
        </Link>
      </div>
    );
  }

  const styles = STATUS_STYLES[quote.status];
  const providerName = `${quote.provider.firstName} ${quote.provider.lastName}`;
  const hasOffer = quote.status === "PENDING";
  const isActionable =
    quote.status !== "ACCEPTED" &&
    quote.status !== "DECLINED" &&
    quote.status !== "EXPIRED";

  return (
    <>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Details</h1>
          <p className="text-gray-500 mt-1">
            Review your quote request and respond to provider offers.
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/my-quotes"
            className="hover:text-gray-900 transition-colors"
          >
            My Quotes
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{quote.projectTitle}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Request Details */}
          <div className="xl:col-span-2 space-y-8">
            {/* Provider info + Status */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                  {quote.provider.avatar ? (
                    <Image
                      src={quote.provider.avatar}
                      alt={providerName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium uppercase">
                      {quote.provider.firstName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{providerName}</h2>
                  {quote.service && (
                    <p className="text-sm text-gray-500">
                      {quote.service.title}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2",
                    styles.badge,
                  )}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}
                  />
                  {STATUS_LABEL[quote.status]}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(quote.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Quote details */}
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Project title
                </h3>
                <p className="text-gray-600">{quote.projectTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Your budget
                  </h3>
                  <p className="text-gray-600">
                    {quote.currency} {Number(quote.budget).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Delivery time
                  </h3>
                  <p className="text-gray-600">{quote.deliveryTime}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Project description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {quote.description}
                </p>
              </div>

              {/* Attachments */}
              {quote.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    Your attachments
                  </h3>
                  <div className="space-y-2">
                    {quote.attachments.map((url, i) => {
                      const fileName = url.split("/").pop() ?? `File ${i + 1}`;
                      return (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white max-w-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {fileName}
                            </p>
                          </div>
                          <a
                            href={url}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for offer response */}
            {hasOffer && (
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <Button
                  className="bg-green-700 hover:bg-green-800 text-white gap-2"
                  onClick={() => handleRespond("ACCEPTED")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "ACCEPTED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Accept Offer
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  onClick={() => handleRespond("DECLINED")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "DECLINED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Decline
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-700 border-gray-200"
                  onClick={handleMessageProvider}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Provider
                </Button>
              </div>
            )}

            {!isActionable && quote.status !== "PENDING" && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2 text-gray-700 border-gray-200"
                  onClick={handleMessageProvider}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Provider
                </Button>
              </div>
            )}
          </div>

          {/* Right: Provider's offer / Status panel */}
          <div className="xl:col-span-1">
            {hasOffer && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-amber-800">
                  Provider&apos;s Offer
                </h3>
                {quote.providerNote && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      Note from provider
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {quote.providerNote}
                    </p>
                  </div>
                )}
                <div className="border-t border-amber-200 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Proposed budget</span>
                    <span className="font-bold text-amber-900">
                      {quote.currency} {Number(quote.budget).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Delivery time</span>
                    <span className="font-bold text-amber-900">
                      {quote.deliveryTime}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {quote.status === "ACCEPTED" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Offer Accepted</h3>
                </div>
                <p className="text-sm text-green-700">
                  You accepted this provider&apos;s offer. Proceed to checkout
                  to place your order.
                </p>
              </div>
            )}

            {quote.status === "DECLINED" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="font-bold text-red-800 mb-2">Offer Declined</h3>
                {quote.declineReason && (
                  <p className="text-sm text-red-700">{quote.declineReason}</p>
                )}
              </div>
            )}

            {quote.status === "EXPIRED" && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-700 mb-2">Quote Expired</h3>
                <p className="text-sm text-gray-500">
                  No response was received within 7 days. You may submit a new
                  quote request to this provider.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        providerId={quote.provider.id}
        providerName={`${quote.provider.firstName} ${quote.provider.lastName}`}
        providerAvatar={quote.provider.avatar ?? ""}
      />
    </>
  );
}
