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
import { GetInspiredSection } from "@/components/sections/home/get-inspired-section";
import { mockInspirations } from "@/lib/mock-inspirations";
import { mockBestsellers } from "@/lib/mock-bestsellers";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";

const ITEMS_PER_PAGE = 12;

import { Category } from "@/types/auth"; // Assuming Category type is exported from auth types based on api.ts
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const { slug } = use(params);

  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [latestServices, setLatestServices] = useState<Service[]>([]); // State for "You may also like"
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch category details
        const categoryData = await apiService.getCategoryById(slug);
        setCategory(categoryData);

        // Fetch services for this category
        const servicesData = await apiService.getServices({
          categoryId: slug,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: "PUBLISHED",
        });

        setServices(servicesData.services);
        setTotalServices(servicesData.total);

        // Fetch latest services for "You may also like"
        const latestData = await apiService.getServices({
          limit: 10,
          status: "PUBLISHED",
          // Assumes backend sorts by createdAt desc by default or we might need to add sorting later if API supports it
        });
        setLatestServices(latestData.services);
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        toast.error("Failed to load category details");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, currentPage]);

  const totalPages = Math.ceil(totalServices / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
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
          categoryName={displayCategoryName}
          resultCount={totalServices}
        />

        {/* Results Grid */}
        <div className="mt-8">
          {services.length > 0 ? (
            <CategoryResultsGrid
              services={services.map((service) => ({
                id: service.id,
                providerName:
                  service.provider?.displayName ||
                  `${service.provider?.firstName || ""} ${service.provider?.lastName || ""}`.trim() ||
                  "Provider",
                providerAvatar:
                  service.provider?.avatar || "/assets/temp/user/u1.jpg",
                isPro: false, // TODO: Add to API
                serviceImage:
                  service.coverImage || "/assets/temp/products/p1.jpg",
                description: service.title,
                price: service.plans?.[0]?.price
                  ? `From GHS ${service.plans[0].price}`
                  : "Price on request",
                rating: 0, // TODO: Add to API
                isOnline: true, // TODO: Add to API
              }))}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No services found in this category.
              </p>
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
                "Provider",
              providerAvatar:
                service.provider?.avatar ?? "",
              isPro: false,
              serviceImage:
                service.coverImage ?? "",
              description: service.title,
              price: service.plans?.[0]?.price
                ? `From GHS ${service.plans[0].price}`
                : "Price on request",
              rating: 0,
              isOnline: true,
            }))}
            title="You may also like"
            showAllLink={{
              text: "Show all",
              onClick: () => console.log("Show all services"),
            }}
            onServiceClick={(service) =>
              (globalThis.location.href = `/services/${service.id}`)
            }
          />
        )}

        {/* App Download Section */}
        <AppDownloadSection />

        {/* Get Inspired Section */}
        <GetInspiredSection inspirations={mockInspirations} />
      </main>

      <Footer />
    </div>
  );
}
