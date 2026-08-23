"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import { Mail, ChevronRight, RotateCcw, Star } from "lucide-react";
import Link from "next/link";
import {
  mockOrders,
  progressStages,
  type OrderStatus,
  type OrderWithSummary,
} from "@/lib/orders-data";

export default function OrdersPage() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("awaiting");
  const [orders] = useState<OrderWithSummary[]>(mockOrders);

  const filteredOrders = orders.filter(
    (order) => order.status === selectedStatus
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "awaiting":
        return "text-orange-600";
      case "in-progress":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "declined":
        return "text-red-600";
    }
  };

  const getStatusDotColor = (status: OrderStatus) => {
    switch (status) {
      case "awaiting":
        return "bg-orange-500";
      case "in-progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "declined":
        return "bg-red-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Page Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          My orders
        </h1>

        {/* Status Filter Tabs */}
        <div className="mb-8 max-w-full overflow-x-auto pb-1">
          <div className="inline-flex w-max items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1 py-1">
            {(
              [
                "awaiting",
                "in-progress",
                "completed",
                "declined",
              ] as OrderStatus[]
            ).map((status) => {
              const isActive = selectedStatus === status;
              const label =
                status === "in-progress"
                  ? "In-progress"
                  : status.charAt(0).toUpperCase() + status.slice(1);

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white dark:bg-gray-900 text-brand-800 dark:text-brand-400 shadow-sm"
                      : "bg-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={`p-6 ${
                index !== filteredOrders.length - 1
                  ? "border-b border-gray-200 dark:border-gray-700"
                  : ""
              }`}
            >
              {/* Provider Info Section */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={order.providerAvatar}
                    alt={order.providerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.providerName}
                  </span>
                  <Link
                    href={`/services/${order.id}`}
                    className="text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 text-sm"
                  >
                    view profile
                  </Link>
                </div>
              </div>

              {/* Main Content - Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Order Details */}
                <div className="space-y-4">
                  {/* Order Info with Date */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900 dark:text-white">
                        Order ID: #{order.orderId}
                      </span>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.serviceCategory}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusDotColor(
                            order.status
                          )}`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status === "in-progress"
                            ? "In-progress"
                            : order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 sm:shrink-0">
                      {order.date}
                    </span>
                  </div>

                  {/* Order Details Link */}
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 text-sm font-medium"
                  >
                    Order details
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  {/* Progress Bar */}
                  <div>
                    {/* Single continuous progress bar */}
                    <div className="relative">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-brand-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              ((order.progressStage + 1) /
                                progressStages.length) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Stage labels */}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      {progressStages.map((stage, stageIndex) => (
                        <span
                          key={stageIndex}
                          className={`text-xs ${
                            stageIndex <= order.progressStage
                              ? "text-gray-900 dark:text-white font-medium"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:justify-end lg:justify-center">
                  {order.status === "completed" ? (
                    <>
                      <button className="px-4 py-2 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors">
                        Accept
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() =>
                          router.push(`/orders/${order.id}/review`)
                        }
                      >
                        <Star className="w-4 h-4" />
                        Leave a Review
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        Reorder service
                      </button>
                    </>
                  ) : order.status === "declined" ? (
                    <>
                      <button
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium text-sm cursor-not-allowed"
                        disabled
                      >
                        Raise dispute
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed"
                        disabled
                      >
                        <Mail className="w-4 h-4" />
                        Message Freelancer
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="px-4 py-2 bg-brand-900 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors">
                        {order.status === "in-progress"
                          ? "Raise dispute"
                          : "Cancel Order"}
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Mail className="w-4 h-4" />
                        Message Freelancer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
