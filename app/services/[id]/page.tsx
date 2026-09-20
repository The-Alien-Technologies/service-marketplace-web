"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ServiceDetailHeader } from "@/components/sections/service-detail/service-detail-header";
import { ServiceHero } from "@/components/sections/service-detail/service-hero";
import { ServiceOverview } from "@/components/sections/service-detail/service-overview";
import { ServiceCatalogue } from "@/components/sections/service-detail/service-catalogue";
import { ReviewSummary } from "@/components/sections/service-detail/review-summary";
import { RecentReviews } from "@/components/sections/service-detail/recent-reviews";
import { ServiceProviderBadge } from "@/components/sections/service-detail/service-provider-badge";
import { PricingPlans } from "@/components/sections/service-detail/pricing-plans";
import { CategoryCarousel } from "@/components/sections/carousels/category-carousel";
import { AppDownloadSection } from "@/components/sections/home/app-download-section";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";
import {
  Review as ReviewType,
  ReviewSummary as ReviewSummaryType,
} from "@/types/order";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategories } from "@/store/categories-store";

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const { id: serviceId } = use(params);
  const { featuredCategories, topLevelCategories } = useCategories();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<{
    summary: ReviewSummaryType;
    reviews: ReviewType[];
  }>({
    summary: {
      average: 0,
      total: 0,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    reviews: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [data, reviews] = await Promise.all([
          apiService.getService(serviceId),
          apiService.getServiceReviews(serviceId, { limit: 20 }),
        ]);
        setService(data);
        setReviewData({ summary: reviews.summary, reviews: reviews.data });
      } catch (error) {
        console.error("Failed to fetch service:", error);
        toast.error(t("serviceLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchData();
    }
  }, [serviceId, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("serviceNotFound")}
          </h2>
          <p className="text-gray-500 mt-2">{t("serviceNotFoundBody")}</p>
        </div>
      </div>
    );
  }

  // Transform backend data to frontend format
  const serviceData = {
    title: service.title,
    category: service.category?.name || t("uncategorized"),
    categorySlug: service.category?.id || "",
    providerName:
      service.provider?.displayName ||
      `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
      common("provider"),
    heroImage: service.coverImage || "/assets/temp/products/p1.jpg",
    overviewDescription: service.overview,
    catalogueItems:
      service.images?.map((img) => ({
        id: img.id,
        imageUrl: img.url,
        span: "normal" as const, // Default to normal span
      })) || [],
    reviews: {
      averageRating: reviewData.summary.average,
      totalReviews: reviewData.summary.total,
      ratingBreakdown: [5, 4, 3, 2, 1].map((star) => {
        const count = reviewData.summary.breakdown[star] || 0;
        const pct =
          reviewData.summary.total > 0
            ? (count / reviewData.summary.total) * 100
            : 0;
        return { rating: star, count, percentage: Math.round(pct) };
      }),
    },
    recentReviews: reviewData.reviews.map((r) => ({
      id: r.id,
      reviewerName:
        r.client?.displayName ||
        `${r.client?.firstName ?? ""} ${r.client?.lastName ?? ""}`.trim() ||
        t("anonymous"),
      reviewerAvatar:
        r.client?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      rating: r.rating,
      date: r.createdAt,
      reviewText: r.comment ?? "",
      likes: 0,
      dislikes: 0,
      response: r.response
        ? { comment: r.response.comment, createdAt: r.response.createdAt }
        : null,
    })),
    provider: {
      name:
        service.provider?.displayName ||
        `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
        common("provider"),
      avatar: service.provider?.avatar || "/assets/temp/user/u1.jpg",
      title: t("serviceProviderTitle"), // TODO: Add title to provider profile
      location: service.market?.name || service.currency,
      rating: reviewData.summary.average,
      isPro: false, // TODO: Implement pro status
    },
    pricingPlans:
      service.plans?.map((plan) => ({
        id: plan.id || "",
        name: plan.title,
        icon: "layers" as const, // Default icon
        price: Number(plan.price),
        features: plan.inclusions.split("\n").map((text) => ({ text })),
        isPopular: plan.isPopular || false,
      })) || [],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Top Section with Search and Breadcrumbs */}
      <ServiceDetailHeader
        categoryName={serviceData.category}
        categorySlug={serviceData.categorySlug}
        serviceTitle={serviceData.title}
      />

      {/* Service Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {serviceData.title}
        </h1>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Image */}
            <ServiceHero
              imageUrl={serviceData.heroImage}
              alt={`${serviceData.providerName} - ${serviceData.category}`}
            />

            {/* Overview Section */}
            <ServiceOverview description={serviceData.overviewDescription} />

            {/* My Catalogue Section */}
            <ServiceCatalogue items={serviceData.catalogueItems} />

            {/* Reviews Summary Section */}
            <ReviewSummary
              averageRating={serviceData.reviews.averageRating}
              totalReviews={serviceData.reviews.totalReviews}
              ratingBreakdown={serviceData.reviews.ratingBreakdown}
            />

            {/* Recent Reviews Section */}
            <RecentReviews reviews={serviceData.recentReviews} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Provider Badge */}
            <ServiceProviderBadge
              providerName={serviceData.provider.name}
              providerAvatar={serviceData.provider.avatar}
              providerTitle={serviceData.provider.title}
              location={serviceData.provider.location}
              rating={serviceData.provider.rating}
              isPro={serviceData.provider.isPro}
              isOnline={false}
            />

            {/* Pricing Plans */}
            <PricingPlans
              plans={serviceData.pricingPlans}
              providerName={serviceData.provider.name}
              providerAvatar={serviceData.provider.avatar}
              service={service}
              serviceId={serviceId}
              currency={service.currency}
              locale={service.market?.locale}
            />
          </div>
        </div>
      </div>

      {(featuredCategories.length > 0 || topLevelCategories.length > 0) && (
        <CategoryCarousel
          categories={(featuredCategories.length > 0
            ? featuredCategories
            : topLevelCategories
          ).map((category) => ({
            id: category.id,
            name: category.name,
            image: category.imageUrl || "/assets/temp/products/p1.jpg",
          }))}
          title={t("popularService")}
          onCategoryClick={(category) => {
            globalThis.location.href = `/categories/${category.id}`;
          }}
        />
      )}

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
