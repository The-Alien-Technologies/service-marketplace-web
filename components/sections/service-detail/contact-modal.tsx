"use client";

import { MessageSquare, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
  onGetQuote: () => void;
}

export function ContactModal({
  isOpen,
  onClose,
  onStartChat,
  onGetQuote,
}: ContactModalProps) {
  const t = useTranslations("Marketplace");
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm pointer-events-auto">
          {/* Header */}
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("connectPrompt")}
            </h3>
          </div>

          {/* Options */}
          <div className="px-6 pb-6 space-y-3">
            {/* Get a quote */}
            <button
              onClick={onGetQuote}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {t("getQuote")}
              </span>
            </button>

            {/* Start a chat */}
            <button
              onClick={onStartChat}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {t("startChat")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
