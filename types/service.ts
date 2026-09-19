// Service Types
export interface ServicePlan {
  id?: string;
  title: string;
  price: number;
  inclusions: string;
  isPopular?: boolean;
  sortOrder?: number;
}

export interface ServiceAddon {
  id?: string;
  title: string;
  description?: string;
  price: number;
}

export interface ServiceImage {
  id: string;
  url: string;
  fileName: string;
  sortOrder: number;
}

export type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
export type ServiceAvailability = "MARKET" | "GLOBAL";

export interface Service {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  slug: string;
  overview: string;
  coverImage?: string;
  tags: string[];
  status: ServiceStatus;
  providerId: string;
  categoryId: string;
  marketId: string;
  currency: string;
  availability: ServiceAvailability;

  // Relations
  plans: ServicePlan[];
  addons: ServiceAddon[];
  images: ServiceImage[];
  category?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  market?: {
    id: string;
    code: string;
    name: string;
    currency: string;
    locale: string;
    status: "ACTIVE" | "PAUSED" | "INACTIVE";
    checkoutEnabled: boolean;
  };
  provider?: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
  };
}

export interface CreateServiceData {
  marketId: string;
  availability?: ServiceAvailability;
  title: string;
  categoryId: string;
  overview: string;
  tags?: string[];
  plans: ServicePlan[];
  addons?: ServiceAddon[];
}
