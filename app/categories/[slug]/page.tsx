"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryFilters } from "@/components/sections/category/category-filters";
import { CategoryResultsGrid } from "@/components/sections/category/category-results-grid";
import { Pagination } from "@/components/ui/pagination";
import { HorizontalSeparator } from "@/components/layout/horizontal-separator";
import { ServiceCarousel } from "@/components/sections/carousels/service-carousel";
import { AppDownloadSection } from "@/components/sections/home/app-download-section";

import { apiService } from "@/lib/api";
import { Service } from "@/types/service";

const ITEMS_PER_PAGE = 12;

import { Category } from "@/types/auth"; // Assuming Category type is exported from auth types based on api.ts
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import { useMarketStore } from "@/store/market-store";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const selectedMarketCode = useMarketStore((state) => state.selectedCode);
  const markets = useMarketStore((state) => state.markets);
  const [currentPage, setCurrentPage] = useState(1);
  const { slug } = use(params);

  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [latestServices, setLatestServices] = useState<Service[]>([]); // State for "You may also like"
  const [filters, setFilters] = useState({
    search: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minRating: undefined as number | undefined,
    sortBy: "best_match",
  });

  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  useEffect(() => {
    if (selectedMarketCode !== "GLOBAL") return;
    setFilters((current) => ({
      ...current,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: current.sortBy.startsWith("price_")
        ? "best_match"
        : current.sortBy,
    }));
    setCurrentPage(1);
  }, [selectedMarketCode]);

  // Fetch category details - only runs when slug changes
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsCategoryLoading(true);
        const categoryData = await apiService.getCategoryById(slug);
        setCategory(categoryData);
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        toast.error(t("categoryLoadFailed"));
      } finally {
        setIsCategoryLoading(false);
      }
    };

    if (slug) {
      fetchCategory();
    }
  }, [slug, t]);

  // Fetch services - runs when filters/page change
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsServicesLoading(true);
        const servicesData = await apiService.getFilteredCategoryServices(
          slug,
          {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            ...filters,
            market: selectedMarketCode,
          },
        );

        setServices(servicesData.services);
        setTotalServices(servicesData.total);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error(t("servicesLoadFailed"));
      } finally {
        setIsServicesLoading(false);
      }
    };

    if (slug) {
      fetchServices();
    }
  }, [slug, currentPage, filters, selectedMarketCode, t]);

  // Fetch latest services - only once
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latestData = await apiService.getServices({
          limit: 10,
          status: "PUBLISHED",
          market: selectedMarketCode,
        });
        setLatestServices(latestData.services);
      } catch (error) {
        console.error("Failed to fetch latest services:", error);
      }
    };

    fetchLatest();
  }, [selectedMarketCode]);

  const totalPages = Math.ceil(totalServices / ITEMS_PER_PAGE);
  const selectedMarket = markets.find(
    (market) => market.code === selectedMarketCode,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (newFilters: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Format the category name for display if category text is missing (fallback)
  const displayCategoryName =
    category?.name ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Page Content */}
      <main className="">
        {/* Filters Section */}
        <CategoryFilters
          key={selectedMarketCode}
          categoryName={displayCategoryName}
          resultCount={totalServices}
          currency={selectedMarket?.currency}
          isGlobal={selectedMarketCode === "GLOBAL"}
          onFilterChange={handleFilterChange}
        />

        {/* Results Grid */}
        <div className="mt-8 min-h-[400px]">
          {isServicesLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : services.length > 0 ? (
            <CategoryResultsGrid
              services={services.map((service) => ({
                id: service.id,
                providerName:
                  service.provider?.displayName ||
                  `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
                  common("provider"),
                providerAvatar:
                  service.provider?.avatar || "/assets/temp/user/u1.jpg",
                isPro: false, // TODO: Add to API
                serviceImage:
                  service.coverImage || "/assets/temp/products/p1.jpg",
                description: service.title,
                price: service.plans?.[0]?.price
                  ? t("from", {
                      price: formatMoney(
                        service.plans[0].price,
                        service.currency,
                        service.market?.locale,
                      ),
                    })
                  : t("priceOnRequest"),
                rating: service.averageRating ?? 0,
                isOnline: false,
              }))}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t("noServicesCategory")}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <HorizontalSeparator />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* You may also like Section - Showing Latest Services */}
        {latestServices.length > 0 && (
          <ServiceCarousel
            services={latestServices.map((service) => ({
              id: service.id,
              providerName:
                service.provider?.displayName ||
                `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
                common("provider"),
              providerAvatar: service.provider?.avatar ?? "",
              isPro: false,
              serviceImage: service.coverImage ?? "",
              description: service.title,
              price: service.plans?.[0]?.price
                ? t("from", {
                    price: formatMoney(
                      service.plans[0].price,
                      service.currency,
                      service.market?.locale,
                    ),
                  })
                : t("priceOnRequest"),
              rating: service.averageRating ?? 0,
              isOnline: false,
            }))}
            title={t("youMayLike")}
            showAllLink={{
              text: t("showAll"),
              onClick: () => (globalThis.location.href = "/services"),
            }}
            onServiceClick={(service) =>
              (globalThis.location.href = `/services/${service.id}`)
            }
          />
        )}

        {/* App Download Section */}
        <AppDownloadSection />

      </main>

      <Footer />
    </div>
  );
}
