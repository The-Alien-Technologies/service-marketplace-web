"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  ArrowRight,
  Loader2,
  AlertTriangle,
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

// --- Types ---

type CashoutRequest = {
  id: string;
  provider: {
    name: string;
    avatar: string;
  };
  amount: number;
  method: string;
  status: "Completed" | "Pending" | "Failed";
  date: string;
};

// --- Mock Data for Admin ---

const cashoutRequests: CashoutRequest[] = [
  {
    id: "CSH-001",
    provider: {
      name: "Olivia Rhye",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    amount: 1000.0,
    method: "Paystack",
    status: "Completed",
    date: "15 Mar, 2025",
  },
];

// --- Column Helpers ---
const orderColumnHelper = createColumnHelper<Order>();
const transactionColumnHelper = createColumnHelper<AdminPaymentTransaction>();
const cashoutRequestColumnHelper = createColumnHelper<CashoutRequest>();

const orderColumns = [
  orderColumnHelper.accessor("orderNumber", {
    header: "Order ID",
    cell: (info) => <span className="text-gray-600">#{info.getValue()}</span>,
  }),
  orderColumnHelper.accessor("service.title", {
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
            <Image
              src={
                provider.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              }
              alt={provider.displayName || "Provider"}
              fill
              className="object-cover"
            />
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
        GHS {Number(info.getValue() || 0).toFixed(2)}
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

const cashoutRequestColumns = [
  cashoutRequestColumnHelper.accessor("id", {
    header: "Request ID",
    cell: (info) => <span className="text-gray-600">#{info.getValue()}</span>,
  }),
  cashoutRequestColumnHelper.accessor("provider.name", {
    header: "Provider",
    cell: (info) => (
      <span className="text-gray-900 font-medium">{info.getValue()}</span>
    ),
  }),
  cashoutRequestColumnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="text-gray-900">
        GHS {Number(info.getValue() || 0).toFixed(2)}
      </span>
    ),
  }),
  cashoutRequestColumnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className="text-sm px-2 py-1 bg-green-50 text-green-700 rounded-full">
        {info.getValue()}
      </span>
    ),
  }),
];

// --- Admin Orders Component ---

