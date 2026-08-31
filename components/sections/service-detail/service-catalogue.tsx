"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface CatalogueItem {
  id: string;
  imageUrl: string;
  title?: string;
  span?: "large" | "normal"; // For different sized items
}

interface ServiceCatalogueProps {
  items: CatalogueItem[];
  maxVisible?: number;
}

export function ServiceCatalogue({
  items,
  maxVisible = 5,
}: ServiceCatalogueProps) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const format = useFormatter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [showAllItems, setShowAllItems] = useState(false);

  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
    setShowAllItems(false);
  };

  const handleShowMore = () => {
    setIsModalOpen(true);
    setShowAllItems(true);
    setSelectedImageIndex(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
    setShowAllItems(false);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImageIndex === null) return;

    if (direction === "next") {
      setSelectedImageIndex((selectedImageIndex + 1) % items.length);
    } else {
      setSelectedImageIndex(
        selectedImageIndex === 0 ? items.length - 1 : selectedImageIndex - 1
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("catalogue")}
      </h2>

      {/* Masonry Grid */}
      <div className="grid grid-cols-2 gap-4">
        {visibleItems.map((item, index) => {
          const isLast =
            index === visibleItems.length - 1 && remainingCount > 0;
          const isLarge = item.span === "large";

          return (
            <div
              key={item.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                isLarge ? "col-span-2" : "col-span-1"
              } ${index === 0 ? "row-span-1" : ""}`}
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                <Image
                  src={item.imageUrl}
                  alt={item.title || t("portfolioItem")}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Expand Icon - Top Right */}
                <button
                  onClick={() => handleImageClick(index)}
                  aria-label={common("view")}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700 z-10"
                >
                  <Maximize2 className="w-4 h-4 text-gray-900 dark:text-white" />
                </button>

                {/* Title Overlay - Bottom */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      {item.title}
                    </p>
                  </div>
                )}

                {/* "+X more" Overlay */}
                {isLast && (
                  <button
                    onClick={handleShowMore}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <span className="text-white text-2xl font-semibold">
                      {t("moreCount", { count: remainingCount })}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            aria-label={common("close")}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {showAllItems ? (
              /* All Items Grid View */
              <div className="max-w-7xl w-full max-h-full overflow-y-auto bg-gray-900 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {t("allPortfolioItems", { count: items.length })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleImageClick(index)}
                      className="relative aspect-video rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.title || t("portfolioItem")}
                        fill
                        className="object-cover"
                      />
                      {item.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">
                            {item.title}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedImageIndex !== null ? (
              /* Single Image View */
              <div className="relative max-w-6xl w-full">
                {/* Navigation Buttons */}
                {items.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage("prev")}
                      aria-label={common("previous")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <span className="text-white text-2xl">‹</span>
                    </button>
                    <button
                      onClick={() => navigateImage("next")}
                      aria-label={common("next")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <span className="text-white text-2xl">›</span>
                    </button>
                  </>
                )}

                {/* Image */}
                <div className="relative w-full aspect-video">
                  <Image
                    src={items[selectedImageIndex].imageUrl}
                    alt={items[selectedImageIndex].title || t("portfolioItem")}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Image Info */}
                {items[selectedImageIndex].title && (
                  <div className="mt-4 text-center">
                    <p className="text-white text-lg font-medium">
                      {items[selectedImageIndex].title}
                    </p>
                  </div>
                )}

                {/* Counter */}
                <div className="mt-2 text-center">
                  <p className="text-white/60 text-sm">
                    {format.number(selectedImageIndex + 1)} / {format.number(items.length)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
