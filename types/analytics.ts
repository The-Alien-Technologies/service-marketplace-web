// ─── Analytics Types ──────────────────────────────────────────────────────────

export type ProviderAnalytics = {
  stats: {
    activeOrders: number;
    completedOrders: number;
    totalOrders: number;
    averageRating: number;
    reviewCount: number;
  };
  orderStatusBreakdown: { name: string; value: number; color: string }[];
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
  earningsChart: { name: string; current: number; previous: number }[];
};

export type AdminAnalytics = {
  stats: {
    totalUsers: number;
    activeProviders: number;
    activeOrders: number;
    revenue: number;
  };
  orderStatusBreakdown: { name: string; value: number; color: string }[];
  totalOrders: number;
  topCategories: { name: string; icon: string; count: number }[];
  revenueChart: {
    name: string;
    revenue: number;
    commission: number;
    payout: number;
  }[];
};
