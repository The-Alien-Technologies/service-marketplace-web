export type OrderStatus = "awaiting" | "in-progress" | "completed" | "declined";

export interface Order {
  id: string;
  orderId: string;
  currency: string;
  providerName: string;
  providerAvatar: string;
  serviceCategory: string;
  status: OrderStatus;
  date: string;
  // 0-3: Order placed, Awaiting, In-progress, Completed
  progressStage: number;
}

export interface OrderSummary {
  subtotal: number;
  addOns: number;
  couponDiscount: number;
  total: number;
}

export interface OrderWithSummary extends Order {
  orderSummary: OrderSummary;
}

export const progressStages = [
  "Order placed",
  "Awaiting",
  "In-progress",
  "Completed",
] as const;

export const mockOrders: OrderWithSummary[] = [
  // Awaiting orders
  {
    id: "1",
    orderId: "5764892",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "awaiting",
    date: "August 29, 2025",
    progressStage: 1,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "2",
    orderId: "5764893",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "awaiting",
    date: "August 29, 2025",
    progressStage: 1,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "3",
    orderId: "5764894",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "awaiting",
    date: "August 29, 2025",
    progressStage: 1,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  // In-progress orders
  {
    id: "4",
    orderId: "5764895",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "in-progress",
    date: "August 29, 2025",
    progressStage: 2,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "5",
    orderId: "5764896",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "in-progress",
    date: "August 29, 2025",
    progressStage: 2,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "6",
    orderId: "5764897",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "in-progress",
    date: "August 29, 2025",
    progressStage: 2,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  // Completed orders
  {
    id: "7",
    orderId: "5764898",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "completed",
    date: "August 29, 2025",
    progressStage: 3,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "11",
    orderId: "5764902",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "completed",
    date: "August 29, 2025",
    progressStage: 3,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "12",
    orderId: "5764903",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "completed",
    date: "August 28, 2025",
    progressStage: 3,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  // Declined orders
  {
    id: "8",
    orderId: "5764899",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "declined",
    date: "August 28, 2025",
    progressStage: 0,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "9",
    orderId: "5764900",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "declined",
    date: "August 26, 2025",
    progressStage: 0,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
  {
    id: "10",
    orderId: "5764901",
    currency: "GHS",
    providerName: "Robert sam",
    providerAvatar: "/assets/temp/user/u1.jpg",
    serviceCategory: "Architecture & Interior Design",
    status: "declined",
    date: "August 25, 2025",
    progressStage: 0,
    orderSummary: {
      subtotal: 250.0,
      addOns: 150.0,
      couponDiscount: 50.0,
      total: 350.0,
    },
  },
];

