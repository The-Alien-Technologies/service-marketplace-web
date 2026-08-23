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
import { ISSUE_TYPE_LABELS, DisputeIssueType } from "@/types/dispute";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_TYPES = Object.entries(ISSUE_TYPE_LABELS) as [
  DisputeIssueType,
  string,
][];

export function RaiseDisputeModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [issueType, setIssueType] = useState<DisputeIssueType | "">("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType) {
      toast.error("Please select an issue type");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe what went wrong");
      return;
    }
    setIsLoading(true);
    try {
      await apiService.createDispute({ orderId, issueType, description });
      toast.success("Dispute raised successfully. Our team will review it.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to raise dispute";
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
              Raise a Dispute
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            Order <strong className="text-gray-700">#{orderNumber}</strong> —
            our support team will review your dispute and contact both parties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor="dispute-issue-type"
              className="text-sm font-medium text-gray-700"
            >
              Issue type
            </label>
            <Select
              value={issueType}
              onValueChange={(v) => setIssueType(v as DisputeIssueType)}
            >
              <SelectTrigger id="dispute-issue-type" className="bg-white">
                <SelectValue placeholder="Select the issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
              Describe the issue{" "}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <Textarea
              id="dispute-description"
              placeholder="Please describe the issue in detail so we can resolve it quickly..."
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
            Disputes are reviewed within 2–3 business days. You may be contacted
            via email or phone for more information.
          </div>

          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              disabled={isLoading || !issueType || !description.trim()}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Dispute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
