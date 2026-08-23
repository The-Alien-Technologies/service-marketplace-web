"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import {
  isValidPartialRefund,
  remainingRefundAmount,
} from "@/lib/payment-state";
import {
  Dispute,
  DisputeResolutionType,
  DisputeStatus,
  ISSUE_TYPE_LABELS,
  DISPUTE_STATUS_LABELS,
  DISPUTE_PRIORITY_LABELS,
} from "@/types/dispute";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DisputeStatus }) {
  const styles: Record<DisputeStatus, string> = {
    OPEN: "bg-red-50 text-red-700 border-red-200",
    INVESTIGATING: "bg-amber-50 text-amber-700 border-amber-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    CLOSED: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const dots: Record<DisputeStatus, string> = {
    OPEN: "bg-red-500",
    INVESTIGATING: "bg-amber-500",
    RESOLVED: "bg-green-500",
    CLOSED: "bg-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[status]}`} />
      {DISPUTE_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Party card ───────────────────────────────────────────────────────────────

function PartyCard({
  party,
  role,
}: {
  party: Dispute["client"];
  role: "Client" | "Provider";
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        {party.avatar ? (
          <Image
            src={party.avatar}
            alt={party.firstName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-sm">
            {party.firstName?.[0]}
          </div>
        )}
      </div>
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">
            {party.firstName} {party.lastName}
          </span>
          <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {role}
          </span>
        </div>
        <div className="space-y-0.5">
          {party.email && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{party.email}</span>
            </div>
          )}
          {party.phoneNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {party.countryCode} {party.phoneNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DisputeDetailsPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = use(params);
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<DisputeStatus>("OPEN");
  const [adminNote, setAdminNote] = useState("");
  const [resolutionType, setResolutionType] =
    useState<DisputeResolutionType>("RELEASE_PROVIDER");
  const [refundAmount, setRefundAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const refundableAmount = dispute
    ? remainingRefundAmount(
        dispute.order.total,
        dispute.order.refunds?.reduce(
          (sum, refund) => sum + Number(refund.amount),
          0,
        ) ?? 0,
      )
    : 0;

  const fetchDispute = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getDispute(disputeId);
      setDispute(data);
      setSelectedStatus(data.status);
      setAdminNote(data.adminNote ?? "");
      if (data.resolutionType) setResolutionType(data.resolutionType);
      if (data.resolutionRefundAmount) {
        setRefundAmount(String(data.resolutionRefundAmount));
      }
    } catch {
      toast.error("Failed to load dispute");
    } finally {
      setIsLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  const handleSaveStatus = async () => {
    if (!dispute) return;
    setIsSaving(true);
    try {
      const updated = await apiService.updateDisputeStatus(
        dispute.id,
        selectedStatus,
        adminNote,
      );
      setDispute(updated);
      toast.success("Review status updated");
    } catch {
      toast.error("Failed to update dispute");
    } finally {
      setIsSaving(false);
    }
  };

  const requestResolution = () => {
    if (!dispute) return;
    if (resolutionType === "PARTIAL_REFUND") {
      const amount = Number(refundAmount);
      if (!isValidPartialRefund(amount, refundableAmount)) {
        toast.error(
          `Enter a partial refund below the remaining GHS ${refundableAmount.toFixed(2)} balance`,
        );
        return;
      }
    }
    setResolveConfirmOpen(true);
  };

  const handleResolve = async () => {
    if (!dispute) return;
    setIsSaving(true);
    try {
      await apiService.resolveDispute(
        dispute.id,
        resolutionType,
        resolutionType === "PARTIAL_REFUND" ? Number(refundAmount) : undefined,
        adminNote,
      );
      toast.success(
        resolutionType === "RELEASE_PROVIDER"
          ? "Provider earnings released"
          : "Refund submitted to Paystack",
      );
      setResolveConfirmOpen(false);
      await fetchDispute();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resolve dispute",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-20 text-gray-500">Dispute not found.</div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* Header & Breadcrumbs */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin
              ? "Review and resolve conflicts between customers and service providers."
              : "Review the dispute status and resolution for this order."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/disputes"
            className="hover:text-gray-900 transition-colors"
          >
            Disputes
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium font-mono">
            {dispute.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="flex-1 space-y-8">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 font-mono">
                #{dispute.id.slice(0, 8).toUpperCase()}
              </h2>
              <StatusBadge status={dispute.status} />
            </div>
            <span className="text-sm text-gray-500">
              {new Date(dispute.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Order info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm bg-gray-50 rounded-xl p-4">
            <div>
              <span className="text-gray-500 text-xs block">Order</span>
              <span className="font-bold text-gray-900">
                #{dispute.order.orderNumber}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500 text-xs block">Service</span>
              <span className="font-medium text-gray-900">
                {dispute.order.service.title}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500 text-xs block">Plan</span>
              <span className="font-medium text-gray-900">
                {dispute.order.planTitle}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500 text-xs block">Total</span>
              <span className="font-bold text-gray-900">
                GHS {Number(dispute.order.total).toFixed(2)}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500 text-xs block">Priority</span>
              <span
                className={cn(
                  "font-medium",
                  dispute.priority === "HIGH"
                    ? "text-red-600"
                    : dispute.priority === "MEDIUM"
                      ? "text-amber-600"
                      : "text-gray-600",
                )}
              >
                {DISPUTE_PRIORITY_LABELS[dispute.priority]}
              </span>
            </div>
          </div>

          {/* Parties Involved */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Parties Involved
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white border border-gray-100 rounded-xl">
              <PartyCard party={dispute.client} role="Client" />
              <PartyCard party={dispute.provider} role="Provider" />
            </div>
            <Link
              href={`/dashboard/orders/${dispute.orderId}`}
              className="inline-flex items-center text-sm text-green-700 font-medium hover:underline"
            >
              View order summary →
            </Link>
          </div>

          {/* Issue Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Issue summary</h3>
            <div className="space-y-4 p-5 bg-white border border-gray-100 rounded-xl">
              <div>
                <span className="block text-xs text-gray-500 mb-1">
                  Issue Type
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {ISSUE_TYPE_LABELS[dispute.issueType]}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">
                  Description
                </span>
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution status */}
          {(dispute.status === "RESOLVED" || dispute.status === "CLOSED") && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-800 text-sm mb-1">
                  Dispute {DISPUTE_STATUS_LABELS[dispute.status]}
                </h4>
                {dispute.adminNote && (
                  <p className="text-sm text-green-700">{dispute.adminNote}</p>
                )}
                {dispute.resolvedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    {new Date(dispute.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="w-full xl:w-[360px] space-y-6">
          {/* Admin Resolution Panel */}
          {isAdmin && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Admin Resolution
            </h3>

            {dispute.status !== "RESOLVED" && dispute.status !== "CLOSED" ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="dispute-review-status"
                    className="text-xs font-medium text-gray-700"
                  >
                    Review status
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedStatus}
                      onValueChange={(v) =>
                        setSelectedStatus(v as DisputeStatus)
                      }
                    >
                      <SelectTrigger
                        id="dispute-review-status"
                        className="bg-white"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="INVESTIGATING">
                          Investigating
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={handleSaveStatus}
                      disabled={isSaving || selectedStatus === dispute.status}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="dispute-financial-outcome"
                    className="text-xs font-medium text-gray-700"
                  >
                    Financial outcome
                  </label>
                  <Select
                    value={resolutionType}
                    onValueChange={(value) =>
                      setResolutionType(value as DisputeResolutionType)
                    }
                  >
                    <SelectTrigger
                      id="dispute-financial-outcome"
                      className="bg-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RELEASE_PROVIDER">
                        Release provider earnings
                      </SelectItem>
                      <SelectItem value="FULL_REFUND">
                        Full customer refund
                      </SelectItem>
                      <SelectItem value="PARTIAL_REFUND">
                        Partial customer refund
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {resolutionType === "PARTIAL_REFUND" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="dispute-refund-amount"
                      className="text-xs font-medium text-gray-700"
                    >
                      Customer refund amount (GHS)
                    </label>
                    <Input
                      id="dispute-refund-amount"
                      type="number"
                      min="0.01"
                      max={Math.max(0, Number(dispute.order.total) - 0.01)}
                      step="0.01"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      placeholder="0.00"
                      className="bg-white"
                    />
                    {Number(refundAmount) > 0 && (
                      <p className="text-xs leading-relaxed text-gray-500">
                        The remaining GHS{" "}
                        {Math.max(
                          0,
                          refundableAmount - Number(refundAmount),
                        ).toFixed(2)}{" "}
                        is split using the order’s original{" "}
                        {Number(dispute.order.commissionRate ?? 10)}% commission
                        rate.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                Financial outcome:{" "}
                {dispute.resolutionType?.replaceAll("_", " ").toLowerCase() ||
                  "resolved"}
                {dispute.resolutionRefundAmount
                  ? ` · GHS ${Number(dispute.resolutionRefundAmount).toFixed(2)} refund`
                  : ""}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="dispute-resolution-note"
                className="text-xs font-medium text-gray-700"
              >
                Resolution note{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Textarea
                id="dispute-resolution-note"
                placeholder="Add an internal note about how this dispute was resolved..."
                className="min-h-[120px] bg-white resize-none text-sm"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            {dispute.status !== "RESOLVED" && dispute.status !== "CLOSED" && (
              <Button
                className="w-full bg-[#15803d] hover:bg-[#14532d] text-white flex items-center gap-2 justify-center"
                onClick={requestResolution}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSaving
                  ? "Submitting..."
                  : resolutionType === "RELEASE_PROVIDER"
                    ? "Release earnings"
                    : "Submit refund"}
              </Button>
            )}
          </div>
          )}

          {/* Timeline */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Timeline</h3>
            <div className="relative space-y-6 pl-2">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

              {/* Submitted */}
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-[22px] h-[22px] bg-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 leading-none">
                  Dispute opened
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(dispute.createdAt).toLocaleString()}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-gray-100 text-gray-600 mt-1">
                  Client
                </span>
              </div>

              {/* Current status */}
              {dispute.status !== "OPEN" && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-none">
                    Status changed to &quot;
                    {DISPUTE_STATUS_LABELS[dispute.status]}&quot;
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(dispute.updatedAt).toLocaleString()}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-gray-100 text-gray-600 mt-1">
                    Admin
                  </span>
                </div>
              )}

              {/* Resolved */}
              {dispute.resolvedAt && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-none">
                    Dispute{" "}
                    {DISPUTE_STATUS_LABELS[dispute.status].toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(dispute.resolvedAt).toLocaleString()}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-green-100 text-green-700 mt-1">
                    Admin
                  </span>
                </div>
              )}

              {/* Pending */}
              {dispute.status === "OPEN" && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] bg-white flex items-center justify-center">
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 leading-none italic">
                    Awaiting review
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={resolveConfirmOpen} onOpenChange={setResolveConfirmOpen}>
        <DialogContent className="bg-white sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              {resolutionType === "RELEASE_PROVIDER"
                ? "Release provider earnings?"
                : resolutionType === "FULL_REFUND"
                  ? `Refund the remaining GHS ${refundableAmount.toFixed(2)}?`
                  : `Refund GHS ${Number(refundAmount || 0).toFixed(2)}?`}
            </DialogTitle>
            <DialogDescription>
              {resolutionType === "RELEASE_PROVIDER"
                ? "This makes the provider’s earnings eligible for withdrawal and resolves the dispute."
                : "This submits a real Paystack refund and reserves the order while the provider confirms it. This action cannot be undone in Pavodah."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            Order #{dispute.order.orderNumber} · Remaining refundable GHS{" "}
            {refundableAmount.toFixed(2)}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={handleResolve}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
