"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";
import { Order } from "@/types/order";
import { ChatBox } from "@/components/sections/service-detail/chat-box";
import { RaiseDisputeModal } from "@/components/sections/orders/raise-dispute-modal";
import { AdminPaymentTransaction } from "@/types/payment";
import { isSessionExpiredError } from "@/lib/client-session";
import { formatMoney } from "@/lib/money";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { marketDisplayName } from "@/lib/market-display";
import { useMarketStore } from "@/store/market-store";
import { exportCsv } from "@/lib/csv";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ADMIN_ORDER_TABS = ["Orders", "Revenue", "Transactions"];

// --- Column Helpers ---
const orderColumnHelper = createColumnHelper<Order>();
const transactionColumnHelper = createColumnHelper<AdminPaymentTransaction>();

const orderColumns = [
  orderColumnHelper.accessor("orderNumber", {
    header: "Order ID",
    cell: (info) => <span className="text-gray-600">#{info.getValue()}</span>,
  }),
  orderColumnHelper.accessor("service.title", {
    id: "service",
    header: "Service",
    cell: (info) => (
      <span
        className="text-gray-600 truncate max-w-[200px] block"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),
  orderColumnHelper.accessor("service.category.name", {
    id: "category",
    header: "Category",
    cell: (info) => (
      <span className="text-gray-500 text-sm">{info.getValue()}</span>
    ),
  }),
  orderColumnHelper.accessor((row) => row.service?.provider, {
    id: "provider",
    header: "Provider",
    cell: (info) => {
      const provider = info.getValue();
      if (!provider)
        return <span className="text-gray-400 italic">Unknown</span>;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative">
            {provider.avatar ? (
              <Image
                src={provider.avatar}
                alt={provider.displayName || "Provider"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-green-700 text-xs font-bold text-white">
                {initials(
                  provider.displayName ||
                    `${provider.firstName} ${provider.lastName}`,
                )}
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900 text-sm">
            {provider.displayName ||
              `${provider.firstName} ${provider.lastName}`}
          </span>
        </div>
      );
    },
  }),
  orderColumnHelper.accessor("total", {
    header: "Amount",
    cell: (info) => (
      <span className="text-gray-900 font-medium">
        {formatMoney(info.getValue(), info.row.original.currency)}
      </span>
    ),
  }),
  orderColumnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      let badgeStyles = "bg-gray-100 text-gray-700";
      let dotStyles = "bg-gray-500";

      switch (status) {
        case "COMPLETED":
          badgeStyles = "bg-green-50 text-green-700 border-green-200";
          dotStyles = "bg-green-500";
          break;
        case "IN_PROGRESS":
          badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
          dotStyles = "bg-blue-500";
          break;
        case "AWAITING":
        case "PENDING":
          badgeStyles = "bg-orange-50 text-orange-700 border-orange-200";
          dotStyles = "bg-orange-500";
          break;
        case "DECLINED":
        case "REFUNDED":
          badgeStyles = "bg-red-50 text-red-700 border-red-200";
          dotStyles = "bg-red-500";
          break;
      }

      return (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles}`}
          ></span>
          {status.replace("_", " ")}
        </div>
      );
    },
  }),
  orderColumnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/${info.row.original.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  }),
];

const createRevenueColumns = (labels: {
  orderId: string;
  service: string;
  gross: string;
  refunded: string;
  commission: string;
  netRevenue: string;
  action: string;
  viewOrder: string;
}) => [
  orderColumnHelper.accessor("orderNumber", {
    header: labels.orderId,
    cell: (info) => <span className="text-gray-600">#{info.getValue()}</span>,
  }),
  orderColumnHelper.accessor("service.title", {
    id: "service",
    header: labels.service,
    cell: (info) => (
      <span className="block max-w-[220px] truncate text-gray-700">
        {info.getValue()}
      </span>
    ),
  }),
  orderColumnHelper.accessor("settlement.grossAmount", {
    id: "grossAmount",
    header: labels.gross,
    cell: (info) =>
      formatMoney(info.getValue() || 0, info.row.original.currency),
  }),
  orderColumnHelper.accessor("settlement.refundedAmount", {
    id: "refundedAmount",
    header: labels.refunded,
    cell: (info) =>
      formatMoney(info.getValue() || 0, info.row.original.currency),
  }),
  orderColumnHelper.accessor("settlement.commissionAmount", {
    id: "commissionAmount",
    header: labels.commission,
    cell: (info) =>
      formatMoney(info.getValue() || 0, info.row.original.currency),
  }),
  orderColumnHelper.accessor("settlement.retainedAmount", {
    id: "retainedAmount",
    header: labels.netRevenue,
    cell: (info) => (
      <span className="font-semibold text-green-800">
        {formatMoney(info.getValue() || 0, info.row.original.currency)}
      </span>
    ),
  }),
  orderColumnHelper.display({
    id: "revenue-actions",
    header: labels.action,
    cell: (info) => (
      <Link
        href={`/dashboard/orders/${info.row.original.id}`}
        className="font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
      >
        {labels.viewOrder}
      </Link>
    ),
  }),
];

const transactionColumns = [
  transactionColumnHelper.accessor("reference", {
    header: "Reference",
    cell: (info) => (
      <span
        className="block max-w-[170px] truncate text-gray-600"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),
  transactionColumnHelper.accessor((row) => row.client, {
    id: "client",
    header: "Customer",
    cell: (info) => {
      const client = info.getValue();
      return (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {client.displayName ||
              [client.firstName, client.lastName].filter(Boolean).join(" ") ||
              client.email}
          </p>
          <p className="truncate text-xs text-gray-500">{client.email}</p>
        </div>
      );
    },
  }),
  transactionColumnHelper.accessor("order.service.title", {
    id: "service",
    header: "Service",
    cell: (info) => (
      <span
        className="block max-w-[180px] truncate text-gray-600"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),
  transactionColumnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="text-gray-900">
        {info.row.original.currency} {Number(info.getValue() || 0).toFixed(2)}
      </span>
    ),
  }),
  transactionColumnHelper.accessor("channel", {
    header: "Channel",
    cell: (info) => (
      <span className="text-gray-600 capitalize">
        {(info.getValue() || "Paystack").replaceAll("_", " ")}
      </span>
    ),
  }),
  transactionColumnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const styles =
        status === "SUCCESS"
          ? "bg-green-50 text-green-700"
          : status === "PENDING" || status === "INITIALIZED"
            ? "bg-amber-50 text-amber-700"
            : "bg-red-50 text-red-700";
      return (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
        >
          {status.replace("_", " ")}
        </span>
      );
    },
  }),
  transactionColumnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-gray-500">
        {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
          new Date(info.getValue()),
        )}
      </span>
    ),
  }),
];

// --- Admin Orders Component ---

function AdminOrders() {
  const t = useTranslations("Orders");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboardSource = searchParams.get("source") === "dashboard";
  const marketId = searchParams.get("marketId") || undefined;
  const dashboardStatus = searchParams.get("status") || undefined;
  const paidOnly = searchParams.get("paidOnly") === "true";
  const markets = useMarketStore((state) => state.markets);
  const scopedMarket = markets.find((market) => market.id === marketId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState(() =>
    ADMIN_ORDER_TABS.includes(searchParams.get("tab") || "")
      ? searchParams.get("tab")!
      : "Orders",
  );

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab && ADMIN_ORDER_TABS.includes(tab) ? tab : "Orders");
  }, [searchParams]);

  // Fetch Orders
  useEffect(() => {
    if (activeTab === "Orders" || activeTab === "Revenue") {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const result = await apiService.getAdminOrders({
            status: dashboardStatus,
            paidOnly,
            settledOnly: activeTab === "Revenue",
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: globalFilter,
            marketId,
            sortBy: sorting[0]?.id,
            orderBy: sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined,
          });
          setOrders(result.data);
          setPageCount(result.pagination.pages);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          toast.error(t("loadFailed"));
        } finally {
          setIsLoading(false);
        }
      };

      // Debounce search
      const timer = setTimeout(() => {
        fetchOrders();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    activeTab,
    dashboardStatus,
    globalFilter,
    marketId,
    paidOnly,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    t,
  ]);

  useEffect(() => {
    if (activeTab !== "Transactions") return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getAdminPayments({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: globalFilter,
          marketId,
          sortBy: sorting[0]?.id,
          orderBy: sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined,
        });
        setTransactions(result.data);
        setPageCount(result.pagination.pages);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        toast.error(t("loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    globalFilter,
    marketId,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    t,
  ]);

  const currentData = useMemo(() => {
    if (activeTab === "Transactions") return transactions;
    return orders;
  }, [activeTab, orders, transactions]);

  const currentColumns = useMemo(() => {
    if (activeTab === "Transactions") return transactionColumns;
    if (activeTab === "Revenue") {
      return createRevenueColumns({
        orderId: t("orderIdHeader"),
        service: t("serviceHeader"),
        gross: t("grossPaid"),
        refunded: t("processedRefunds"),
        commission: t("commission"),
        netRevenue: t("netRevenue"),
        action: t("actionHeader"),
        viewOrder: t("viewOrder"),
      });
    }
    return orderColumns;
  }, [activeTab, t]);

  const getSearchPlaceholder = () => {
    if (activeTab === "Cashout Request") return "search by provider...";
    if (activeTab === "Orders")
      return "search by order ID, customer or provider...";
    if (activeTab === "Revenue") return "search by order ID or service...";
    return "search by transaction ID, user...";
  };

  const table = useReactTable({
    data: currentData,
    columns: currentColumns as ColumnDef<unknown, any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    pageCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allRows: unknown[] = [];
      let page = 1;
      let pages = 1;
      do {
        const result =
          activeTab === "Transactions"
            ? await apiService.getAdminPayments({
                page,
                limit: 100,
                search: globalFilter,
                marketId,
                sortBy: sorting[0]?.id,
                orderBy: sorting[0]?.desc
                  ? "desc"
                  : sorting[0]
                    ? "asc"
                    : undefined,
              })
            : await apiService.getAdminOrders({
                status: dashboardStatus,
                paidOnly,
                settledOnly: activeTab === "Revenue",
                page,
                limit: 100,
                search: globalFilter,
                marketId,
                sortBy: sorting[0]?.id,
                orderBy: sorting[0]?.desc
                  ? "desc"
                  : sorting[0]
                    ? "asc"
                    : undefined,
              });
        allRows.push(...result.data);
        pages = result.pagination.pages;
        page += 1;
      } while (page <= pages);

      const exportRows = allRows.map((item: any) => {
        if (activeTab === "Transactions") {
          return {
            reference: item.reference,
            user:
              item.client?.displayName ||
              [item.client?.firstName, item.client?.lastName]
                .filter(Boolean)
                .join(" ") ||
              item.client?.email,
            amount: item.amount,
            currency: item.currency,
            status: item.status,
            channel: item.channel,
            createdAt: item.createdAt,
          };
        }
        return {
          orderNumber: item.orderNumber,
          service: item.service?.title,
          client: item.client?.displayName,
          provider:
            item.provider?.displayName || item.service?.provider?.displayName,
          total: item.total,
          currency: item.currency,
          status: item.status,
          paymentStatus: item.paymentStatus,
          createdAt: item.createdAt,
        };
      });
      exportCsv(
        `pavodah-${activeTab.toLowerCase().replace(/\s+/g, "-")}.csv`,
        exportRows,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("adminTitle")}
          </h1>
          <p className="text-gray-500 mt-1">{t("adminSubtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex w-full items-center gap-2 overflow-x-auto rounded-lg bg-gray-100/50 p-1 sm:w-fit">
          {ADMIN_ORDER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setGlobalFilter("");
                setSorting([]);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", tab);
                if (tab !== "Orders") {
                  params.delete("status");
                  params.delete("paidOnly");
                }
                router.replace(`/dashboard/orders?${params.toString()}`, {
                  scroll: false,
                });
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
              )}
            >
              {tab === "Orders"
                ? t("title")
                : tab === "Revenue"
                  ? t("revenueLedger")
                  : t("transactions")}
            </button>
          ))}
        </div>
      </div>

      {dashboardSource && (
        <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t(
              activeTab === "Revenue" || activeTab === "Transactions"
                ? "dashboardAdminRevenueScope"
                : dashboardStatus
                  ? "dashboardAdminActiveScope"
                  : "dashboardAdminOrdersScope",
              {
                market: scopedMarket
                  ? marketDisplayName(locale, scopedMarket)
                  : t("allMarkets"),
              },
            )}
          </p>
          <Link
            href="/dashboard/orders"
            className="shrink-0 font-semibold text-green-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          >
            {t("clearDashboardScope")}
          </Link>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={getSearchPlaceholder()}
            className="pl-10 bg-white"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Button
            variant="outline"
            className="w-full text-green-700 border-green-100 bg-green-50 hover:bg-green-100 gap-2 md:w-auto"
            onClick={handleExport}
            disabled={table.getRowModel().rows.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t("exportData")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="relative overflow-x-auto">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}
          <table className="min-w-[900px] w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-6 py-4 font-medium",
                        (header.column.columnDef.meta as any)?.align === "right"
                          ? "text-right"
                          : "",
                      )}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        className={cn(
                          "flex items-center gap-1 text-left disabled:cursor-default",
                          (header.column.columnDef.meta as any)?.align ===
                            "right"
                            ? "justify-end"
                            : "",
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={currentColumns.length}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {!isLoading && t("noData")}
                    {isLoading && common("loading")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-4 sm:px-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
            {common("previous")}
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">
              {common("pageOf", {
                page: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount() || 1,
              })}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {common("next")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- User Orders Component (Client + Provider) ---

// Map backend statuses to frontend tabs
const ORDER_TABS = [
  "All",
  "Spending",
  "Active",
  "Awaiting",
  "In-progress",
  "Completed",
  "Declined",
];

// Helper to map tab name to backend status for API call
// Returns undefined (no filter) or a comma-separated status string
const getStatusFromTab = (tab: string): string | undefined => {
  switch (tab) {
    case "Active":
      return "PENDING,AWAITING,IN_PROGRESS";
    case "Awaiting":
      return "PENDING,AWAITING"; // New orders start as PENDING, then move to AWAITING
    case "In-progress":
      return "IN_PROGRESS";
    case "Completed":
      return "COMPLETED";
    case "Declined":
      return "DECLINED,REFUNDED";
    default:
      return undefined;
  }
};

function UserOrdersList({ role }: { role: "USER" | "SERVICE_PROVIDER" }) {
  const t = useTranslations("Orders");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboardSource = searchParams.get("source") === "dashboard";
  const marketId = searchParams.get("marketId") || undefined;
  const paidOnly = searchParams.get("paidOnly") === "true";
  const spendingOnly = searchParams.get("spendingOnly") === "true";
  const completedHistory = searchParams.get("completedHistory") === "true";
  const createdMonth = searchParams.get("createdMonth") || undefined;
  const requestedPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const isDashboardScope =
    dashboardSource ||
    paidOnly ||
    spendingOnly ||
    completedHistory ||
    Boolean(createdMonth);
  const markets = useMarketStore((state) => state.markets);
  const selectedMarketCode = useMarketStore((state) => state.selectedCode);
  const currentUser = useAuthStore((state) => state.user);
  const dashboardSpendingMarketId =
    selectedMarketCode === "GLOBAL"
      ? currentUser?.selectedMarketId ||
        currentUser?.homeMarketId ||
        markets[0]?.id
      : markets.find((market) => market.code === selectedMarketCode)?.id;
  const effectiveMarketId =
    role === "SERVICE_PROVIDER"
      ? marketId
      : isDashboardScope
        ? spendingOnly
          ? marketId || dashboardSpendingMarketId
          : undefined
        : marketId;
  const scopedMarket = markets.find(
    (market) => market.id === effectiveMarketId,
  );
  const availableTabs = useMemo(
    () =>
      role === "USER"
        ? ORDER_TABS
        : ORDER_TABS.filter((tab) => tab !== "Spending"),
    [role],
  );
  const initialTab = searchParams.get("tab");
  const defaultTab = availableTabs.includes(initialTab || "")
    ? initialTab!
    : "Awaiting";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState({
    page: requestedPage,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    Record<string, string | null>
  >({});
  const [chatTarget, setChatTarget] = useState<{
    id: string;
    name: string;
    avatar: string;
  } | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab && availableTabs.includes(tab) ? tab : "Awaiting");
  }, [availableTabs, searchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // Map tab to status. Special handling for "Awaiting" to include PENDING if needed
        const status =
          activeTab === "Completed" && completedHistory
            ? undefined
            : getStatusFromTab(activeTab);

        let response;
        if (role === "SERVICE_PROVIDER") {
          response = await apiService.getProviderOrders({
            status,
            page: requestedPage,
            limit: 20,
            marketId: effectiveMarketId,
            completedHistory,
            createdMonth,
          });
        } else {
          response = await apiService.getMyOrders({
            status,
            page: requestedPage,
            limit: 20,
            marketId: effectiveMarketId,
            paidOnly,
            spendingOnly,
            completedHistory,
          });
        }

        if (
          response.pagination.total > 0 &&
          requestedPage > response.pagination.pages
        ) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(response.pagination.pages));
          router.replace(`/dashboard/orders?${params.toString()}`, {
            scroll: false,
          });
          return;
        }

        setOrders(response.data);
        setOrdersPagination(response.pagination);
      } catch (error) {
        if (isSessionExpiredError(error)) return;
        console.error("Failed to fetch orders:", error);
        toast.error(t("loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [
    activeTab,
    completedHistory,
    createdMonth,
    effectiveMarketId,
    paidOnly,
    requestedPage,
    role,
    router,
    searchParams,
    spendingOnly,
    t,
  ]);

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/dashboard/orders?${params.toString()}`, { scroll: false });
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING":
      case "AWAITING":
        return { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
      case "IN_PROGRESS":
        return { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" };
      case "COMPLETED":
        return { dot: "bg-green-500", badge: "bg-green-50 text-green-700" };
      case "DECLINED":
      case "REFUNDED":
        return { dot: "bg-red-500", badge: "bg-red-50 text-red-700" };
      default:
        return { dot: "bg-gray-500", badge: "bg-gray-50 text-gray-700" };
    }
  };

  const handleOrderAction = async (
    orderId: string,
    newStatus: "IN_PROGRESS" | "COMPLETED" | "DECLINED",
  ) => {
    if (newStatus === "DECLINED" && !window.confirm(t("cancelUnpaidConfirm"))) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [orderId]: newStatus }));
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      const messages: Record<string, string> = {
        IN_PROGRESS: t("orderAccepted"),
        COMPLETED: t("markedComplete"),
        DECLINED: t("orderDeclined"),
      };
      toast.success(messages[newStatus]);
      // Remove from current list since status changed
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error: any) {
      toast.error(error?.message || t("updateFailed"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("myOrders")}</h1>
        <p className="text-gray-500 mt-1">
          {role === "SERVICE_PROVIDER"
            ? t("providerSubtitle")
            : t("clientSubtitle")}
        </p>
      </div>

      {isDashboardScope && (
        <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {role === "SERVICE_PROVIDER"
              ? createdMonth
                ? t("dashboardProviderMonthScope", {
                    market: scopedMarket
                      ? marketDisplayName(locale, scopedMarket)
                      : t("selectedMarket"),
                    month: format.dateTime(
                      new Date(`${createdMonth}-01T00:00:00Z`),
                      { month: "short", year: "numeric", timeZone: "UTC" },
                    ),
                  })
                : completedHistory
                  ? t("dashboardProviderCompletedScope", {
                      market: scopedMarket
                        ? marketDisplayName(locale, scopedMarket)
                        : t("selectedMarket"),
                    })
                  : activeTab === "Active"
                    ? t("dashboardProviderActiveScope", {
                        market: scopedMarket
                          ? marketDisplayName(locale, scopedMarket)
                          : t("selectedMarket"),
                      })
                    : t("dashboardProviderOrdersScope", {
                        market: scopedMarket
                          ? marketDisplayName(locale, scopedMarket)
                          : t("selectedMarket"),
                      })
              : spendingOnly && effectiveMarketId
              ? t("dashboardOrderScope", {
                  market: scopedMarket
                    ? marketDisplayName(locale, scopedMarket)
                    : t("selectedMarket"),
                })
              : completedHistory
                ? t("dashboardGlobalCompletedScope")
                : activeTab === "Active"
                  ? t("dashboardGlobalActiveScope")
                  : t("dashboardGlobalOrderScope")}
          </p>
          <Link
            href="/dashboard/orders"
            className="shrink-0 font-semibold text-green-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          >
            {t("clearDashboardScope")}
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", tab);
              params.set("page", "1");
              if (isDashboardScope) {
                if (role === "SERVICE_PROVIDER") {
                  params.delete("createdMonth");
                  params.delete("completedHistory");
                  if (effectiveMarketId) {
                    params.set("marketId", effectiveMarketId);
                  }
                  if (tab === "Completed") {
                    params.set("completedHistory", "true");
                  }
                } else {
                  params.delete("spendingOnly");
                  params.delete("completedHistory");
                  params.delete("marketId");
                  if (tab === "Completed") {
                    params.delete("paidOnly");
                    params.set("completedHistory", "true");
                  } else {
                    params.set("paidOnly", "true");
                    if (tab === "Spending") {
                      params.set("spendingOnly", "true");
                      if (dashboardSpendingMarketId) {
                        params.set("marketId", dashboardSpendingMarketId);
                      }
                    }
                  }
                }
              }
              router.replace(`/dashboard/orders?${params.toString()}`, {
                scroll: false,
              });
            }}
            className={cn(
              "flex-none px-4 py-1.5 text-sm font-bold rounded-full transition-all whitespace-nowrap",
              activeTab === tab
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {tab === "All"
              ? t("all")
              : tab === "Spending"
                ? t("spending")
                : tab === "Active"
                  ? t("active")
                  : tab === "Awaiting"
                    ? t("awaiting")
                    : tab === "In-progress"
                      ? t("inProgress")
                      : tab === "Completed"
                        ? t("completed")
                        : t("declined")}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const statusStyles = getStatusStyles(order.status);
            const grossPaid = Number(order.settlement?.grossAmount || 0);
            const refunded = Number(order.settlement?.refundedAmount || 0);
            const netSpend = Math.max(0, grossPaid - refunded);
            // Determine who to show: if I am provider, show client. If I am client, show provider.
            const otherParty =
              role === "SERVICE_PROVIDER"
                ? order.client
                : (order.provider ?? order.service?.provider);

            return (
              <div key={order.id} className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                {/* Row 1: User Info & Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                      {otherParty?.avatar ? (
                        <Image
                          src={otherParty.avatar}
                          alt={
                            otherParty.displayName ||
                            otherParty.firstName ||
                            t("statusUnknown")
                          }
                          fill
                          className="object-cover"
                        />
                      ) : otherParty ? (
                        <div className="flex h-full w-full items-center justify-center bg-green-700 text-xs font-bold text-white">
                          {initials(
                            otherParty.displayName ||
                              `${otherParty.firstName} ${otherParty.lastName}`,
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <span className="truncate font-bold text-gray-900">
                      {otherParty
                        ? otherParty.displayName ||
                          `${otherParty.firstName} ${otherParty.lastName}`
                        : t("statusUnknown")}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 sm:text-sm">
                    {format.dateTime(new Date(order.createdAt), "long")}
                  </span>
                </div>

                {activeTab === "Spending" && order.settlement && (
                  <dl className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">
                        {t("grossPaid")}
                      </dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {formatMoney(grossPaid, order.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">
                        {t("processedRefunds")}
                      </dt>
                      <dd className="mt-1 font-semibold text-red-700">
                        {formatMoney(refunded, order.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">
                        {t("netSpend")}
                      </dt>
                      <dd className="mt-1 font-semibold text-green-700">
                        {formatMoney(netSpend, order.currency)}
                      </dd>
                    </div>
                  </dl>
                )}

                {/* Row 2: Details & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-gray-900">
                      {t("orderId", { id: order.orderNumber })}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{order.service.title}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}
                      ></span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-xs ${statusStyles.badge}`}
                      >
                        {order.status === "IN_PROGRESS"
                          ? t("inProgress")
                          : order.status === "COMPLETED"
                            ? t("completed")
                            : order.status === "REFUNDED"
                              ? t("refunded")
                              : order.status === "DECLINED"
                                ? t("declined")
                                : t("awaiting")}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-3 [&>a]:w-full [&>a>button]:w-full [&>button]:w-full sm:[&>a]:w-auto sm:[&>a>button]:w-auto sm:[&>button]:w-auto">
                    {role === "SERVICE_PROVIDER" &&
                      (order.status === "AWAITING" ||
                        order.status === "PENDING") && (
                        <Button
                          className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[120px] rounded-lg"
                          onClick={() =>
                            handleOrderAction(order.id, "IN_PROGRESS")
                          }
                          disabled={!!actionLoading[order.id]}
                        >
                          {actionLoading[order.id] === "IN_PROGRESS" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("acceptOrder")
                          )}
                        </Button>
                      )}

                    {role === "SERVICE_PROVIDER" &&
                      order.status === "IN_PROGRESS" && (
                        <Button
                          className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[150px] rounded-lg"
                          onClick={() =>
                            handleOrderAction(order.id, "COMPLETED")
                          }
                          disabled={!!actionLoading[order.id]}
                        >
                          {actionLoading[order.id] === "COMPLETED" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("completeOrder")
                          )}
                        </Button>
                      )}

                    {order.status === "COMPLETED" &&
                      role === "USER" &&
                      !order.review &&
                      order.settlement &&
                      ["ELIGIBLE", "RESERVED", "PAID"].includes(
                        order.settlement.status,
                      ) && (
                        <Link href={`/orders/${order.id}/review`}>
                          <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[150px] rounded-lg">
                            {t("leaveReview")}
                          </Button>
                        </Link>
                      )}

                    {/* Raise Dispute — users only, completed orders */}
                    {order.status === "COMPLETED" &&
                      role === "USER" &&
                      !order.dispute &&
                      (!order.settlement ||
                        (order.settlement.status === "HELD" &&
                          !order.settlement.acceptedAt)) && (
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium rounded-lg">
                            {t("reviewDelivery")}
                          </Button>
                        </Link>
                      )}

                    {order.status === "COMPLETED" &&
                      role === "USER" &&
                      !order.dispute &&
                      (!order.settlement ||
                        (order.settlement.status === "HELD" &&
                          !order.settlement.acceptedAt)) && (
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 gap-2 font-medium rounded-lg"
                          onClick={() =>
                            setDisputeTarget({
                              orderId: order.id,
                              orderNumber: order.orderNumber,
                            })
                          }
                        >
                          <AlertTriangle className="w-4 h-4" />
                          {t("raiseDispute")}
                        </Button>
                      )}

                    {/* Decline/Cancel Logic */}
                    {(order.status === "AWAITING" ||
                      order.status === "PENDING") &&
                      role === "USER" &&
                      (order.paymentStatus === "UNPAID" ||
                        order.paymentStatus === "FAILED") && (
                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                          onClick={() =>
                            handleOrderAction(order.id, "DECLINED")
                          }
                          disabled={!!actionLoading[order.id]}
                        >
                          {actionLoading[order.id] === "DECLINED" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("cancelOrder")
                          )}
                        </Button>
                      )}

                    <Button
                      variant="outline"
                      className="text-gray-700 border-gray-200 hover:bg-gray-50 gap-2 font-medium rounded-lg"
                      onClick={() => {
                        if (!otherParty) return;
                        setChatTarget({
                          id: otherParty.id,
                          name:
                            otherParty.displayName ||
                            `${otherParty.firstName} ${otherParty.lastName}`,
                          avatar: otherParty.avatar || "",
                        });
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      {role === "SERVICE_PROVIDER"
                        ? t("messageClient")
                        : t("messageProvider")}
                    </Button>
                  </div>
                </div>

                {/* Row 3: Order Details Link */}
                <div>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center text-green-600 text-sm font-medium hover:underline gap-1"
                  >
                    {t("orderDetails")} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : isDashboardScope && ordersPagination.total === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {t("dashboardEmptyTitle")}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              {spendingOnly && effectiveMarketId
                ? t("dashboardEmptyBody", {
                    market: scopedMarket
                      ? marketDisplayName(locale, scopedMarket)
                      : t("selectedMarket"),
                  })
                : t("dashboardGlobalEmptyBody")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              >
                {t("backToDashboard")}
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              >
                {t("browseServices")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            {t("noOrdersCategory")}
          </div>
        )}
      </div>

      {!isLoading && ordersPagination.total > 0 && (
        <nav
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label={t("paginationLabel")}
        >
          <p className="text-sm text-gray-600">
            {t("showingOrders", {
              start: (ordersPagination.page - 1) * ordersPagination.limit + 1,
              end: Math.min(
                ordersPagination.page * ordersPagination.limit,
                ordersPagination.total,
              ),
              total: ordersPagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateToPage(ordersPagination.page - 1)}
              disabled={ordersPagination.page <= 1}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("previousPage")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateToPage(ordersPagination.page + 1)}
              disabled={ordersPagination.page >= ordersPagination.pages}
              className="gap-1.5"
            >
              {t("nextPage")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}

      {/* Chat Box */}
      {chatTarget && (
        <ChatBox
          isOpen={!!chatTarget}
          onClose={() => setChatTarget(null)}
          providerId={chatTarget.id}
          providerName={chatTarget.name}
          providerAvatar={chatTarget.avatar}
        />
      )}

      {disputeTarget && (
        <RaiseDisputeModal
          orderId={disputeTarget.orderId}
          orderNumber={disputeTarget.orderNumber}
          isOpen={!!disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSuccess={(dispute) => {
            setOrders((current) =>
              current.map((order) =>
                order.id === dispute.orderId
                  ? {
                      ...order,
                      dispute: { id: dispute.id, status: dispute.status },
                    }
                  : order,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();

  // Ensure we have a role, default to user if not
  const role =
    user?.role === "SERVICE_PROVIDER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN"
      ? (user.role as "SERVICE_PROVIDER" | "ADMIN" | "SUPER_ADMIN")
      : "USER";

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return <AdminOrders />;
  }

  // Cast role to "USER" | "SERVICE_PROVIDER" for UserOrdersList
  const listRole = role === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "USER";

  return <UserOrdersList role={listRole} />;
}
