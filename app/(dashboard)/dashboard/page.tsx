"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Briefcase,
  ShoppingBag,
  CreditCard,
  ChevronDown,
  ArrowRight,
  Info,
  Star,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import Image from "next/image";
import { apiService } from "@/lib/api";
import {
  ProviderAnalytics,
  AdminAnalytics,
  AnalyticsTrend,
  UserAnalytics,
} from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  Completed: "var(--success)",
  Pending: "var(--warning)",
  Awaiting: "var(--warning)",
  "In-progress": "var(--info)",
  "In progress": "var(--info)",
  Declined: "var(--destructive)",
  Refunded: "var(--refund)",
  Expired: "var(--muted-foreground)",
};

const numberFormatter = new Intl.NumberFormat("en-GH");
const compactNumberFormatter = new Intl.NumberFormat("en-GH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCurrency(value: number, currency = "GHS") {
  return `${currency} ${new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}

function resolveCategoryImageUrl(value: string) {
  if (!value.startsWith("/")) return value;

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    return new URL(value, new URL(apiUrl).origin).toString();
  } catch {
    return value;
  }
}

function describeTrend(value: AnalyticsTrend) {
  if (value.changePercent === null) {
    return {
      value: "New",
      label: "this month",
      className: "text-green-700 dark:text-green-300",
    };
  }

  const change = value.changePercent;
  return {
    value: `${change > 0 ? "+" : ""}${change.toLocaleString("en-GH", {
      maximumFractionDigits: 1,
    })}%`,
    label: "vs last month",
    className:
      change > 0
        ? "text-green-700 dark:text-green-300"
        : change < 0
          ? "text-red-700 dark:text-red-300"
          : "text-muted-foreground",
  };
}

// --- Admin Dashboard ---

function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getUTCFullYear(),
  );
  const [selectedCategoryMonth, setSelectedCategoryMonth] =
    useState(currentMonthKey);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      setRefreshing(true);
      try {
        const analytics = await apiService.getAdminAnalytics({
          year: selectedYear,
          categoryMonth: selectedCategoryMonth,
        });
        if (!cancelled) setData(analytics);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "The dashboard data could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [retryKey, selectedCategoryMonth, selectedYear]);

  if (loading && !data) {
    return (
      <div
        className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-gray-600"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        <p className="text-sm font-medium">Loading live dashboard data…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="mx-auto mt-16 max-w-xl rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        role="alert"
      >
        <AlertCircle className="mx-auto h-7 w-7 text-red-700" />
        <h1 className="mt-4 text-lg font-bold text-red-950">
          Dashboard data is unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-red-800">
          {loadError ?? "The analytics API did not return dashboard data."}
        </p>
        <Button
          variant="outline"
          className="mt-5 border-red-300 bg-white text-red-900 hover:bg-red-100"
          onClick={() => setRetryKey((value) => value + 1)}
        >
          Try again
        </Button>
      </div>
    );
  }

  const {
    stats,
    trends,
    orderStatusBreakdown = [],
    topCategories = [],
    revenueChart = [],
    totalOrders = 0,
  } = data;
  const chartHasData = revenueChart.some(
    (item) => item.revenue || item.commission || item.payout,
  );
  const donutData = totalOrders
    ? orderStatusBreakdown
    : [{ name: "No orders", value: 1 }];
  const staleFilterSnapshot =
    data.selectedYear !== selectedYear ||
    data.categoryMonth !== selectedCategoryMonth;

  const statCards = [
    {
      label: "Total Users",
      value: numberFormatter.format(stats.totalUsers),
      trend: describeTrend(trends.totalUsers),
      trendDetail: `${numberFormatter.format(trends.totalUsers.current)} registrations this month; ${numberFormatter.format(trends.totalUsers.previous)} last month`,
      icon: Users,
      color: "text-orange-600",
      barColor: "bg-orange-600",
    },
    {
      label: "Active Providers",
      value: numberFormatter.format(stats.activeProviders),
      trend: describeTrend(trends.activeProviders),
      trendDetail: `${numberFormatter.format(trends.activeProviders.current)} new active providers this month; ${numberFormatter.format(trends.activeProviders.previous)} last month`,
      icon: Briefcase,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Active Orders",
      value: numberFormatter.format(stats.activeOrders),
      trend: describeTrend(trends.activeOrders),
      trendDetail: `${numberFormatter.format(trends.activeOrders.current)} active orders opened this month; ${numberFormatter.format(trends.activeOrders.previous)} last month`,
      icon: ShoppingBag,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue, data.currency),
      trend: describeTrend(trends.revenue),
      trendDetail: `${formatCurrency(trends.revenue.current, data.currency)} retained this month; ${formatCurrency(trends.revenue.previous, data.currency)} last month`,
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
  ];

  return (
    <div
      className="space-y-8 pb-12 dark:[&_.bg-white]:bg-gray-900 dark:[&_.border-gray-100]:border-gray-800 dark:[&_.text-gray-900]:text-gray-100 dark:[&_.text-gray-700]:text-gray-300 dark:[&_.text-gray-600]:text-gray-300 dark:[&_.text-gray-500]:text-gray-400"
      aria-busy={refreshing}
    >
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Monitor live platform performance and take quick actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-gray-500 md:block">
            Updated {new Date(data.generatedAt).toLocaleString("en-GH")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 bg-white"
            onClick={() => setRetryKey((value) => value + 1)}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </header>

      {loadError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {staleFilterSnapshot
                ? `Could not load ${selectedYear} revenue and ${formatMonthKey(selectedCategoryMonth)} category activity. Showing the last successful snapshot for ${data.selectedYear} and ${formatMonthKey(data.categoryMonth)}.`
                : "The dashboard could not be refreshed. The last successful snapshot remains visible."}{" "}
              {loadError}
            </p>
          </div>
          <button
            className="shrink-0 self-start font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 sm:self-auto"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative"
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 ${stat.barColor}`}
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <span className="font-medium text-gray-900">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500" title={stat.trendDetail}>
                <span className={cn("font-medium", stat.trend.className)}>
                  {stat.trend.value}
                </span>{" "}
                {stat.trend.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (Left - 2/3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Revenue Overview
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedYear}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {data.availableYears.map((year) => (
                    <DropdownMenuItem
                      key={year}
                      onSelect={() => setSelectedYear(year)}
                    >
                      {year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">
                  {formatCurrency(data.revenueSummary.total, data.currency)}
                </span>{" "}
                in {data.selectedYear}
                {data.revenueSummary.bestMonth && (
                  <>
                    {" "}
                    · Best month: {data.revenueSummary.bestMonth.name} (
                    {formatCurrency(
                      data.revenueSummary.bestMonth.revenue,
                      data.currency,
                    )}
                    )
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-gray-600">Net revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="text-gray-600">Commissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-gray-600">Payouts</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative h-[350px] w-full"
            role="img"
            aria-label={`Monthly revenue, commission, and payout totals for ${data.selectedYear}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) =>
                    compactNumberFormatter.format(Number(value))
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0), data.currency),
                    name === "revenue"
                      ? "Net revenue"
                      : name === "commission"
                        ? "Commission"
                        : "Payout",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#60a5fa" // blue-400
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="revenue"
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#fb923c" // orange-400
                  strokeWidth={2}
                  dot={false}
                  name="commission"
                />
                <Line
                  type="monotone"
                  dataKey="payout"
                  stroke="#4ade80" // green-400
                  strokeWidth={2}
                  dot={false}
                  name="payout"
                />
              </LineChart>
            </ResponsiveContainer>
            {!chartHasData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-500 shadow-sm dark:bg-gray-900/90">
                  No financial activity recorded for {data.selectedYear}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Order Status Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Order status summary
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Track order completion and identify service delivery rate.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div
                className="relative h-[168px] w-[168px] shrink-0"
                role="img"
                aria-label={`Order status totals: ${orderStatusBreakdown
                  .map((item) => `${item.name} ${item.value}`)
                  .join(", ")}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={82}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {donutData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={
                            totalOrders
                              ? STATUS_COLORS[entry.name] || "#e5e7eb"
                              : "#e5e7eb"
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalOrders}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full flex-1 space-y-3 sm:pl-4 lg:pl-0 xl:pl-4">
                {orderStatusBreakdown.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.name] || "#e5e7eb",
                        }}
                      />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                className="flex items-center text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                onClick={() => router.push("/dashboard/orders")}
              >
                View detail report <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-card-foreground">
                  Top Categories
                </h3>
                <Info
                  className="h-4 w-4 text-gray-400"
                  aria-label="Ranked by services created during the selected month"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {formatMonthKey(selectedCategoryMonth)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {data.availableCategoryMonths.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onSelect={() => setSelectedCategoryMonth(month)}
                    >
                      {formatMonthKey(month)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 w-4">
                      {index + 1}.
                    </span>
                    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-xs font-bold text-green-800">
                      <span aria-hidden="true">
                        {cat.name.charAt(0).toUpperCase()}
                      </span>
                      {cat.imageUrl && (
                        <Image
                          src={resolveCategoryImageUrl(cat.imageUrl)}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                          loader={({ src }) => src}
                          unoptimized
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <span className="truncate text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-medium text-gray-900">
                    {numberFormatter.format(cat.count)}{" "}
                    {cat.count === 1 ? "service" : "services"}
                  </span>
                </div>
              ))}
              {topCategories.length === 0 && (
                <div className="rounded-lg bg-gray-50 px-4 py-8 text-center dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-700">
                    No services were added in{" "}
                    {formatMonthKey(data.categoryMonth)}.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose another month to review category activity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Provider Dashboard ---

function ProviderDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getUTCFullYear(),
  );
  const [selectedOrderMonth, setSelectedOrderMonth] = useState(currentMonthKey);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      setRefreshing(true);
      try {
        const analytics = await apiService.getProviderAnalytics({
          year: selectedYear,
          orderMonth: selectedOrderMonth,
        });
        if (!cancelled) setData(analytics);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "The dashboard data could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [retryKey, selectedOrderMonth, selectedYear]);

  if (loading && !data) {
    return (
      <div
        className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-green-700 motion-reduce:animate-none" />
        <p className="text-sm font-medium">Loading live provider data…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="mx-auto mt-16 max-w-xl rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900 dark:bg-red-950/40"
        role="alert"
      >
        <AlertCircle className="mx-auto h-7 w-7 text-red-700 dark:text-red-300" />
        <h1 className="mt-4 text-lg font-bold text-red-950 dark:text-red-100">
          Provider dashboard is unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-red-800 dark:text-red-200">
          {loadError ?? "The analytics API did not return dashboard data."}
        </p>
        <Button
          variant="outline"
          className="mt-5 min-h-11 border-red-300 bg-card text-red-900 hover:bg-red-100 dark:border-red-800 dark:text-red-100 dark:hover:bg-red-950"
          onClick={() => setRetryKey((value) => value + 1)}
        >
          Try again
        </Button>
      </div>
    );
  }

  const {
    stats,
    trends,
    orderSummary,
    recentOrders = [],
    earningsChart = [],
  } = data;
  const chartHasData = earningsChart.some(
    (item) => item.current || item.previous,
  );
  const staleYearSnapshot = data.selectedYear !== selectedYear;
  const staleOrderSnapshot = data.orderMonth !== selectedOrderMonth;
  const staleFilterSnapshot = staleYearSnapshot || staleOrderSnapshot;
  const orderTrend = describeTrend(orderSummary.trend);

  const providerStats = [
    {
      label: "Lifetime Earnings",
      value: formatCurrency(stats.earnings, data.currency),
      trend: describeTrend(trends.earnings),
      trendDetail: `${formatCurrency(trends.earnings.current, data.currency)} earned this month; ${formatCurrency(trends.earnings.previous, data.currency)} last month`,
      detail: "Provider share after refunds, before balance adjustments.",
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
    {
      label: "Active Orders",
      value: numberFormatter.format(stats.activeOrders),
      trend: describeTrend(trends.newPaidOrders),
      trendLabel:
        trends.newPaidOrders.changePercent === null
          ? "paid orders this month"
          : "new paid orders vs last month",
      trendDetail: `${numberFormatter.format(trends.newPaidOrders.current)} newly paid orders this month; ${numberFormatter.format(trends.newPaidOrders.previous)} last month`,
      icon: Briefcase,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Completed Orders",
      value: numberFormatter.format(stats.completedOrders),
      trend: describeTrend(trends.completedOrders),
      trendLabel:
        trends.completedOrders.changePercent === null
          ? "completed this month"
          : "completed vs last month",
      trendDetail: `${numberFormatter.format(trends.completedOrders.current)} orders completed this month; ${numberFormatter.format(trends.completedOrders.previous)} last month`,
      icon: CheckCircle2,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Average Rating",
      value: `${stats.averageRating} / 5`,
      supportingText: `${numberFormatter.format(stats.reviewCount)} ${stats.reviewCount === 1 ? "review" : "reviews"}`,
      icon: Star,
      color: "text-orange-500",
      barColor: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your services, track earnings, and grow your business.
          </p>
        </div>
        {refreshing && (
          <div
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            Refreshing
          </div>
        )}
      </header>

      {loadError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {staleFilterSnapshot
                ? `Could not load ${selectedYear} earnings and ${formatMonthKey(selectedOrderMonth)} orders. Showing the last successful snapshot for ${data.selectedYear} and ${formatMonthKey(data.orderMonth)}.`
                : "The dashboard could not be refreshed. The last successful snapshot remains visible."}{" "}
              {loadError}
            </p>
          </div>
          <button
            className="min-h-11 shrink-0 self-start px-1 font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 sm:self-auto"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {providerStats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 ${stat.barColor}`}
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <span className="font-medium text-card-foreground">
                  {stat.label}
                </span>
              </div>
              <div className="mb-1 text-2xl font-bold text-card-foreground">
                {stat.value}
              </div>
              {stat.trend ? (
                <div
                  className="text-sm text-muted-foreground"
                  title={stat.trendDetail}
                >
                  <span className={cn("font-medium", stat.trend.className)}>
                    {stat.trend.value}
                  </span>{" "}
                  {stat.trendLabel ?? stat.trend.label}
                </div>
              ) : (
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  {stat.supportingText}
                </div>
              )}
              {stat.detail && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {stat.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Orders (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Overview Chart */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-card-foreground">
                  Earnings overview
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-h-11">
                      {selectedYear}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {data.availableYears.map((year) => (
                      <DropdownMenuItem
                        key={year}
                        onSelect={() => setSelectedYear(year)}
                      >
                        {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-3 text-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="text-muted-foreground">
                  <span className="font-semibold text-card-foreground">
                    {formatCurrency(data.earningsSummary.total, data.currency)}
                  </span>{" "}
                  in {data.selectedYear}
                  {data.earningsSummary.bestMonth && (
                    <>
                      {" "}
                      · Best month: {data.earningsSummary.bestMonth.name} (
                      {formatCurrency(
                        data.earningsSummary.bestMonth.earnings,
                        data.currency,
                      )}
                      )
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: "var(--chart-3)" }}
                    />
                    <span className="text-muted-foreground">
                      {data.selectedYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="relative h-2.5 w-2.5 overflow-hidden rounded-sm"
                      style={{ backgroundColor: "var(--chart-2)" }}
                    >
                      <span className="absolute left-1/2 top-[-2px] h-4 -translate-x-1/2 rotate-45 border-l-2 border-card" />
                    </span>
                    <span className="text-muted-foreground">
                      {data.selectedYear - 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "relative h-[300px] w-full transition-opacity motion-reduce:transition-none",
                staleYearSnapshot && "opacity-60",
              )}
              role="img"
              aria-label={`Monthly provider earnings for ${data.selectedYear} compared with ${data.selectedYear - 1}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChart} barGap={0}>
                  <defs>
                    <pattern
                      id="provider-previous-earnings"
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="8" height="8" fill="var(--chart-2)" />
                      <path
                        d="M-2 2L2-2M0 8L8 0M6 10L10 6"
                        stroke="var(--card)"
                        strokeWidth="2"
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value) =>
                      compactNumberFormatter.format(Number(value))
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value ?? 0), data.currency),
                      name === "current"
                        ? String(data.selectedYear)
                        : String(data.selectedYear - 1),
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--popover-foreground)",
                    }}
                    itemStyle={{ color: "var(--popover-foreground)" }}
                    labelStyle={{ color: "var(--popover-foreground)" }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="current"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="previous"
                    fill="url(#provider-previous-earnings)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
              {!chartHasData && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="rounded-lg bg-card/95 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                    No earnings recorded for {data.selectedYear} or{" "}
                    {data.selectedYear - 1}.
                  </p>
                </div>
              )}
            </div>
            <table className="sr-only">
              <caption>
                Provider share after refunds for {data.selectedYear} and{" "}
                {data.selectedYear - 1}, before balance adjustments
              </caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">{data.selectedYear}</th>
                  <th scope="col">{data.selectedYear - 1}</th>
                </tr>
              </thead>
              <tbody>
                {earningsChart.map((month) => (
                  <tr key={month.name}>
                    <th scope="row">{month.name}</th>
                    <td>{formatCurrency(month.current, data.currency)}</td>
                    <td>{formatCurrency(month.previous, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Earnings are your provider share after refunds and before balance
              adjustments. See Earnings &amp; payouts for your withdrawable
              balance.
            </p>
          </div>

          {/* Recent Order Requests */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-card-foreground">
                Recent Order Requests
              </h3>
              <button
                className="min-h-11 self-start px-1 text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-green-300 sm:self-auto"
                onClick={() => router.push("/dashboard/orders")}
              >
                View all orders
              </button>
            </div>

            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  className="flex min-h-11 w-full flex-col gap-3 py-4 text-left first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-sm font-bold text-green-800 dark:bg-green-950 dark:text-green-200">
                      <span aria-hidden="true">
                        {order.clientName.charAt(0).toUpperCase() || "?"}
                      </span>
                      {order.clientAvatar && (
                        <Image
                          src={resolveCategoryImageUrl(order.clientAvatar)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                          loader={({ src }) => src}
                          unoptimized
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-bold text-card-foreground">
                          {order.clientName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          · {order.plan}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-card-foreground">
                          {order.orderNumber}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {order.serviceTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 pl-14 sm:pl-0">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        order.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
                          : order.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                            : order.status === "REFUNDED"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-200"
                              : order.status === "DECLINED"
                                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
                      )}
                    >
                      {order.status === "PENDING" || order.status === "AWAITING"
                        ? "Awaiting"
                        : order.status
                            .toLowerCase()
                            .replace("_", " ")
                            .replace(/^./, (value) => value.toUpperCase())}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("en-GH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(order.createdAt))}
                    </span>
                  </div>
                </button>
              ))}
              {recentOrders.length === 0 && (
                <div className="py-10 text-center">
                  <Briefcase className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-card-foreground">
                    No paid order requests yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New paid requests will appear here when customers place
                    them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-card-foreground">
                Order summary
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-11">
                    {formatMonthKey(selectedOrderMonth)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {data.availableOrderMonths.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onSelect={() => setSelectedOrderMonth(month)}
                    >
                      {formatMonthKey(month)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-card-foreground">
                {numberFormatter.format(orderSummary.total)}
              </div>
              <div
                className="text-sm text-muted-foreground"
                title={`${numberFormatter.format(orderSummary.trend.current)} orders in ${formatMonthKey(data.orderMonth)}; ${numberFormatter.format(orderSummary.trend.previous)} in the previous month`}
              >
                <span className={cn("font-semibold", orderTrend.className)}>
                  {orderTrend.value}
                </span>{" "}
                vs previous month
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Paid orders placed in {formatMonthKey(data.orderMonth)}
              </div>
            </div>

            <div
              className={cn(
                "mb-4 flex h-[60px] w-full overflow-hidden rounded-md transition-opacity motion-reduce:transition-none",
                staleOrderSnapshot && "opacity-60",
              )}
              role="img"
              aria-label={`Order totals for ${formatMonthKey(data.orderMonth)}: ${orderSummary.breakdown
                .map((item) => `${item.name} ${item.value}`)
                .join(", ")}`}
            >
              {orderSummary.breakdown.map((item) => (
                <div
                  key={item.name}
                  style={{
                    width:
                      orderSummary.total > 0
                        ? `${(item.value / orderSummary.total) * 100}%`
                        : "0%",
                    backgroundColor:
                      STATUS_COLORS[item.name] || "var(--border)",
                  }}
                  className="h-full"
                />
              ))}
              {orderSummary.total === 0 && (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                  No paid orders
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {orderSummary.breakdown.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[item.name] || "var(--border)",
                    }}
                  ></span>
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="ml-auto font-bold text-card-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <button
                className="flex min-h-11 items-center px-1 text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-green-300"
                onClick={() => router.push("/dashboard/orders")}
              >
                View all orders <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- User Dashboard ---

function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getUTCFullYear(),
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      setRefreshing(true);
      try {
        const analytics = await apiService.getUserAnalytics({
          year: selectedYear,
        });
        if (!cancelled) setData(analytics);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "The dashboard data could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [retryKey, selectedYear]);

  if (loading && !data) {
    return (
      <div
        className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-green-700 motion-reduce:animate-none" />
        <p className="text-sm font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="mx-auto mt-16 max-w-xl rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900 dark:bg-red-950/40"
        role="alert"
      >
        <AlertCircle className="mx-auto h-7 w-7 text-red-700 dark:text-red-300" />
        <h1 className="mt-4 text-lg font-bold text-red-950 dark:text-red-100">
          Your dashboard is unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-red-800 dark:text-red-200">
          {loadError ?? "The analytics API did not return dashboard data."}
        </p>
        <Button
          variant="outline"
          className="mt-5 min-h-11 border-red-300 bg-card text-red-900 hover:bg-red-100 dark:border-red-800 dark:text-red-100 dark:hover:bg-red-950"
          onClick={() => setRetryKey((value) => value + 1)}
        >
          Try again
        </Button>
      </div>
    );
  }

  const {
    stats,
    trends,
    orderStatusBreakdown = [],
    recentOrders = [],
    spendingChart = [],
  } = data;
  const chartHasData = spendingChart.some(
    (item) => item.current || item.previous,
  );
  const staleYearSnapshot = data.selectedYear !== selectedYear;

  const userStats = [
    {
      label: "Lifetime Spending",
      value: formatCurrency(stats.totalSpent, data.currency),
      trend: describeTrend(trends.spending),
      trendLabel:
        trends.spending.changePercent === null
          ? "net spending this month"
          : "net spending vs last month",
      trendDetail: `${formatCurrency(trends.spending.current, data.currency)} net spending this month; ${formatCurrency(trends.spending.previous, data.currency)} last month`,
      detail: "Amount paid after processed refunds.",
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
    {
      label: "Active Orders",
      value: numberFormatter.format(stats.activeOrders),
      trend: describeTrend(trends.newPaidOrders),
      trendLabel:
        trends.newPaidOrders.changePercent === null
          ? "paid orders this month"
          : "new paid orders vs last month",
      trendDetail: `${numberFormatter.format(trends.newPaidOrders.current)} newly paid orders this month; ${numberFormatter.format(trends.newPaidOrders.previous)} last month`,
      icon: Briefcase,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Completed Orders",
      value: numberFormatter.format(stats.completedOrders),
      trend: describeTrend(trends.completedOrders),
      trendLabel:
        trends.completedOrders.changePercent === null
          ? "completed this month"
          : "completed vs last month",
      trendDetail: `${numberFormatter.format(trends.completedOrders.current)} orders completed this month; ${numberFormatter.format(trends.completedOrders.previous)} last month`,
      icon: CheckCircle2,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Total Orders",
      value: numberFormatter.format(stats.totalOrders),
      supportingText: "Paid and refunded history",
      icon: ShoppingBag,
      color: "text-orange-500",
      barColor: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor your orders and track your spending.
          </p>
        </div>
        {refreshing && (
          <div
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            Refreshing
          </div>
        )}
      </header>

      {loadError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {staleYearSnapshot
                ? `Could not load ${selectedYear} spending. Showing the last successful ${data.selectedYear} snapshot.`
                : "The dashboard could not be refreshed. The last successful snapshot remains visible."}{" "}
              {loadError}
            </p>
          </div>
          <button
            className="min-h-11 shrink-0 self-start px-1 font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 sm:self-auto"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div
              className={`absolute left-0 top-0 h-1 w-full ${stat.barColor}`}
            />
            <div className="p-6">
              <div className="mb-2 flex items-center gap-3">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <span className="font-medium text-card-foreground">
                  {stat.label}
                </span>
              </div>
              <div className="mb-1 text-2xl font-bold text-card-foreground">
                {stat.value}
              </div>
              {stat.trend ? (
                <div
                  className="text-sm text-muted-foreground"
                  title={stat.trendDetail}
                >
                  <span className={cn("font-medium", stat.trend.className)}>
                    {stat.trend.value}
                  </span>{" "}
                  {stat.trendLabel}
                </div>
              ) : (
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  {stat.supportingText}
                </div>
              )}
              {stat.detail && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {stat.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Charts & Orders (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Spending Overview Chart */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-card-foreground">
                  Spending overview
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-h-11">
                      {selectedYear}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {data.availableYears.map((year) => (
                      <DropdownMenuItem
                        key={year}
                        onSelect={() => setSelectedYear(year)}
                      >
                        {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-3 text-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="text-muted-foreground">
                  <span className="font-semibold text-card-foreground">
                    {formatCurrency(data.spendingSummary.total, data.currency)}
                  </span>{" "}
                  in {data.selectedYear}
                  {data.spendingSummary.bestMonth && (
                    <>
                      {" "}
                      · Highest month: {data.spendingSummary.bestMonth.name} (
                      {formatCurrency(
                        data.spendingSummary.bestMonth.spending,
                        data.currency,
                      )}
                      )
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: "var(--chart-3)" }}
                    />
                    <span className="text-muted-foreground">
                      {data.selectedYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="relative h-2.5 w-2.5 overflow-hidden rounded-sm"
                      style={{ backgroundColor: "var(--chart-2)" }}
                    >
                      <span className="absolute left-1/2 top-[-2px] h-4 -translate-x-1/2 rotate-45 border-l-2 border-card" />
                    </span>
                    <span className="text-muted-foreground">
                      {data.selectedYear - 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "relative h-[300px] w-full transition-opacity motion-reduce:transition-none",
                staleYearSnapshot && "opacity-60",
              )}
              role="img"
              aria-label={`Monthly net spending for ${data.selectedYear} compared with ${data.selectedYear - 1}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingChart} barGap={0}>
                  <defs>
                    <pattern
                      id="user-previous-spending"
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="8" height="8" fill="var(--chart-2)" />
                      <path
                        d="M-2 2L2-2M0 8L8 0M6 10L10 6"
                        stroke="var(--card)"
                        strokeWidth="2"
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value) =>
                      compactNumberFormatter.format(Number(value))
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value ?? 0), data.currency),
                      name === "current"
                        ? String(data.selectedYear)
                        : String(data.selectedYear - 1),
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--popover-foreground)",
                    }}
                    itemStyle={{ color: "var(--popover-foreground)" }}
                    labelStyle={{ color: "var(--popover-foreground)" }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="current"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="previous"
                    fill="url(#user-previous-spending)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
              {!chartHasData && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="rounded-lg bg-card/95 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                    No spending recorded for {data.selectedYear} or{" "}
                    {data.selectedYear - 1}.
                  </p>
                </div>
              )}
            </div>
            <table className="sr-only">
              <caption>
                Net spending after processed refunds for {data.selectedYear} and{" "}
                {data.selectedYear - 1}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">{data.selectedYear}</th>
                  <th scope="col">{data.selectedYear - 1}</th>
                </tr>
              </thead>
              <tbody>
                {spendingChart.map((month) => (
                  <tr key={month.name}>
                    <th scope="row">{month.name}</th>
                    <td>{formatCurrency(month.current, data.currency)}</td>
                    <td>{formatCurrency(month.previous, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Net spending is grouped by payment month and subtracts processed
              refunds.
            </p>
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-card-foreground">
                Recent Orders
              </h3>
              <button
                className="min-h-11 self-start px-1 text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-green-300 sm:self-auto"
                onClick={() => router.push("/dashboard/orders")}
              >
                View all orders
              </button>
            </div>

            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  className="flex min-h-11 w-full flex-col gap-3 py-4 text-left first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-sm font-bold text-green-800 dark:bg-green-950 dark:text-green-200">
                      <span aria-hidden="true">
                        {order.providerName.charAt(0).toUpperCase() || "?"}
                      </span>
                      {order.providerAvatar && (
                        <Image
                          src={resolveCategoryImageUrl(order.providerAvatar)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                          loader={({ src }) => src}
                          unoptimized
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-bold text-card-foreground">
                          {order.providerName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          · Net paid:{" "}
                          {formatCurrency(order.netTotal, order.currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-card-foreground">
                          {order.orderNumber}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {order.serviceTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 pl-14 sm:pl-0">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        order.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
                          : order.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                            : order.status === "REFUNDED"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-200"
                              : order.status === "DECLINED"
                                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
                      )}
                    >
                      {order.status === "PENDING" || order.status === "AWAITING"
                        ? "Awaiting"
                        : order.status
                            .toLowerCase()
                            .replace("_", " ")
                            .replace(/^./, (value) => value.toUpperCase())}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("en-GH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(order.createdAt))}
                    </span>
                  </div>
                </button>
              ))}
              {recentOrders.length === 0 && (
                <div className="py-10 text-center">
                  <ShoppingBag className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-card-foreground">
                    No paid orders yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your paid orders will appear here after checkout.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 min-h-11"
                    onClick={() => router.push("/")}
                  >
                    Browse services
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-card-foreground">
                Order summary
              </h3>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-card-foreground">
                {numberFormatter.format(stats.totalOrders)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Paid and refunded order history
              </div>
            </div>

            <div
              className="mb-4 flex h-[60px] w-full overflow-hidden rounded-md"
              role="img"
              aria-label={`All-time order totals: ${orderStatusBreakdown
                .map((item) => `${item.name} ${item.value}`)
                .join(", ")}`}
            >
              {orderStatusBreakdown.map((item) => (
                <div
                  key={item.name}
                  style={{
                    width:
                      stats.totalOrders > 0
                        ? `${(item.value / stats.totalOrders) * 100}%`
                        : "0%",
                    backgroundColor:
                      STATUS_COLORS[item.name] || "var(--border)",
                  }}
                  className="h-full"
                />
              ))}
              {stats.totalOrders === 0 && (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                  No paid orders
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {orderStatusBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[item.name] || "var(--border)",
                    }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="ml-auto font-bold text-card-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <button
                className="flex min-h-11 items-center px-1 text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-green-300"
                onClick={() => router.push("/dashboard/orders")}
              >
                View all orders <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === "USER") {
    return <UserDashboard />;
  }

  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <ProviderDashboard />;
}
