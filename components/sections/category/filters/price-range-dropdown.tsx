"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslations } from "next-intl";

interface PriceRangeDropdownProps {
  selectedRange: { min: number; max: number };
  onApply: (range: { min: number; max: number }) => void;
  trigger: React.ReactNode;
}

export function PriceRangeDropdown({
  selectedRange,
  onApply,
  trigger,
}: PriceRangeDropdownProps) {
  const t = useTranslations("Marketplace");
  const [open, setOpen] = useState(false);
  const [tempMin, setTempMin] = useState(selectedRange.min);
  const [tempMax, setTempMax] = useState(selectedRange.max);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const MIN_PRICE = 0;
  const MAX_PRICE = 50000;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMobile, open]);

  const toggleDropdown = () => {
    if (!open) {
      setTempMin(selectedRange.min);
      setTempMax(selectedRange.max);
    }
    setOpen(!open);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(
      MIN_PRICE,
      Math.min(value, MAX_PRICE, tempMax)
    );
    setTempMin(clampedValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(tempMin, Math.min(value, MAX_PRICE));
    setTempMax(clampedValue);
  };

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value <= tempMax) {
      setTempMin(value);
    }
  };

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= tempMin) {
      setTempMax(value);
    }
  };

  const clearAll = () => {
    setTempMin(MIN_PRICE);
    setTempMax(MAX_PRICE);
  };

  const handleApply = () => {
    onApply({ min: tempMin, max: tempMax });
    setOpen(false);
  };

  const minPercent = ((tempMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPercent = ((tempMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const rangeInputClass =
    "pointer-events-none absolute inset-x-0 top-1/2 h-11 min-h-11 -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-400 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-none";

  const priceControls = (
    <>
      <div className="mb-6 pt-2">
        <div className="relative h-3">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-900"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
          <input
            type="range"
            aria-label={t("minimumPrice")}
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={tempMin}
            onChange={handleMinSlider}
            className={rangeInputClass}
          />
          <input
            type="range"
            aria-label={t("maximumPrice")}
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={tempMax}
            onChange={handleMaxSlider}
            className={rangeInputClass}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:flex sm:items-end sm:justify-between">
        <label className="text-xs text-gray-600 sm:w-24">
          {t("minimum")}
          <input
            type="number"
            value={tempMin}
            onChange={handleMinChange}
            min={MIN_PRICE}
            max={MAX_PRICE}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-center text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-900 sm:min-h-0 sm:rounded-full sm:py-2 sm:text-sm"
          />
        </label>
        <label className="text-xs text-gray-600 sm:w-24">
          {t("maximum")}
          <input
            type="number"
            value={tempMax}
            onChange={handleMaxChange}
            min={MIN_PRICE}
            max={MAX_PRICE}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-center text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-900 sm:min-h-0 sm:rounded-full sm:py-2 sm:text-sm"
          />
        </label>
      </div>
    </>
  );

  const actions = (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:pt-2">
      <button
        type="button"
        onClick={clearAll}
        className="min-h-11 px-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:min-h-0 sm:py-1.5"
      >
        {t("clearFilters")}
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="min-h-11 rounded-lg bg-brand-900 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2 sm:min-h-0 sm:px-5 sm:py-1.5"
      >
        {t("apply")}
      </button>
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div onClick={toggleDropdown}>{trigger}</div>

      {/* Dropdown */}
      {open && isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl border-gray-200 bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300" />
            <SheetHeader className="border-b border-gray-200 px-5 pb-4 pt-3 pr-14 text-left">
              <SheetTitle className="text-lg text-gray-900">
                {t("priceRangeTitle")}
              </SheetTitle>
              <SheetDescription>
                {t("priceRangeHint")}
              </SheetDescription>
            </SheetHeader>
            <div className="px-5 pt-6">
              {priceControls}
              {actions}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {open && !isMobile && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[300px] rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
          <h3 className="mb-5 text-base font-semibold text-gray-900">
            {t("priceRangeTitle")}
          </h3>
          {priceControls}
          {actions}
        </div>
      )}
    </div>
  );
}
