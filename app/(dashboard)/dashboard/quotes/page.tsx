"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";

// --- Column Definitions ---

const columnHelper = createColumnHelper<QuoteRequest>();

export default function QuoteRequestsPage() {
  const t = useTranslations("Quotes");
  const common = useTranslations("Common");
  const format = useFormatter();
  const router = useRouter();
  const { user } = useAuthStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const statusLabel = useCallback(
    (status: QuoteStatus) =>
      t(
        status === "NEW"
          ? "newRequest"
          : status === "PENDING"
            ? "pending"
            : status === "ACCEPTED"
              ? "accepted"
              : status === "DECLINED"
                ? "declined"
                : "expired",
      ),
    [t],
  );
  const tabs = useMemo(
    () => [
      { label: t("allRequests"), value: null },
      { label: t("newRequest"), value: "NEW" },
      { label: t("pending"), value: "PENDING" },
      { label: t("accepted"), value: "ACCEPTED" },
      { label: t("declined"), value: "DECLINED" },
      { label: t("expired"), value: "EXPIRED" },
    ],
    [t],
  );
  const columns = useMemo(
    () => [
      columnHelper.accessor("client", {
        header: common("name"),
        cell: (info) => {
          const client = info.getValue();
          const firstName = client?.firstName ?? "";
          const lastName = client?.lastName ?? "";
          const name = `${firstName} ${lastName}`.trim() || common("unknown");
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                {client?.avatar ? (
                  <Image src={client.avatar} alt={name} fill className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium uppercase text-sm">
                    {firstName.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-900">{name}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("projectTitle", {
        header: t("projectTitle"),
        cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: ({ column }) => (
          <div className="flex cursor-pointer items-center gap-1" onClick={() => column.toggleSorting()}>
            {common("status")}
            <ArrowDown className="h-4 w-4 text-gray-500" />
          </div>
        ),
        cell: (info) => {
          const status = info.getValue();
          const styles =
            status === "NEW"
              ? ["bg-blue-50 text-blue-700 border-blue-200", "bg-blue-500"]
              : status === "ACCEPTED"
                ? ["bg-green-50 text-green-700 border-green-200", "bg-green-500"]
                : status === "PENDING"
                  ? ["bg-orange-50 text-orange-700 border-orange-200", "bg-orange-500"]
                  : status === "DECLINED"
                    ? ["bg-red-50 text-red-700 border-red-200", "bg-red-500"]
                    : ["bg-gray-100 text-gray-700 border-gray-200", "bg-gray-500"];
          return (
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[0]}`}>
              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${styles[1]}`} />
              {statusLabel(status)}
            </div>
          );
        },
      }),
      columnHelper.accessor("budget", {
        header: t("budgetGhs"),
        cell: (info) => <span className="text-gray-600">{format.number(Number(info.getValue()))}</span>,
      }),
      columnHelper.display({
        id: "action",
        header: t("action"),
        cell: (info) => (
          <Link href={`/dashboard/quotes/${info.row.original.id}`} className="flex items-center justify-end gap-1 text-sm font-medium text-green-700 transition-colors hover:text-green-800">
            {t("viewDetails")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ),
        meta: { align: "right" },
      }),
    ],
    [common, format, statusLabel, t],
  );

  // Guard: only providers can access this page
  useEffect(() => {
    if (user && user.role !== "SERVICE_PROVIDER") {
      router.replace("/dashboard/my-quotes");
    }
  }, [user, router]);

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getProviderQuotes({
        status: activeTab ?? undefined,
        search: globalFilter.trim() || undefined,
      });
      setQuotes(data);
    } catch (err) {
      console.error("Failed to load quote requests", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, globalFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchQuotes(), 300);
    return () => window.clearTimeout(timer);
  }, [fetchQuotes]);

  const table = useReactTable({
    data: quotes,
    columns: columns as ColumnDef<unknown, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("providerTitle")}</h1>
          <p className="text-gray-500 mt-1">{t("providerSubtitle")}</p>
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
          placeholder={t("searchProvider")}
          className="pl-10 bg-white"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[760px] w-full text-sm text-left">
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
                    {common("loading")}
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
                  {t("noRequests")}
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
          <span className="text-sm text-gray-600">
            {common("pageOf", {
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </span>
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
