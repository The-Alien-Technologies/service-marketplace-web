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

interface RatingOption {
  id: string;
  label: string;
  value: number;
}

interface RatingDropdownProps {
  selectedRatings: string[];
  onApply: (ratings: string[]) => void;
  trigger: React.ReactNode;
}

const ratingOptions: RatingOption[] = [
  { id: "top-rated", label: "Top rated(4.5+)", value: 4.5 },
  { id: "reliable", label: "Reliable(4.0+)", value: 4.0 },
  { id: "good-service", label: "Good service(3.5+)", value: 3.5 },
  { id: "all", label: "All", value: 0 },
];

export function RatingDropdown({
  selectedRatings,
  onApply,
  trigger,
}: RatingDropdownProps) {
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedRatings);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 639px)");

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
      setTempSelected([...selectedRatings]);
    }
    setOpen(!open);
  };

  const toggleRating = (ratingId: string) => {
    setTempSelected((prev) =>
      prev.includes(ratingId)
        ? prev.filter((id) => id !== ratingId)
        : [...prev, ratingId]
    );
  };

  const clearAll = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    onApply(tempSelected);
    setOpen(false);
  };

  const ratingOptionsList = (
    <div className="space-y-1">
      {ratingOptions.map((option) => {
        const isSelected = tempSelected.includes(option.id);

        return (
          <label
            key={option.id}
            className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-gray-900 hover:bg-gray-50 sm:min-h-0 sm:py-1.5"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleRating(option.id)}
              className="peer sr-only min-h-0"
            />
            <span
              aria-hidden="true"
              className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-900 peer-focus-visible:ring-offset-2 sm:size-4 ${
                isSelected
                  ? "border-brand-900 bg-brand-900"
                  : "border-gray-300 bg-white group-hover:border-gray-400"
              }`}
            >
              {isSelected && (
              <svg
                className="h-3 w-3 text-white sm:h-2.5 sm:w-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={4}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              )}
            </span>
            <span className="flex items-center gap-1 text-sm">
              {option.label}
              {option.id !== "all" && (
                <span aria-hidden="true" className="text-yellow-500">
                  ⭐
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );

  const actions = (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:pt-2">
      <button
        type="button"
        onClick={clearAll}
        className="min-h-11 px-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:min-h-0 sm:py-1.5"
      >
        Clear all
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="min-h-11 rounded-lg bg-brand-900 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2 sm:min-h-0 sm:px-5 sm:py-1.5"
      >
        Apply
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
              <SheetTitle className="text-lg text-gray-900">Rating</SheetTitle>
              <SheetDescription>
                Choose the ratings you want to see.
              </SheetDescription>
            </SheetHeader>
            <div className="px-5 pt-3">
              {ratingOptionsList}
              <div className="pt-3">{actions}</div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {open && !isMobile && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3">{ratingOptionsList}</div>
          <div className="px-4 pb-3">{actions}</div>
        </div>
      )}
    </div>
  );
}
