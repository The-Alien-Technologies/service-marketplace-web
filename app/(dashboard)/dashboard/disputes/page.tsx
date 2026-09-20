"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowDown,
  Loader2,
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
import { apiService } from "@/lib/api";
import { Dispute } from "@/types/dispute";
import { useAuthStore } from "@/store/auth-store";
import { useFormatter, useTranslations } from "next-intl";

// --- Column Helper ---

const columnHelper = createColumnHelper<Dispute>();

// --- Status badge helper ---

function StatusBadge({ status }: { status: Dispute["status"] }) {
  const t = useTranslations("Disputes");
  const styles: Record<Dispute["status"], string> = {
    OPEN: "bg-red-50 text-red-700 border-red-200",
    INVESTIGATING: "bg-amber-50 text-amber-700 border-amber-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    CLOSED: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const dots: Record<Dispute["status"], string> = {
    OPEN: "bg-red-500",
    INVESTIGATING: "bg-amber-500",
    RESOLVED: "bg-green-500",
    CLOSED: "bg-gray-500",
  };
  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[status]}`} />
      {t(
        status === "OPEN"
          ? "open"
          : status === "INVESTIGATING"
            ? "investigating"
            : status === "RESOLVED"
              ? "resolved"
              : "closed",
      )}
    </div>
  );
}

function HeaderLabel({ message, common = false }: { message: string; common?: boolean }) {
  const t = useTranslations(common ? "Common" : "Disputes");
  return <>{t(message as never)}</>;
}

function PriorityLabel({ value }: { value: Dispute["priority"] }) {
  const t = useTranslations("Disputes");
  return <>{t(value === "LOW" ? "low" : value === "MEDIUM" ? "medium" : "high")}</>;
}

function IssueLabel({ value }: { value: Dispute["issueType"] }) {
  const t = useTranslations("Disputes");
  const key =
    value === "LATE_DELIVERY"
      ? "issueLateDelivery"
      : value === "NON_DELIVERY"
        ? "issueNonDelivery"
        : value === "QUALITY_ISSUE"
          ? "issueQuality"
          : value === "PAYMENT_DISPUTE"
            ? "issuePayment"
            : value === "MISCOMMUNICATION"
              ? "issueCommunication"
              : "issueOther";
  return <>{t(key)}</>;
}

function SubmittedDate({ value }: { value: string }) {
  const format = useFormatter();
  return <>{format.dateTime(new Date(value), "long")}</>;
}

function ViewDetailsLink({ id }: { id: string }) {
  const t = useTranslations("Disputes");
  return <Link href={`/dashboard/disputes/${id}`}>{t("viewDetails")}</Link>;
}

// --- Columns ---

const columns = [
  columnHelper.accessor("id", {
    header: () => <HeaderLabel message="disputeId" />,
    cell: (info) => (
      <span className="text-gray-600 font-mono text-xs">
        {info.getValue().slice(0, 8).toUpperCase()}
      </span>
    ),
  }),
  columnHelper.accessor("order.orderNumber", {
    header: () => <HeaderLabel message="order" />,
    cell: (info) => <span className="text-gray-600">#{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "parties",
    header: () => <HeaderLabel message="parties" />,
    cell: (info) => (
      <div className="flex -space-x-2">
        {[info.row.original.client, info.row.original.provider].map(
          (party, i) => {
            const firstName = party?.firstName ?? "";
            const initial = firstName.charAt(0) || "?";
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-full overflow-hidden border-2 border-white relative ${i === 0 ? "z-20" : "z-10"}`}
              >
                {party?.avatar ? (
                  <Image
                    src={party.avatar}
                    alt={firstName || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {initial}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    ),
  }),
  columnHelper.accessor("priority", {
    header: () => <HeaderLabel message="priority" />,
    cell: (info) => (
      <span className="text-gray-600">
        <PriorityLabel value={info.getValue()} />
      </span>
    ),
  }),
  columnHelper.accessor("issueType", {
    header: () => <HeaderLabel message="issueType" />,
    cell: (info) => (
      <span className="text-gray-600">
        <IssueLabel value={info.getValue()} />
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => column.toggleSorting()}
      >
        <HeaderLabel message="status" common />
        <ArrowDown className="w-4 h-4 text-gray-500" />
      </div>
    ),
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("createdAt", {
    header: () => <HeaderLabel message="submittedDate" />,
    cell: (info) => (
      <span className="text-gray-600">
        <SubmittedDate value={info.getValue()} />
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <HeaderLabel message="actions" common />,
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
              <ViewDetailsLink id={info.row.original.id} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    meta: { align: "right" },
  }),
];

// --- Main Component ---

export default function DisputesPage() {
  const t = useTranslations("Disputes");
  const common = useTranslations("Common");
  const user = useAuthStore((state) => state.user);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data =
        user?.role === "ADMIN"
          ? await apiService.getAdminDisputes()
          : await apiService.getMyDisputes();
      setDisputes(data ?? []);
    } catch {
      setDisputes([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const table = useReactTable({
    data: disputes,
    columns,
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {user?.role === "ADMIN"
            ? t("adminSubtitle")
            : t("participantSubtitle")}
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t("search")}
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
            {t("filters")}
          </Button>
          <Button
            variant="outline"
            className="text-green-700 border-green-100 bg-green-50 hover:bg-green-100 gap-2"
          >
            <Download className="w-4 h-4" />
            {t("exportData")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[820px] w-full text-sm text-left">
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
                        (header.column.columnDef.meta as any)?.align === "right"
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
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = `/dashboard/disputes/${row.original.id}`;
                  }}
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
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {t("noDisputes")}
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
              total: table.getPageCount() || 1,
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
