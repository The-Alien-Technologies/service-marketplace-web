"use client";

import { useState, useRef } from "react";
import { X, Paperclip, Loader2 } from "lucide-react";
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
import { apiService } from "@/lib/api";

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  serviceId?: string;
  currency: string;
}

export function RequestQuoteModal({
  isOpen,
  onClose,
  providerId,
  serviceId,
  currency,
}: RequestQuoteModalProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [budget, setBudget] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !description || !deliveryTime || !budget) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await apiService.createQuote(
        {
          providerId,
          serviceId,
          projectTitle,
          description,
          deliveryTime,
          budget: parseFloat(budget),
        },
        attachments,
      );
      // Reset and close
      setProjectTitle("");
      setDescription("");
      setDeliveryTime("");
      setBudget("");
      setAttachments([]);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to submit quote request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Request a Quote
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tell us what you need, and the freelancer will send you a custom
                offer.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">
                Project title
              </label>
              <Input
                placeholder='Example: "Redesign of 2-bedroom apartment"'
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">
                Project description
              </label>
              <Textarea
                placeholder="Briefly describe what you need done. Include goals, style preferences, or specific requirements."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            {/* Attach files */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                Attach files <Paperclip className="w-3.5 h-3.5 text-gray-400" />
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Click to upload or drag and drop
              </button>
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Delivery time */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">
                Delivery time
              </label>
              <Select
                value={deliveryTime}
                onValueChange={setDeliveryTime}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Delivery time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3 Days">1-3 Days</SelectItem>
                  <SelectItem value="3-5 Days">3-5 Days</SelectItem>
                  <SelectItem value="1-2 Weeks">1-2 Weeks</SelectItem>
                  <SelectItem value="2-4 Weeks">2-4 Weeks</SelectItem>
                  <SelectItem value="1 Month+">1 Month+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">
                Budget
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 px-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 font-medium shrink-0">
                  {currency}
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder="5000.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#15803d] hover:bg-[#14532d] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
