"use client";

import { useState } from "react";
import { Search, ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HorizontalSeparator } from "../../layout/horizontal-separator";

import { PriceRangeDropdown } from "./filters/price-range-dropdown";
import { RatingDropdown } from "./filters/rating-dropdown";
import { useFormatter, useTranslations } from "next-intl";

interface CategoryFiltersProps {
  categoryName: string;
  resultCount: number;
  currency?: string;
  isGlobal?: boolean;
  onFilterChange?: (filters: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
  }) => void;
}

export function CategoryFilters({
  categoryName,
  resultCount,
  currency = "GHS",
  isGlobal = false,
  onFilterChange,
}: CategoryFiltersProps) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const format = useFormatter();
  const sortOptions = [
    { label: t("bestMatch"), value: "best_match" },
    { label: t("mostPopular"), value: "popular" },
    { label: t("highestRated"), value: "rating" },
    ...(!isGlobal
      ? [
          { label: t("lowestPrice"), value: "price_asc" },
          { label: t("highestPrice"), value: "price_desc" },
        ]
      : []),
  ];
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 50000,
  });
  const [ratingIds, setRatingIds] = useState<string[]>([]);
  // const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("best_match");

  // Commented out for now - will be implemented later
  // const MAX_VISIBLE_FILTERS = 1;
  // const visibleSkills = selectedSkillIds.slice(0, MAX_VISIBLE_FILTERS);
  // const hiddenSkillCount = selectedSkillIds.length - MAX_VISIBLE_FILTERS;

  // const removeSkill = (skillId: string) => {
  //   setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
  // };

  const clearAllFilters = () => {
    setSearchQuery("");
    // setSelectedSkillIds([]);
    setPriceRange({ min: 0, max: 50000 });
    setRatingIds([]);
    // setDeliveryTime("");
    setSortBy("best_match");
    triggerFilterChange("", { min: 0, max: 50000 }, [], "best_match");
  };

  // const handleSkillsApply = (skills: string[]) => {
  //   setSelectedSkillIds(skills);
  // };

  const getPriceRangeDisplay = () => {
    if (priceRange.min === 0 && priceRange.max === 50000) {
      return t("priceRange");
    }
    const currencyOptions = {
      style: "currency" as const,
      currency,
      maximumFractionDigits: 0,
    };
    return `${format.number(priceRange.min, currencyOptions)}–${format.number(priceRange.max, currencyOptions)}`;
  };

  const getRatingDisplay = () => {
    if (ratingIds.length === 0) return t("rating");
    if (ratingIds.length === 1) {
      const ratingLabels: Record<string, string> = {
        "top-rated": t("topRated"),
        reliable: t("reliable"),
        "good-service": t("goodService"),
        all: t("allRatings"),
      };
      return ratingLabels[ratingIds[0]] || t("rating");
    }
    return t("selectedCount", { count: ratingIds.length });
  };

  const triggerFilterChange = (
    search?: string,
    price?: { min: number; max: number },
    ratings?: string[],
    sort?: string,
  ) => {
    const searchValue = search !== undefined ? search : searchQuery;
    const priceValue = price || priceRange;
    const ratingsValue = ratings || ratingIds;
    const sortValue = sort || sortBy;

    // Map rating IDs to numeric values
    let minRating: number | undefined;
    if (ratingsValue.length > 0) {
      const ratingMap: Record<string, number> = {
        "top-rated": 4.5,
        reliable: 4.0,
        "good-service": 3.5,
        all: 0,
      };
      minRating = Math.max(...ratingsValue.map((id) => ratingMap[id] || 0));
    }

    onFilterChange?.({
      search: searchValue || undefined,
      minPrice: !isGlobal && priceValue.min > 0 ? priceValue.min : undefined,
      maxPrice:
        !isGlobal && priceValue.max < 50000 ? priceValue.max : undefined,
      minRating,
      sortBy: sortValue,
    });
  };

  const handlePriceRangeApply = (range: { min: number; max: number }) => {
    setPriceRange(range);
    triggerFilterChange(undefined, range);
  };

  const handleRatingApply = (ratings: string[]) => {
    setRatingIds(ratings);
    triggerFilterChange(undefined, undefined, ratings);
  };

  const handleSortByChange = (sort: string) => {
    setSortBy(sort);
    triggerFilterChange(undefined, undefined, undefined, sort);
  };

  const handleSearch = () => {
    triggerFilterChange(searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar with Integrated Button */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t("serviceSearchPrompt")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-12 pr-28 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="absolute right-0 top-0 bottom-0 px-6 bg-brand-900 hover:bg-brand-700 text-white font-medium rounded-r-lg transition-colors"
        >
          {common("search")}
        </button>
      </div>

      {/* Results Header with Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2 text-sm sm:text-base">
          <span className="text-gray-700 font-medium">
            {t("showingResultsFor")}
          </span>
          <span className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
            &apos;{categoryName}&apos;
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded-md font-medium shrink-0">
            {format.number(resultCount)}
          </span>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">{t("sortBy")}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                <span className="font-medium text-gray-900">
                  {sortOptions.find((opt) => opt.value === sortBy)?.label ||
                    t("bestMatch")}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortByChange(option.value)}
                  className="cursor-pointer"
                >
                  <span
                    className={
                      sortBy === option.value
                        ? "font-medium text-brand-900"
                        : ""
                    }
                  >
                    {option.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Horizontal Line Separator */}
      <HorizontalSeparator />

      {/* Filters Row */}
      <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        {/* Filters Label */}
        <div className="flex items-center gap-2 sm:shrink-0">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-5 h-5" />
            <span>{t("filters")}</span>
          </div>
        </div>

        {/* Commented out - Skill Filter */}
        {/* <SkillDropdown
          selectedSkills={selectedSkillIds}
          onApply={handleSkillsApply}
          trigger={
            <button className="flex items-center gap-3 px-5 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white min-w-[160px] justify-between">
              <span className="text-gray-700 text-sm">
                {selectedSkillIds.length > 0 ? "Add more skills" : "Skill"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          }
        /> */}

        {/* Price Range Filter */}
        {!isGlobal && (
          <PriceRangeDropdown
            selectedRange={priceRange}
            onApply={handlePriceRangeApply}
            trigger={
              <button
                type="button"
                className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto sm:min-w-[180px] sm:px-5"
              >
                <span className="min-w-0 truncate text-sm text-gray-700">
                  {getPriceRangeDisplay()}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            }
          />
        )}

        {/* Rating Filter */}
        <RatingDropdown
          selectedRatings={ratingIds}
          onApply={handleRatingApply}
          trigger={
            <button
              type="button"
              className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto sm:min-w-[160px] sm:px-5"
            >
              <span className="min-w-0 truncate text-sm text-gray-700">
                {getRatingDisplay()}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          }
        />

        {/* Commented out - Delivery Time Filter */}
        {/* <DeliveryTimeDropdown
          selectedDeliveryTime={deliveryTime}
          onApply={handleDeliveryTimeApply}
          trigger={
            <button className="flex items-center gap-3 px-5 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white min-w-[180px] justify-between">
              <span className="text-gray-700 text-sm">
                {getDeliveryTimeDisplay()}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          }
        /> */}

        {/* Clear All Link */}
        {(searchQuery ||
          priceRange.min !== 0 ||
          priceRange.max !== 50000 ||
          ratingIds.length > 0) && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="min-h-11 justify-self-start px-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:ml-auto"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
