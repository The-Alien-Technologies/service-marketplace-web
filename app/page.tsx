"use client";

import { HomeHeader } from "@/components/layout/home-header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { ServiceCarousel } from "@/components/sections/carousels/service-carousel";
import { CategoryCarousel } from "@/components/sections/carousels/category-carousel";
import { MomentsSection } from "@/components/sections/home/moments-section";
import { HowItWorksSection } from "@/components/sections/home/how-it-works-section";
import { GetInspiredSection } from "@/components/sections/home/get-inspired-section";
import { AppDownloadSection } from "@/components/sections/home/app-download-section";
import { useAuthStore } from "@/store/auth-store";
import { useCategories } from "@/store/categories-store";
import { CategoryCardData } from "@/components/sections/cards/category-card";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";
import { ServiceCardData } from "@/components/sections/cards/service-card";

export default function Home() {
  const { showAuth } = useAuthStore();
  const router = useRouter();
  const { featuredCategories, topLevelCategories, isLoading } = useCategories();

  // State for services
  const [bestsellers, setBestsellers] = useState<ServiceCardData[]>([]);
  const [mostViewed, setMostViewed] = useState<ServiceCardData[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Transform Service to ServiceCardData
  const transformServiceToCard = (service: Service): ServiceCardData => {
    const minPrice =
      service.plans && service.plans.length > 0
        ? Math.min(...service.plans.map((p) => Number(p.price)))
        : 0;

    const providerName =
      service.provider?.displayName ||
      `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
      "Provider";

    return {
      id: service.id,
      providerName: providerName,
      providerAvatar: service.provider?.avatar || "/assets/temp/user/u1.jpg",
      isPro: false, // TODO: Add pro status later
      isOnline: false, // TODO: Add online status later
      serviceImage: service.coverImage || "/assets/temp/products/p1.jpg",
      description: service.title,
      price: `From ${minPrice} $`,
      rating: 0, // TODO: Add rating system later
    };
  };

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);

        // Fetch published services sorted by creation date
        const response = await apiService.getServices({
          status: "PUBLISHED",
          limit: 10,
        });

        const transformedServices = response.services.map(
          transformServiceToCard,
        );

        // Use same data for both sections for now
        setBestsellers(transformedServices);
        setMostViewed(transformedServices);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        // Keep empty arrays on error
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

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
      {!isLoadingServices && bestsellers.length > 0 && (
        <ServiceCarousel
          services={bestsellers}
          title="Bestsellers"
          showAllLink={{
            text: "See all best sellers",
            onClick: () => router.push("/services"),
          }}
          onServiceClick={(service) => router.push(`/services/${service.id}`)}
        />
      )}

      {/* Moments Captured Section */}
      <MomentsSection />

      {/* Most Viewed Section */}
      {!isLoadingServices && mostViewed.length > 0 && (
        <ServiceCarousel
          services={mostViewed}
          title="Most Viewed"
          showAllLink={{
            text: "See all most viewed",
            onClick: () => router.push("/services"),
          }}
          onServiceClick={(service) => router.push(`/services/${service.id}`)}
        />
      )}

      {/* How it Works Section */}
      <HowItWorksSection />

      {/* Popular Service Categories Carousel */}
      {!isLoading && categoryCardData.length > 0 && (
        <CategoryCarousel
          categories={categoryCardData}
          title="Popular Service"
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Get Inspired Section */}
      {/* TODO: Integrate with real service portfolio images */}
      {/* <GetInspiredSection inspirations={mockInspirations} /> */}

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
