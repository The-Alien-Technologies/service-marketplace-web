"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { CategoryCard, CategoryCardData } from "../cards/category-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface CategoryCarouselProps {
  categories: CategoryCardData[];
  title: string;
  subtitle?: string;
  onCategoryClick?: (category: CategoryCardData) => void;
}

export function CategoryCarousel({
  categories,
  title,
  subtitle,
  onCategoryClick,
}: CategoryCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="!pb-12"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id} className="h-auto">
                <CategoryCard
                  category={category}
                  onClick={() => onCategoryClick?.(category)}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="hidden sm:flex absolute left-0 top-[40%] -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="hidden sm:flex absolute right-0 top-[40%] -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
