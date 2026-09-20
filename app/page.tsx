"use client";

import { HomeHeader } from "@/components/layout/home-header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { ServiceCarousel } from "@/components/sections/carousels/service-carousel";
import { CategoryCarousel } from "@/components/sections/carousels/category-carousel";
import { MomentsSection } from "@/components/sections/home/moments-section";
import { HowItWorksSection } from "@/components/sections/home/how-it-works-section";
import { AppDownloadSection } from "@/components/sections/home/app-download-section";
import { useCategories } from "@/store/categories-store";
import { CategoryCardData } from "@/components/sections/cards/category-card";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";
import { ServiceCardData } from "@/components/sections/cards/service-card";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import { useMarketStore } from "@/store/market-store";

export default function Home() {
  const t = useTranslations("Home");
  const marketplace = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const selectedMarketCode = useMarketStore((state) => state.selectedCode);
  const router = useRouter();
  const { featuredCategories, topLevelCategories, isLoading } = useCategories();

  // State for services
  const [bestsellers, setBestsellers] = useState<ServiceCardData[]>([]);
  const [mostViewed, setMostViewed] = useState<ServiceCardData[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Transform Service to ServiceCardData
  const transformServiceToCard = useCallback(
    (service: Service): ServiceCardData => {
      const minPrice =
        service.plans && service.plans.length > 0
          ? Math.min(...service.plans.map((p) => Number(p.price)))
          : 0;

      const providerName =
        service.provider?.displayName ||
        `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
        common("provider");

      return {
        id: service.id,
        providerName: providerName,
        providerAvatar:
          service.provider?.avatar || "/assets/temp/user/u1.jpg",
        isPro: false,
        isOnline: false,
        serviceImage: service.coverImage || "/assets/temp/products/p1.jpg",
        description: service.title,
        price: marketplace("from", {
          price: formatMoney(minPrice, service.currency, service.market?.locale),
        }),
        rating: service.averageRating ?? 0,
      };
    },
    [common, marketplace],
  );

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);

        // Fetch published services sorted by creation date
        const [popularResponse, recentResponse] = await Promise.all([
          apiService.getServices({
            status: "PUBLISHED",
            limit: 10,
            market: selectedMarketCode,
            sortBy: "popular",
          }),
          apiService.getServices({
            status: "PUBLISHED",
            limit: 10,
            market: selectedMarketCode,
            sortBy: "recent",
          }),
        ]);

        setBestsellers(popularResponse.services.map(transformServiceToCard));
        setMostViewed(recentResponse.services.map(transformServiceToCard));
      } catch (error) {
        console.error("Failed to fetch services:", error);
        // Keep empty arrays on error
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedMarketCode, transformServiceToCard]);

  // Transform API categories to CategoryCardData format
  const categoryCardData: CategoryCardData[] = useMemo(() => {
    // Use featured categories if available, otherwise use top-level
    const categoriesToShow =
      featuredCategories.length > 0 ? featuredCategories : topLevelCategories;

    return categoriesToShow.map((cat) => ({
      id: cat.id,
      name: cat.name,
      image: cat.imageUrl || "/assets/temp/products/p1.jpg", // Fallback image
    }));
  }, [featuredCategories, topLevelCategories]);

  const handleCategoryClick = (category: CategoryCardData) => {
    router.push(`/categories/${category.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HomeHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Bestsellers Section */}
      <div id="browse-services" className="scroll-mt-20">
        {!isLoadingServices && bestsellers.length > 0 && (
          <ServiceCarousel
            services={bestsellers}
            title={t("bestsellers")}
            showAllLink={{
              text: t("seeBestsellers"),
              onClick: () => router.push("/services"),
            }}
            onServiceClick={(service) => router.push(`/services/${service.id}`)}
          />
        )}
      </div>

      {/* Moments Captured Section */}
      <MomentsSection />

      {/* Most Viewed Section */}
      {!isLoadingServices && mostViewed.length > 0 && (
        <ServiceCarousel
          services={mostViewed}
          title={t("recentlyAdded")}
          showAllLink={{
              text: t("seeRecentlyAdded"),
            onClick: () => router.push("/services"),
          }}
          onServiceClick={(service) => router.push(`/services/${service.id}`)}
        />
      )}

      {/* How it Works Section */}
      <HowItWorksSection />

      {/* Popular Service Categories Carousel */}
      {!isLoading && categoryCardData.length > 0 && (
        <div id="browse-categories" className="scroll-mt-20">
          <CategoryCarousel
            categories={categoryCardData}
            title={t("popularService")}
            onCategoryClick={handleCategoryClick}
          />
        </div>
      )}

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
