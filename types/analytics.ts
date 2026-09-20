// ─── Analytics Types ──────────────────────────────────────────────────────────

export type ProviderAnalytics = {
  market: AnalyticsMarket;
  currency: string;
  generatedAt: string;
  stats: {
    earnings: number;
    activeOrders: number;
    completedOrders: number;
    totalOrders: number;
    averageRating: number;
    reviewCount: number;
  };
  trends: {
    earnings: AnalyticsTrend;
    newPaidOrders: AnalyticsTrend;
    completedOrders: AnalyticsTrend;
  };
  selectedYear: number;
  availableYears: number[];
  earningsSummary: {
    total: number;
    bestMonth: { name: string; earnings: number } | null;
  };
  earningsChart: { name: string; current: number; previous: number }[];
  orderMonth: string;
  availableOrderMonths: string[];
  orderSummary: {
    total: number;
    trend: AnalyticsTrend;
    breakdown: { name: string; value: number }[];
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    clientName: string;
    clientAvatar?: string | null;
    plan: string;
    serviceTitle: string;
    status: string;
    createdAt: string;
  }[];
};

export type AnalyticsTrend = {
  current: number;
  previous: number;
  changePercent: number | null;
};

export type AnalyticsMarket = {
  id: string;
  code: string;
  name: string;
  currency: string;
};

export type AdminAnalytics = {
  currency: string;
  marketRevenueBreakdown: {
    id: string;
    code: string;
    name: string;
    currency: string;
    grossVolume: number;
    commission: number;
    netRevenue: number;
    payout: number;
    currentMonthNetRevenue: number;
    previousMonthNetRevenue: number;
    growthPercent: number | null;
    comparisonMonth: string;
    previousComparisonMonth: string;
  }[];
  generatedAt: string;
  stats: {
    totalUsers: number;
    activeProviders: number;
    activeOrders: number;
    revenue: number;
  };
  trends: {
    totalUsers: AnalyticsTrend;
    activeProviders: AnalyticsTrend;
    activeOrders: AnalyticsTrend;
    revenue: AnalyticsTrend;
  };
  orderStatusBreakdown: { name: string; value: number }[];
  totalOrders: number;
  topCategories: {
    id: string;
    name: string;
    imageUrl: string | null;
    count: number;
  }[];
  categoryMonth: string;
  availableCategoryMonths: string[];
  selectedYear: number;
  availableYears: number[];
  revenueSummary: {
    total: number;
    bestMonth: { name: string; revenue: number } | null;
  };
  revenueChart: {
    name: string;
    grossVolume: number;
    commission: number;
    netRevenue: number;
    payout: number;
  }[];
};

export type UserAnalytics = {
  market: AnalyticsMarket;
  currency: string;
  generatedAt: string;
  stats: {
    activeOrders: number;
    completedOrders: number;
    totalOrders: number;
    totalSpent: number;
  };
  trends: {
    spending: AnalyticsTrend;
    newPaidOrders: AnalyticsTrend;
    completedOrders: AnalyticsTrend;
  };
  selectedYear: number;
  availableYears: number[];
  spendingSummary: {
    total: number;
    bestMonth: { name: string; spending: number } | null;
  };
  spendingChart: { name: string; current: number; previous: number }[];
  orderStatusBreakdown: { name: string; value: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    providerName: string;
    providerAvatar?: string | null;
    plan: string;
    serviceTitle: string;
    status: string;
    createdAt: string;
    currency: string;
    netTotal: number;
  }[];
};