function AdminOrders() {
  const tabs = ["Orders", "Transactions"];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState("Orders");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  // Fetch Orders
  useEffect(() => {
    if (activeTab === "Orders") {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const result = await apiService.getAdminOrders({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: globalFilter,
          });
          setOrders(result.data);
          setPageCount(result.pagination.pages);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          toast.error("Failed to fetch orders");
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
  }, [activeTab, pagination.pageIndex, pagination.pageSize, globalFilter]);

  useEffect(() => {
    if (activeTab !== "Transactions") return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getAdminPayments({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: globalFilter,
        });
        setTransactions(result.data);
        setPageCount(result.pagination.pages);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        toast.error("Failed to fetch payments");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, pagination.pageIndex, pagination.pageSize, globalFilter]);

  const currentData = useMemo(() => {
    if (activeTab === "Cashout Request") return cashoutRequests;
    if (activeTab === "Transactions") return transactions;
    return orders;
  }, [activeTab, orders, transactions]);

  const currentColumns = useMemo(() => {
    if (activeTab === "Cashout Request") return cashoutRequestColumns;
    if (activeTab === "Transactions") return transactionColumns;
    return orderColumns;
  }, [activeTab]);

  const getSearchPlaceholder = () => {
    if (activeTab === "Cashout Request") return "search by provider...";
    if (activeTab === "Orders")
      return "search by order ID, customer or provider...";
    return "search by transaction ID, user...";
  };

  const table = useReactTable({
    data: currentData,
    columns: currentColumns as ColumnDef<unknown, any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders & Transactions
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor orders, track payments, and manage service transactions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex w-full items-center gap-2 overflow-x-auto rounded-lg bg-gray-100/50 p-1 sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setGlobalFilter("");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
        <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center md:gap-3">
          <Button
            variant="outline"
            className="text-gray-700 border-gray-200 bg-white hover:bg-gray-50 gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            className="text-green-700 border-green-100 bg-green-50 hover:bg-green-100 gap-2"
          >
            <Download className="w-4 h-4" />
            Export data
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
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1",
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
                      </div>
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
                    {!isLoading && "No data available."}
                    {isLoading && "Loading..."}
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
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- User Orders Component (Client + Provider) ---

// Map backend statuses to frontend tabs
const ORDER_TABS = ["Awaiting", "In-progress", "Completed", "Declined"];

// Helper to map tab name to backend status for API call
// Returns undefined (no filter) or a comma-separated status string
const getStatusFromTab = (tab: string): string | undefined => {
  switch (tab) {
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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const defaultTab = ORDER_TABS.includes(initialTab || "")
    ? initialTab!
    : "Awaiting";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
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
    if (tab && ORDER_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // Map tab to status. Special handling for "Awaiting" to include PENDING if needed
        const status = getStatusFromTab(activeTab);

        let response;
        if (role === "SERVICE_PROVIDER") {
          response = await apiService.getProviderOrders({ status, limit: 50 });
        } else {
          response = await apiService.getMyOrders({ status, limit: 50 });
        }

        setOrders(response.data);
      } catch (error) {
        if (isSessionExpiredError(error)) return;
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, role]);

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
    if (
      newStatus === "DECLINED" &&
      !window.confirm("Cancel this unpaid order?")
    ) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [orderId]: newStatus }));
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      const messages: Record<string, string> = {
        IN_PROGRESS: "Order accepted",
        COMPLETED: "Order marked as completed",
        DECLINED: "Order declined",
      };
      toast.success(messages[newStatus]);
      // Remove from current list since status changed
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to update order");
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">
          Stay on top of your orders to deliver great results.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-none px-4 py-1.5 text-sm font-bold rounded-full transition-all whitespace-nowrap",
              activeTab === tab
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {tab}
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
                      {otherParty ? (
                        <Image
                          src={
                            otherParty.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          }
                          alt={
                            otherParty.displayName ||
                            otherParty.firstName ||
                            "User"
                          }
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <span className="truncate font-bold text-gray-900">
                      {otherParty
                        ? otherParty.displayName ||
                          `${otherParty.firstName} ${otherParty.lastName}`
                        : "Unknown User"}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 sm:text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Row 2: Details & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-gray-900">
                      Order ID: #{order.orderNumber}
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
                        {order.status.replace("_", " ")}
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
                            "Accept Order"
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
                            "Mark as completed"
                          )}
                        </Button>
                      )}

                    {order.status === "COMPLETED" &&
                      role === "USER" &&
                      order.settlement &&
                      ["ELIGIBLE", "RESERVED", "PAID"].includes(
                        order.settlement.status,
                      ) && (
                        <Link href={`/orders/${order.id}/review`}>
                          <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium min-w-[150px] rounded-lg">
                            Leave a review
                          </Button>
                        </Link>
                      )}

                    {/* Raise Dispute — users only, completed orders */}
                    {order.status === "COMPLETED" &&
                      role === "USER" &&
                      (!order.settlement ||
                        (order.settlement.status === "HELD" &&
                          !order.settlement.acceptedAt)) && (
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium rounded-lg">
                            Review delivery
                          </Button>
                        </Link>
                      )}

                    {order.status === "COMPLETED" &&
                      role === "USER" &&
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
                          Raise Dispute
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
                            "Cancel Order"
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
                        ? "Message Client"
                        : "Message Provider"}
                    </Button>
                  </div>
                </div>

                {/* Row 3: Order Details Link */}
                <div>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center text-green-600 text-sm font-medium hover:underline gap-1"
                  >
                    Order details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500">
            No orders found in this category.
          </div>
        )}
      </div>

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
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();

  // Ensure we have a role, default to user if not
  const role =
    user?.role === "SERVICE_PROVIDER" || user?.role === "ADMIN"
      ? (user.role as "SERVICE_PROVIDER" | "ADMIN")
      : "USER";

  if (role === "ADMIN") {
    return <AdminOrders />;
  }

  // Cast role to "USER" | "SERVICE_PROVIDER" for UserOrdersList
  const listRole = role === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "USER";

  return <UserOrdersList role={listRole} />;
}
