"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect, useCallback } from "react";
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
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { QuoteRequest, QuoteStatus } from "@/types/quote";

// --- Column Definitions ---

const columnHelper = createColumnHelper<QuoteRequest>();

const STATUS_LABEL_MAP: Record<QuoteStatus, string> = {
  NEW: "New Request",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const columns = [
  columnHelper.accessor("client", {
    header: "Name",
    cell: (info) => {
      const client = info.getValue();
      const name = `${client.firstName} ${client.lastName}`;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
            {client.avatar ? (
              <Image
                src={client.avatar}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium uppercase text-sm">
                {client.firstName?.charAt(0)}
              </span>
            )}
          </div>
          <span className="font-medium text-gray-900">{name}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("projectTitle", {
    header: "Project title",
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => column.toggleSorting()}
      >
        Status
        <ArrowDown className="w-4 h-4 text-gray-500" />
      </div>
    ),
    cell: (info) => {
      const status = info.getValue();
      const label = STATUS_LABEL_MAP[status] ?? status;
      let badgeStyles = "bg-gray-50 text-gray-700 border-gray-200";
      let dotStyles = "bg-gray-500";
      switch (status) {
        case "NEW":
          badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
          dotStyles = "bg-blue-500";
          break;
        case "ACCEPTED":
          badgeStyles = "bg-green-50 text-green-700 border-green-200";
          dotStyles = "bg-green-500";
          break;
        case "PENDING":
          badgeStyles = "bg-orange-50 text-orange-700 border-orange-200";
          dotStyles = "bg-orange-500";
          break;
        case "DECLINED":
          badgeStyles = "bg-red-50 text-red-700 border-red-200";
          dotStyles = "bg-red-500";
          break;
        case "EXPIRED":
          badgeStyles = "bg-gray-100 text-gray-700 border-gray-200";
          dotStyles = "bg-gray-500";
          break;
      }
      return (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles}`} />
          {label}
        </div>
      );
    },
  }),
  columnHelper.accessor("budget", {
    header: "Budget(GHS)",
    cell: (info) => (
      <span className="text-gray-600">
        {Number(info.getValue()).toLocaleString()}
      </span>
    ),
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: (info) => (
      <Link
        href={`/dashboard/quotes/${info.row.original.id}`}
        className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 transition-colors justify-end"
      >
        View details
        <ArrowRight className="w-4 h-4" />
      </Link>
    ),
    meta: { align: "right" },
  }),
];

const tabs: { label: string; value: string | null }[] = [
  { label: "All request", value: null },
  { label: "New Request", value: "NEW" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Expired", value: "EXPIRED" },
];

export default function QuoteRequestsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getProviderQuotes(activeTab ?? undefined);
      setQuotes(data);
    } catch (err) {
      console.error("Failed to load quote requests", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const table = useReactTable({
    data: quotes,
    columns: columns as ColumnDef<unknown, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>
          <p className="text-gray-500 mt-1">
            View, manage, and respond to client quote requests.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                activeTab === tab.value
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by client or service..."
          className="pl-10 bg-white"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-6 py-4 font-medium",
                      (header.column.columnDef.meta as { align?: string })
                        ?.align === "right"
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
                        (header.column.columnDef.meta as { align?: string })
                          ?.align === "right"
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
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <svg
                      className="w-5 h-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
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
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
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
          <span className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
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
