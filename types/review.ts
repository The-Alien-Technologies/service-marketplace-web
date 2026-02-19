export type ReviewResponse = {
  id: string;
  reviewId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  orderId: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
  };
  service?: {
    id: string;
    title: string;
  };
  response?: ReviewResponse | null;
};

export type ReviewSummary = {
  average: number;
  total: number;
  breakdown: Record<number, number>;
};
