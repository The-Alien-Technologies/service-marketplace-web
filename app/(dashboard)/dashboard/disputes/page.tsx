"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  Search,
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
import { exportCsv } from "@/lib/csv";

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

function HeaderLabel({
  message,
  common = false,
}: {
  message: string;
  common?: boolean;
}) {
  const t = useTranslations(common ? "Common" : "Disputes");
  return <>{t(message as never)}</>;
}

function PriorityLabel({ value }: { value: Dispute["priority"] }) {
  const t = useTranslations("Disputes");
  return (
    <>{t(value === "LOW" ? "low" : value === "MEDIUM" ? "medium" : "high")}</>
  );
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
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data =
        user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
          ? await apiService.getAdminDisputes({
              status: statusFilter || undefined,
              priority: priorityFilter || undefined,
              issueType: issueFilter || undefined,
              search: globalFilter.trim() || undefined,
            })
          : await apiService.getMyDisputes({
              status: statusFilter || undefined,
              priority: priorityFilter || undefined,
              issueType: issueFilter || undefined,
              search: globalFilter.trim() || undefined,
            });
      setDisputes(data ?? []);
    } catch {
      setDisputes([]);
    } finally {
      setIsLoading(false);
    }
  }, [globalFilter, issueFilter, priorityFilter, statusFilter, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchDisputes(), 300);
    return () => window.clearTimeout(timer);
  }, [fetchDisputes]);

  const table = useReactTable({
    data: disputes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  const handleExport = () => {
    exportCsv(
      "pavodah-disputes.csv",
      table.getRowModel().rows.map(({ original }) => ({
        id: original.id,
        orderNumber: original.order.orderNumber,
        service: original.order.service.title,
        client: `${original.client.firstName} ${original.client.lastName}`.trim(),
        provider: `${original.provider.firstName} ${original.provider.lastName}`.trim(),
        issueType: original.issueType,
        priority: original.priority,
        status: original.status,
        createdAt: original.createdAt,
      })),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
            ? t("adminSubtitle")
            : t("participantSubtitle")}
        </p>
      </div>

      {/* Server-side filters and actions */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t("search")}
            className="pl-10 bg-white"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label={t("filterStatus")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="OPEN">{t("open")}</option>
            <option value="INVESTIGATING">{t("investigating")}</option>
            <option value="RESOLVED">{t("resolved")}</option>
            <option value="CLOSED">{t("closed")}</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label={t("filterPriority")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">{t("allPriorities")}</option>
            <option value="LOW">{t("low")}</option>
            <option value="MEDIUM">{t("medium")}</option>
            <option value="HIGH">{t("high")}</option>
          </select>
          <select
            value={issueFilter}
            onChange={(event) => setIssueFilter(event.target.value)}
            aria-label={t("filterIssue")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">{t("allIssues")}</option>
            <option value="LATE_DELIVERY">{t("issueLateDelivery")}</option>
            <option value="NON_DELIVERY">{t("issueNonDelivery")}</option>
            <option value="QUALITY_ISSUE">{t("issueQuality")}</option>
            <option value="PAYMENT_DISPUTE">{t("issuePayment")}</option>
            <option value="MISCOMMUNICATION">{t("issueCommunication")}</option>
            <option value="OTHER">{t("issueOther")}</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <Button
            variant="outline"
            className="w-full text-green-700 border-green-100 bg-green-50 hover:bg-green-100 gap-2 md:w-auto"
            onClick={handleExport}
            disabled={table.getRowModel().rows.length === 0}
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
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
