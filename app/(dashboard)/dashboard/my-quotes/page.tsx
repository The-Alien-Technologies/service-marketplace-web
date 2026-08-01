"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { QuoteRequest, QuoteStatus } from "@/types/quote";
import { toast } from "react-toastify";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_LABEL_MAP: Record<QuoteStatus, string> = {
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

const tabs: { label: string; value: QuoteStatus | null }[] = [
  { label: "All", value: null },
  { label: "Submitted", value: "NEW" },
  { label: "Offer Received", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Expired", value: "EXPIRED" },
];

export default function MyQuotesPage() {
  const [activeTab, setActiveTab] = useState<QuoteStatus | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {},
  );
  const [search, setSearch] = useState("");

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getClientQuotes();
      setQuotes(data);
    } catch {
      toast.error("Failed to load your quote requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleRespond = async (
    quoteId: string,
    status: "ACCEPTED" | "DECLINED",
  ) => {
    setActionLoading((prev) => ({ ...prev, [quoteId]: status }));
    try {
      const updated = await apiService.respondToQuoteOffer(quoteId, status);
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast.success(
        status === "ACCEPTED"
          ? "Offer accepted! You can now proceed to checkout."
          : "Offer declined.",
      );
    } catch {
      toast.error("Failed to respond to offer. Please try again.");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[quoteId];
        return next;
      });
    }
  };

  const filtered = quotes.filter((q) => {
    const matchesTab = activeTab ? q.status === activeTab : true;
    const matchesSearch =
      !search ||
      q.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      q.provider.firstName.toLowerCase().includes(search.toLowerCase()) ||
      q.provider.lastName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
        <p className="text-gray-500 mt-1">
          Track your quote requests and provider offers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
              activeTab === tab.value
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by project or provider..."
          className="pl-10 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-500">
          No quote requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((quote) => {
            const styles = STATUS_STYLES[quote.status];
            const label = STATUS_LABEL_MAP[quote.status];
            const hasOffer = quote.status === "PENDING";
            const providerName = `${quote.provider.firstName} ${quote.provider.lastName}`;

            return (
              <div
                key={quote.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4"
              >
                {/* Row 1: Provider info + date + status */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                      {quote.provider.avatar ? (
                        <Image
                          src={quote.provider.avatar}
                          alt={providerName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm uppercase">
                          {quote.provider.firstName?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {providerName}
                      </p>
                      {quote.service && (
                        <p className="text-xs text-gray-500">
                          {quote.service.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(quote.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        styles.badge,
                      )}
                    >
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}
                      />
                      {label}
                    </span>
                  </div>
                </div>

                {/* Row 2: Project details */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {quote.projectTitle}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>Delivery: {quote.deliveryTime}</span>
                  <span className="text-gray-300">|</span>
                  <span>
                    Budget:{" "}
                    <strong className="text-gray-900">
                      {quote.currency} {Number(quote.budget).toLocaleString()}
                    </strong>
                  </span>
                </div>

                {/* Row 3: Provider's offer note (only when PENDING) */}
                {hasOffer && quote.providerNote && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      Provider&apos;s offer note:
                    </p>
                    <p className="text-sm text-amber-800">
                      {quote.providerNote}
                    </p>
                  </div>
                )}

                {/* Row 4: Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Link
                    href={`/dashboard/my-quotes/${quote.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
                  >
                    View details <ChevronRight className="w-4 h-4" />
                  </Link>

                  {/* Accept/Decline only when provider has sent an offer */}
                  {hasOffer && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                        onClick={() => handleRespond(quote.id, "DECLINED")}
                        disabled={!!actionLoading[quote.id]}
                      >
                        {actionLoading[quote.id] === "DECLINED" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800 text-white gap-1.5"
                        onClick={() => handleRespond(quote.id, "ACCEPTED")}
                        disabled={!!actionLoading[quote.id]}
                      >
                        {actionLoading[quote.id] === "ACCEPTED" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Accept Offer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
