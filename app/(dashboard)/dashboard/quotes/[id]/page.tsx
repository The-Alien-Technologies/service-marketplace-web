"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Download, FileText, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { QuoteRequest, QuoteStatus } from "@/types/quote";
import { toast } from "react-toastify";
import { ChatBox } from "@/components/sections/service-detail/chat-box";
import { useChatStore } from "@/store/chat-store";

// --- Components ---

function StatusBadge({ status }: { status: QuoteStatus }) {
  const labels: Record<QuoteStatus, string> = {
    NEW: "New Request",
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    EXPIRED: "Expired",
  };

  let badgeStyles = "bg-gray-50 text-gray-700 border-gray-200";
  let dotStyles = "bg-gray-500";
  switch (status) {
    case "NEW":
      badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
      dotStyles = "bg-blue-500";
      break;
    case "ACCEPTED":
      badgeStyles = "bg-green-50 text-green-700 border-green-200";
      dotStyles = "bg-green-500";
      break;
    case "PENDING":
      badgeStyles = "bg-orange-50 text-orange-700 border-orange-200";
      dotStyles = "bg-orange-500";
      break;
    case "DECLINED":
      badgeStyles = "bg-red-50 text-red-700 border-red-200";
      dotStyles = "bg-red-500";
      break;
    case "EXPIRED":
      badgeStyles = "bg-gray-100 text-gray-700 border-gray-200";
      dotStyles = "bg-gray-500";
      break;
  }

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles}`} />
      {labels[status]}
    </div>
  );
}

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("Too busy at the moment");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { startCustomConversation, setActiveConversation } = useChatStore();

  // Offer form state
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDelivery, setOfferDelivery] = useState("");
  const [offerBudget, setOfferBudget] = useState("");
  const [offerNote, setOfferNote] = useState("");

  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getQuote(id);
        setQuote(data);
        setOfferTitle(data.projectTitle);
        setOfferBudget(String(Number(data.budget)));
        setOfferDelivery(data.deliveryTime);
      } catch {
        toast.error("Failed to load quote request.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuote();
  }, [id]);

  const handleAccept = async () => {
    setIsActionLoading(true);
    try {
      const updated = await apiService.updateQuoteStatus(id, "ACCEPTED");
      setQuote(updated);
      toast.success("Quote accepted!");
    } catch {
      toast.error("Failed to accept quote.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsActionLoading(true);
    try {
      const updated = await apiService.updateQuoteStatus(
        id,
        "DECLINED",
        declineReason,
      );
      setQuote(updated);
      setIsDeclineModalOpen(false);
      toast.success("Quote declined.");
    } catch {
      toast.error("Failed to decline quote.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const updated = await apiService.sendQuoteOffer(id, {
        projectTitle: offerTitle,
        budget: parseFloat(offerBudget),
        deliveryTime: offerDelivery,
        providerNote: offerNote,
      });
      setQuote(updated);
      toast.success("Offer sent!");
    } catch {
      toast.error("Failed to send offer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMessageClient = async () => {
    if (!quote) return;
    try {
      const conv = await startCustomConversation(quote.client.id);
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
        Quote request not found.
      </div>
    );
  }

  const clientName = `${quote.client.firstName} ${quote.client.lastName}`;
  const isNew = quote.status === "NEW";
  const isAccepted = quote.status === "ACCEPTED";
  const isDeclined = quote.status === "DECLINED";
  const isExpired = quote.status === "EXPIRED";
  const isPending = quote.status === "PENDING";

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>
        <p className="text-gray-500 mt-1">
          View, manage, and respond to client quote requests.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/dashboard/quotes"
          className="hover:text-gray-900 transition-colors"
        >
          Quote Requests
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{clientName}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Request Details */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative">
                {quote.client.avatar ? (
                  <Image
                    src={quote.client.avatar}
                    alt={clientName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium uppercase">
                    {quote.client.firstName?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {clientName}
                </h2>
              </div>
              <StatusBadge status={quote.status} />
            </div>
            <span className="text-sm text-gray-500">
              {new Date(quote.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Project title
              </h3>
              <p className="text-gray-600">{quote.projectTitle}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Budget</h3>
              <p className="text-gray-600">
                {quote.currency} {Number(quote.budget).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Project description
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {quote.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Delivery Time
              </h3>
              <p className="text-gray-600">{quote.deliveryTime}</p>
            </div>

            {/* Attachments */}
            {quote.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Attachments
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fileName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-700 text-sm font-medium hover:underline"
                          >
                            Preview
                          </a>
                          <a
                            href={url}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions Section */}
            {(isNew || isAccepted) && (
              <div className="pt-4 flex items-center gap-3">
                <Button
                  className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[120px] rounded-lg"
                  onClick={handleAccept}
                  disabled={isActionLoading || isAccepted}
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isAccepted ? (
                    "Accepted"
                  ) : (
                    "Accept offer"
                  )}
                </Button>
                {isNew && (
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                    onClick={() => setIsDeclineModalOpen(true)}
                    disabled={isActionLoading}
                  >
                    Decline
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 gap-2 font-medium rounded-lg"
                  onClick={handleMessageClient}
                >
                  <Mail className="w-4 h-4" />
                  Message client
                </Button>
              </div>
            )}

            {isPending && (
              <div className="pt-4 flex items-center gap-3">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium min-w-[120px] rounded-lg">
                  Cancel Quote
                </Button>
                <Button
                  variant="outline"
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 gap-2 font-medium rounded-lg"
                >
                  <Mail className="w-4 h-4" />
                  Message client
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="xl:col-span-1">
          {isNew && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1">Send Your Offer</h3>
              <p className="text-xs text-gray-500 mb-6">
                Customize your proposal for this request.
              </p>

              <form className="space-y-5" onSubmit={handleSendOffer}>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Project title
                  </label>
                  <Input
                    placeholder='Example: "Standard Interior Package"'
                    className="bg-white"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Delivery time
                  </label>
                  <Select
                    value={offerDelivery}
                    onValueChange={setOfferDelivery}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Delivery time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3 Days">1-3 Days</SelectItem>
                      <SelectItem value="3-5 Days">3-5 Days</SelectItem>
                      <SelectItem value="1-2 Weeks">1-2 Weeks</SelectItem>
                      <SelectItem value="1 Month+">1 Month+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Budget (GHS)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r border-gray-200 pr-2 h-full py-2">
                      <span className="text-xs text-gray-600 font-medium">
                        GHS
                      </span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-16 bg-white"
                      value={offerBudget}
                      onChange={(e) => setOfferBudget(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Note
                  </label>
                  <Textarea
                    placeholder="Type here..."
                    className="bg-white min-h-[100px] resize-none"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full bg-[#15803d] hover:bg-[#14532d] text-white font-medium rounded-lg mt-2 flex items-center justify-center gap-2"
                >
                  {isActionLoading && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Send offer
                </Button>
              </form>
            </div>
          )}

          {isDeclined && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Decline reason</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                {quote.declineReason || "No reason provided."}
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-serif text-gray-500">
                  i
                </span>
                Important note
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                No response within 7 days
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Please tell us why you&apos;re declining
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              (Optional, helps us improve and inform the client)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {[
              "Too busy at the moment",
              "Outside my service area",
              "Budget too low",
              "Doesn't match my expertise",
              "Other",
            ].map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                    declineReason === reason
                      ? "border-green-600"
                      : "border-gray-300 group-hover:border-gray-400",
                  )}
                >
                  {declineReason === reason && (
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  name="decline-reason"
                  value={reason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}

            {declineReason === "Other" && (
              <div className="pt-2 pl-7">
                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                  Message to client
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  className="bg-white resize-none h-24"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeclineModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#15803d] hover:bg-[#14532d] text-white flex items-center justify-center gap-2"
              onClick={handleDecline}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit &amp; Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {quote && (
        <ChatBox
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          providerId={quote.client.id}
          providerName={`${quote.client.firstName} ${quote.client.lastName}`}
          providerAvatar={quote.client.avatar ?? ""}
        />
      )}
    </div>
  );
}
