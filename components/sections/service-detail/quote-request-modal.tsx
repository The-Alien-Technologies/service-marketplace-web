"use client";

import { X, Paperclip, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";
import { useFormatter, useTranslations } from "next-intl";

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
  serviceId?: string;
  currency: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

export function QuoteRequestModal({
  isOpen,
  onClose,
  providerId,
  serviceId,
  currency,
}: QuoteRequestModalProps) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const format = useFormatter();
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [budget, setBudget] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped: AttachedFile[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      size: Math.round(f.size / 1024),
      file: f,
    }));
    setAttachedFiles((prev) => [...prev, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) {
      toast.error(t("providerMissing"));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.createQuote(
        {
          providerId,
          serviceId,
          projectTitle,
          description: projectDescription,
          deliveryTime,
          budget: parseFloat(budget),
        },
        attachedFiles.map((f) => f.file),
      );
      toast.success(t("quoteSubmitted"));
      // Reset
      setProjectTitle("");
      setProjectDescription("");
      setDeliveryTime("");
      setBudget("");
      setAttachedFiles([]);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("quoteSubmitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx"
        onChange={handleFileSelect}
      />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div className="pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[calc(100dvh-2rem)]">
          {/* Left Side - Image */}
          <div className="hidden md:block md:w-[50%] relative">
            <img
              src="/assets/site-images/quote_request.png"
              alt={t("quoteTitle")}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-[50%] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("quoteTitle")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("quoteBody")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={common("close")}
                  className="ml-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 sm:ml-4"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                id="quote-form"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Project Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("projectTitle")}
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder={t("projectTitlePlaceholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                    required
                  />
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("projectDescription")}
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder={t("projectDescriptionPlaceholder")}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Attach Files */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("attachFiles")}{" "}
                    <Paperclip className="w-4 h-4 inline ml-1" />
                  </label>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-brand-900 hover:text-brand-900 dark:hover:border-brand-500 dark:hover:text-brand-500 transition-colors"
                  >
                    {t("uploadFiles")}
                  </button>

                  {attachedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600 dark:text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format.number(file.size)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            aria-label={common("remove")}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("deliveryTime")}
                  </label>
                  <div className="relative">
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent appearance-none cursor-pointer"
                      required
                    >
                      <option value="">{t("deliveryTime")}</option>
                      <option value="1-3 Days">{t("oneToThreeDays")}</option>
                      <option value="3-5 Days">{t("threeToFiveDays")}</option>
                      <option value="1-2 Weeks">{t("oneToTwoWeeks")}</option>
                      <option value="2-4 Weeks">{t("twoToFourWeeks")}</option>
                      <option value="1 Month+">{t("oneMonthPlus")}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("budget")}
                  </label>
                  <div className="flex gap-2">
                    <span className="inline-flex w-24 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      {currency}
                    </span>

                    {/* Budget Input */}
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="5000.00"
                      min={0}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {common("cancel")}
                </button>
                <button
                  type="submit"
                  form="quote-form"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("submitRequest")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
