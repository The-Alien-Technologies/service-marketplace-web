"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ServiceCardData } from "@/components/sections/cards/service-card";
import { CategoryResultsGrid } from "@/components/sections/category/category-results-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { apiService } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useMarketStore } from "@/store/market-store";
import { Service } from "@/types/service";

const PAGE_SIZE = 12;

export default function ServicesBrowsePage() {
  const t = useTranslations("ServiceBrowse");
  const common = useTranslations("Common");
  const marketplace = useTranslations("Marketplace");
  const searchParams = useSearchParams();
  const market = useMarketStore((state) => state.selectedCode);
  const initialSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const toCard = useCallback(
    (service: Service): ServiceCardData => {
      const price = service.plans?.length
        ? Math.min(...service.plans.map((plan) => Number(plan.price)))
        : 0;
      const providerName =
        service.provider?.displayName ||
        `${service.provider?.firstName ?? ""} ${service.provider?.lastName ?? ""}`.trim() ||
        common("provider");

      return {
        id: service.id,
        providerName,
        providerAvatar: service.provider?.avatar || "/assets/temp/user/u1.jpg",
        isPro: false,
        isOnline: false,
        serviceImage: service.coverImage || "/assets/temp/products/p1.jpg",
        description: service.title,
        price: marketplace("from", {
          price: formatMoney(price, service.currency, service.market?.locale),
        }),
        rating: service.averageRating ?? 0,
      };
    },
    [common, marketplace],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const response = await apiService.getServices({
          status: "PUBLISHED",
          page,
          limit: PAGE_SIZE,
          market,
          search: appliedSearch || undefined,
          sortBy,
        });
        if (!active) return;
        setServices(response.services.map(toCard));
        setTotalPages(Math.max(response.totalPages, 1));
      } catch {
        if (active) {
          setServices([]);
          setError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [appliedSearch, market, page, sortBy, toCard]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="pb-16">
        <section className="border-b border-gray-200 bg-white py-10 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">
              {t("subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={submitSearch} className="flex w-full max-w-2xl gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchPlaceholder")}
                    className="h-11 bg-white pl-10 dark:bg-gray-700"
                  />
                </div>
                <Button type="submit" className="h-11 bg-green-700 hover:bg-green-800">
                  {common("search")}
                </Button>
              </form>
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as "recent" | "popular");
                  setPage(1);
                }}
                aria-label={marketplace("sortBy")}
                className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="recent">{t("sortRecent")}</option>
                <option value="popular">{t("sortPopular")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="pt-10" aria-live="polite">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-700" />
              <span className="sr-only">{common("loading")}</span>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-xl px-4 py-16 text-center">
              <p className="text-gray-600 dark:text-gray-300">{t("loadFailed")}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="mx-auto max-w-xl px-4 py-16 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("noResults")}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{t("noResultsBody")}</p>
            </div>
          ) : (
            <>
              <CategoryResultsGrid services={services} />
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => {
                    setPage(nextPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
