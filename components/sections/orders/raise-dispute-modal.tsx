"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { Dispute, DisputeIssueType } from "@/types/dispute";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dispute: Dispute) => void;
}

const ISSUE_TYPES: DisputeIssueType[] = [
  "LATE_DELIVERY",
  "NON_DELIVERY",
  "QUALITY_ISSUE",
  "PAYMENT_DISPUTE",
  "MISCOMMUNICATION",
  "OTHER",
];

export function RaiseDisputeModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations("Disputes");
  const common = useTranslations("Common");
  const [issueType, setIssueType] = useState<DisputeIssueType | "">("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType) {
      toast.error(t("issueRequired"));
      return;
    }
    if (!description.trim()) {
      toast.error(t("descriptionRequired"));
      return;
    }
    setIsLoading(true);
    try {
      const dispute = await apiService.createDispute({
        orderId,
        issueType,
        description,
      });
      toast.success(t("created"));
      onSuccess?.(dispute);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        t("createFailed");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {t("raiseTitle")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            {t.rich("orderReview", {
              number: orderNumber,
              strong: (chunks) => (
                <strong className="text-gray-700">{chunks}</strong>
              ),
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor="dispute-issue-type"
              className="text-sm font-medium text-gray-700"
            >
              {t("issueType")}
            </label>
            <Select
              value={issueType}
              onValueChange={(v) => setIssueType(v as DisputeIssueType)}
            >
              <SelectTrigger id="dispute-issue-type" className="bg-white">
                <SelectValue placeholder={t("selectIssue")} />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(
                      value === "LATE_DELIVERY"
                        ? "issueLateDelivery"
                        : value === "NON_DELIVERY"
                          ? "issueNonDelivery"
                        : value === "QUALITY_ISSUE"
                          ? "issueQuality"
                          : value === "PAYMENT_DISPUTE"
                            ? "issuePayment"
                            : value === "MISCOMMUNICATION"
                              ? "issueCommunication"
                              : "issueOther",
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dispute-description"
              className="text-sm font-medium text-gray-700"
            >
              {t("describe")}{" "}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <Textarea
              id="dispute-description"
              placeholder={t("descriptionPlaceholder")}
              className="bg-white resize-none min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 text-right">
              {description.length}/2000
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
            {t("reviewTime")}
          </div>

          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {common("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              disabled={isLoading || !issueType || !description.trim()}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
