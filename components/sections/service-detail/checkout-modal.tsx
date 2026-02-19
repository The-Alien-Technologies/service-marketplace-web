"use client";

import { X, Check, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/order-store";

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    id: string;
    name: string;
    price: string;
    features: { text: string }[];
  };
  service: any;
  serviceId: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  service,
  serviceId,
}: CheckoutModalProps) {
  const router = useRouter();
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(true);
  const { setPendingOrder } = useOrderStore();

  // Map service add-ons to component format
  const availableAddOns: AddOn[] =
    service?.addons?.map((addon: any) => ({
      id: addon.id,
      name: addon.title,
      description: addon.description || "",
      price: Number(addon.price),
    })) || [];

  if (!isOpen) return null;

  // Extract price number from plan price string (e.g., "GHS 250" -> 250)
  const planPrice = parseFloat(selectedPlan.price.replace(/[^0-9.]/g, ""));

  // Calculate add-ons total
  const addOnsTotal = Array.from(selectedAddOns).reduce((total, addOnId) => {
    const addOn = availableAddOns.find((a) => a.id === addOnId);
    return total + (addOn?.price || 0);
  }, 0);

  const subtotal = planPrice + addOnsTotal;

  const toggleAddOn = (addOnId: string) => {
    const newSelected = new Set(selectedAddOns);
    if (newSelected.has(addOnId)) {
      newSelected.delete(addOnId);
    } else {
      newSelected.add(addOnId);
    }
    setSelectedAddOns(newSelected);
  };

  const handleContinue = () => {
    // Build complete order data
    const selectedAddOnsData = Array.from(selectedAddOns).map((id) => {
      const addOn = availableAddOns.find((a) => a.id === id);
      return {
        id: addOn!.id,
        name: addOn!.name,
        description: addOn!.description,
        price: addOn!.price,
      };
    });

    const orderData = {
      serviceId,
      service: {
        id: service.id,
        title: service.title,
      },
      plan: {
        id: selectedPlan.id,
        name: selectedPlan.name,
        price: planPrice,
      },
      addOns: selectedAddOnsData,
      addOnsTotal,
      subtotal,
    };

    // Store in Zustand
    setPendingOrder(orderData);

    // Navigate to payment page
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[520px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            My Order
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Selected Plan */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Selected plan
            </h3>
            <div className="border-2 border-brand-900 bg-brand-50 dark:bg-brand-900/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-brand-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-base">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-brand-900 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>

              {/* Plan Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedPlan.price}
                </span>
              </div>

              {/* Plan Features */}
              <div className="space-y-2.5">
                {selectedPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="mb-6">
            <button
              onClick={() => setIsAddOnsExpanded(!isAddOnsExpanded)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Add-ons
              </h3>
              {isAddOnsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {isAddOnsExpanded && (
              <div className="space-y-3">
                {availableAddOns.map((addOn) => {
                  const isSelected = selectedAddOns.has(addOn.id);
                  return (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-brand-900 bg-brand-50 dark:bg-brand-900/10"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-brand-900 bg-brand-900"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                            {addOn.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {addOn.description}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm ml-4 flex-shrink-0">
                        GHS {addOn.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Order summary
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Order ID: #
                {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  GHS {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Info Notice */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You won't be charged until the freelancer accepts your order.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to plans
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-4 py-3 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
            >
              Continue (GHS {subtotal.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
