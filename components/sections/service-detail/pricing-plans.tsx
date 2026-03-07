"use client";

import {
  Check,
  Layers,
  Zap,
  CreditCard,
  ChevronDown,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { ContactModal } from "./contact-modal";
import { ChatBox } from "./chat-box";
import { QuoteRequestModal } from "./quote-request-modal";
import { CheckoutModal } from "./checkout-modal";

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  icon: "layers" | "layers-stacked" | "zap";
  price: string;
  features: PricingFeature[];
  isPopular?: boolean;
}

interface PricingPlansProps {
  plans: PricingPlan[];
  providerName: string;
  providerAvatar: string;
  service: {
    id: string;
    title: string;
    providerId: string;
    addons?: {
      id: string;
      title: string;
      description?: string;
      price: number | string;
    }[];
  };
  serviceId: string;
}

export function PricingPlans({
  plans,
  providerName,
  providerAvatar,
  service,
  serviceId,
}: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[0]?.id || "");
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(
    new Set([plans[0]?.id || ""]),
  );
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "layers":
        return <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "layers-stacked":
        return <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "zap":
        return <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      default:
        return <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
    }
  };

  const togglePlanExpansion = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleStartChat = () => {
    setIsContactModalOpen(false);
    setIsChatOpen(true);
  };

  const handleGetQuote = () => {
    setIsContactModalOpen(false);
    setIsQuoteModalOpen(true);
  };

  const handleConfirm = () => {
    setIsCheckoutModalOpen(true);
  };

  const getSelectedPlanData = () => {
    return plans.find((plan) => plan.id === selectedPlan) || plans[0];
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Choose your plan
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-[52px]">
            Flexible pricing that grows with you.
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => {
            const isExpanded = expandedPlans.has(plan.id);
            const isSelected = selectedPlan === plan.id;

            return (
              <div key={plan.id}>
                {/* Plan Header */}
                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    togglePlanExpansion(plan.id);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-brand-900 bg-brand-50 dark:bg-brand-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-brand-100 dark:bg-brand-900/20"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {getIcon(plan.icon)}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.isPopular && (
                      <span className="text-xs font-semibold text-brand-900 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/20 px-2 py-1 rounded">
                        Popular
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-brand-900 bg-brand-900"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>

                {/* Plan Details - Show if expanded */}
                {isExpanded && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2.5">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-brand-900 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleContactClick}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact me
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onStartChat={handleStartChat}
        onGetQuote={handleGetQuote}
      />

      {/* Chat Box */}
      <ChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        providerId={service.providerId}
        providerName={providerName}
        providerAvatar={providerAvatar}
      />

      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        providerId={service.providerId}
        serviceId={serviceId}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        selectedPlan={getSelectedPlanData()}
        service={service}
        serviceId={serviceId}
      />
    </>
  );
}
