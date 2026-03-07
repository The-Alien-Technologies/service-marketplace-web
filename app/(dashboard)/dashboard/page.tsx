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
  MoreVertical,
  CheckCircle2,
  Loader2,
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
  UserAnalytics,
} from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  Completed: "#4ade80",
  Pending: "#facc15",
  Awaiting: "#facc15",
  "In-progress": "#3b82f6",
  Declined: "#f87171",
  Expired: "#9ca3af",
};

// --- Admin Dashboard ---

function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const analytics = await apiService.getAdminAnalytics();
        setData(analytics);
      } catch (error) {
        console.error("Failed to load admin analytics", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const {
    stats,
    orderStatusBreakdown,
    topCategories,
    revenueChart,
    totalOrders,
  } = data;

  const statCards = [
    {
      label: "Total User",
      value: stats.totalUsers.toString(),
      trend: "+12%", // Mock trend
      trendLabel: "vs last month",
      icon: Users,
      color: "text-orange-600",
      barColor: "bg-orange-600",
    },
    {
      label: "Active Providers",
      value: stats.activeProviders.toString(),
      trend: "+5%", // Mock trend
      trendLabel: "vs last month",
      icon: Briefcase,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders.toString(),
      trend: "+8%", // Mock trend
      trendLabel: "from last month",
      icon: ShoppingBag,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Revenue",
      value: `GHS ${stats.revenue.toLocaleString()}`,
      trend: "+15%", // Mock trend
      trendLabel: "vs last month",
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Monitor platform performance and take quick actions.
        </p>
      </div>

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
              <div className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{stat.trend}</span>{" "}
                {stat.trendLabel}
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
                    Year <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>2025</DropdownMenuItem>
                  <DropdownMenuItem>2024</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-gray-500"> vs Last Month | </span>
                <span className="text-gray-500">
                  Best Month: June (GHS 30,200)
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-gray-600">Total revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span className="text-gray-600">Commissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-gray-600">Payouts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
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
                />
                <Tooltip
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
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#fb923c" // orange-400
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="payout"
                  stroke="#4ade80" // green-400
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
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

            <div className="flex items-center">
              <div className="relative w-[180px] h-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={90}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {orderStatusBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={STATUS_COLORS[entry.name] || "#e5e7eb"}
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
              <div className="flex-1 pl-6 space-y-3">
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
                      ></span>
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
              <button className="flex items-center text-green-700 font-medium text-sm hover:underline">
                View Detail Report <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Top Categories
                </h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Month <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>August</DropdownMenuItem>
                  <DropdownMenuItem>September</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 w-4">
                      {index + 1}.
                    </span>
                    <div className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-full text-xs">
                      {/* Using imageUrl as icon here, or fallback emoji */}
                      {cat.icon.startsWith("http") ? (
                        <div className="relative w-5 h-5 rounded-full overflow-hidden">
                          <Image
                            src={cat.icon}
                            alt={cat.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-600">{cat.icon}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {cat.count} services
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Provider Dashboard ---

function ProviderDashboard() {
  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const analytics = await apiService.getProviderAnalytics();
        setData(analytics);
      } catch (error) {
        console.error("Failed to load provider analytics", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const { stats, orderStatusBreakdown, recentOrders, earningsChart } = data;

  const providerStats = [
    {
      label: "Earnings",
      value: "GHS 2,350", // Mocked in backend service? Actually backend doesn't return revenue yet for provider, so static.
      trend: "+12%",
      trendLabel: "vs last month",
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders.toString(),
      trend: "+12%",
      trendLabel: "from last month",
      icon: Briefcase,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Completed Orders",
      value: stats.completedOrders.toString(),
      trend: "+12%",
      trendLabel: "vs last month",
      icon: CheckCircle2,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Average Rating",
      value: `${stats.averageRating} / 5`,
      trend: `(${stats.reviewCount} reviews)`,
      trendLabel: "",
      icon: Star,
      color: "text-orange-500",
      barColor: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Manage your services, track earnings, and grow your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {providerStats.map((stat) => (
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
              <div className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{stat.trend}</span>{" "}
                {stat.trendLabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Orders (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Overview Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Earnings overview
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Year <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>2025</DropdownMenuItem>
                    <DropdownMenuItem>2024</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-gray-500"> vs Last Month | </span>
                  <span className="text-gray-500">
                    Best Month: June (GHS 3,200)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-800"></span>
                    <span className="text-gray-600">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-100"></span>
                    <span className="text-gray-600">Previous</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChart} barGap={0}>
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
                    label={{
                      value: "Earnings(GHS)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#9ca3af", fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="current"
                    fill="#3f6212" // deep green
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="previous"
                    fill="#dcfce7" // light green
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Order Requests */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Recent Order Requests
              </h3>
              <button className="text-sm text-green-600 font-medium hover:underline">
                View more
              </button>
            </div>

            <div className="space-y-6">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gray-100 shrink-0">
                      <Image
                        src={order.clientAvatar || "/assets/temp/user/u1.jpg"}
                        alt={order.clientName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {order.clientName}
                        </span>
                        <span className="text-sm text-gray-300">|</span>
                        <span className="text-sm text-gray-500">
                          Plan: {order.plan}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-bold text-gray-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500">
                          {order.serviceTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No recent orders found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Order summary</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Month <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>August</DropdownMenuItem>
                  <DropdownMenuItem>September</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalOrders}
              </div>
              <div className="text-sm text-green-600 font-medium">
                +12%{" "}
                <span className="text-gray-500 font-normal">vs Last Month</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Total orders</div>
            </div>

            <div className="w-full h-[60px] flex rounded-md overflow-hidden mb-4">
              {orderStatusBreakdown.map((item, index) => (
                <div
                  key={item.name}
                  style={{
                    width:
                      stats.totalOrders > 0
                        ? `${(item.value / stats.totalOrders) * 100}%`
                        : "0%",
                    backgroundColor: STATUS_COLORS[item.name] || "#e5e7eb",
                  }}
                  className="h-full"
                />
              ))}
              {stats.totalOrders === 0 && (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  No data
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
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[item.name] || "#e5e7eb",
                    }}
                  ></span>
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-bold text-gray-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Leaderboard (Still Mocked for Provider or Hidden?) 
              Provider dashboard usually doesn't show global leaderboard. 
              Let's hide it for provider or mock it if needed. 
              The original design had it. I'll mock it for now to keep the layout consistent or just leave it out 
              if it wasn't returned by backend. 
              
              The backend for provider didn't return leaderboard. I'll omit it for provider to fit the data.
          */}
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

  useEffect(() => {
    async function load() {
      try {
        const analytics = await apiService.getUserAnalytics();
        setData(analytics);
      } catch (error) {
        console.error("Failed to load user analytics", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const { stats, orderStatusBreakdown, recentOrders, spendingChart } = data;

  const userStats = [
    {
      label: "Total Spent",
      value: `GHS ${(stats.totalSpent || 0).toLocaleString()}`,
      trend: "+0%", // Static for now
      trendLabel: "vs last month",
      icon: CreditCard,
      color: "text-green-600",
      barColor: "bg-green-600",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders.toString(),
      trend: "Orders in progress",
      trendLabel: "",
      icon: Briefcase,
      color: "text-blue-600",
      barColor: "bg-blue-600",
    },
    {
      label: "Completed Orders",
      value: stats.completedOrders.toString(),
      trend: "Total completed",
      trendLabel: "",
      icon: CheckCircle2,
      color: "text-purple-600",
      barColor: "bg-purple-600",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      trend: "All time",
      trendLabel: "",
      icon: ShoppingBag,
      color: "text-orange-500",
      barColor: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Monitor your orders and track your spending.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat) => (
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
              <div className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{stat.trend}</span>{" "}
                {stat.trendLabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Orders (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Overview Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Spending overview
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Year <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>2025</DropdownMenuItem>
                    <DropdownMenuItem>2024</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-green-600 font-medium">+0%</span>
                  <span className="text-gray-500"> vs Last Month | </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-800"></span>
                    <span className="text-gray-600">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-100"></span>
                    <span className="text-gray-600">Previous</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingChart} barGap={0}>
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
                    label={{
                      value: "Spending(GHS)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#9ca3af", fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="current"
                    fill="#3f6212" // deep green
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="previous"
                    fill="#dcfce7" // light green
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              <button
                className="text-sm text-green-600 font-medium hover:underline"
                onClick={() => router.push("/dashboard/orders")}
              >
                View all orders
              </button>
            </div>

            <div className="space-y-6">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gray-100 shrink-0">
                      <Image
                        src={order.providerAvatar || "/assets/temp/user/u1.jpg"}
                        alt={order.providerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {order.providerName}
                        </span>
                        <span className="text-sm text-gray-300">|</span>
                        <span className="text-sm text-gray-500">
                          Total: GHS {order.total}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-bold text-gray-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500">
                          {order.serviceTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 font-medium rounded-full">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No recent orders found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Order summary</h3>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalOrders}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total orders</div>
            </div>

            <div className="w-full h-[60px] flex rounded-md overflow-hidden mb-4">
              {orderStatusBreakdown.map((item, index) => (
                <div
                  key={item.name}
                  style={{
                    width:
                      stats.totalOrders > 0
                        ? `${(item.value / stats.totalOrders) * 100}%`
                        : "0%",
                    backgroundColor: STATUS_COLORS[item.name] || "#e5e7eb",
                  }}
                  className="h-full"
                />
              ))}
              {stats.totalOrders === 0 && (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  No data
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
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[item.name] || "#e5e7eb",
                    }}
                  ></span>
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-bold text-gray-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
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
