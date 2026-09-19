"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import { Search, Filter, MoreVertical, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import { canCreateService } from "@/lib/provider-access";

const columnHelper = createColumnHelper<Service>();

export default function ServicesPage() {
  const t = useTranslations("Services");
  const common = useTranslations("Common");
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canCreate = canCreateService(user);

  const [data, setData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = isAdmin
        ? await apiService.getAdminServices({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          })
        : await apiService.getMyServices({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          });

      setData(response.services);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error(t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, pagination.pageIndex, pagination.pageSize, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await apiService.deleteService(id);
        toast.success(t("deleted"));
        await fetchServices();
      } catch (error) {
        console.error("Failed to delete service:", error);
        toast.error(t("deleteFailed"));
      }
    },
    [fetchServices, t],
  );

  const columns = useMemo(() => {
    const cols: ColumnDef<Service, any>[] = [
      columnHelper.accessor("title", {
        header: t("serviceName"),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
              {info.row.original.coverImage ? (
                <Image
                  src={info.row.original.coverImage}
                  alt={info.getValue()}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  {t("noImage")}
                </div>
              )}
            </div>
            <span className="font-medium text-gray-900">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.category?.name || t("uncategorized"), {
        id: "category",
        header: common("category"),
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
    ];

    if (isAdmin) {
      cols.push(
        columnHelper.accessor("provider", {
          header: common("provider"),
          cell: (info) => {
            const provider = info.getValue();
            return (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                  {provider?.avatar ? (
                    <Image
                      src={provider.avatar}
                      alt={provider.displayName || "Provider"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-xs">
                      {provider?.firstName?.[0] || "P"}
                    </div>
                  )}
                </div>
                <span className="font-medium text-gray-900 truncate max-w-[150px]">
                  {provider?.displayName ||
                    `${provider?.firstName || ""} ${
                      provider?.lastName || ""
                    }`.trim() ||
                    t("unknownProvider")}
                </span>
              </div>
            );
          },
        }) as any,
      );
    }

    cols.push(
      columnHelper.accessor(
        (row) => {
          const prices = row.plans?.map((p) => p.price) || [];
          return prices.length > 0 ? Math.min(...prices) : 0;
        },
        {
          id: "price",
          header: t("startingPrice"),
          cell: (info) => (
            <span className="text-gray-600">
              {formatMoney(info.getValue(), info.row.original.currency)}
            </span>
          ),
        },
      ),
      columnHelper.display({
        id: "orders",
        header: t("totalOrders"),
        cell: () => <span className="text-gray-600">0</span>, // Mock for now
      }),
      columnHelper.accessor("status", {
        header: common("status"),
        cell: (info) => {
          const status = info.getValue();
          const styles =
            status === "PUBLISHED"
              ? "bg-green-50 text-green-700 border-green-200"
              : status === "DRAFT"
                ? "bg-gray-100 text-gray-700 border-gray-200"
                : "bg-red-50 text-red-700 border-red-200";

          const label =
            status === "PUBLISHED"
              ? t("published")
              : status === "DRAFT"
                ? t("draft")
                : status
                  ? t("inactive")
                  : common("unknown");

          return (
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}
            >
              {label}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <ActionsCell service={info.row.original} onDelete={handleDelete} />
        ),
      }),
    );
    return cols;
  }, [common, handleDelete, isAdmin, t]);

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<Service, any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // This handles client side pagination if we feed all data, but for server side we need manual
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [fetchServices, user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? t("management") : t("myServices")}
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? t("adminSubtitle") : t("providerSubtitle")}
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/services/new" className="w-full sm:w-auto">
            <Button className="w-full gap-2 bg-[#15803d] text-white hover:bg-[#14532d] sm:w-auto">
              <Plus className="w-4 h-4" />
              {t("addNew")}
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder={t("search")} className="pl-10 bg-white" />
        </div>
        <Button
          variant="outline"
          className="w-full gap-2 text-gray-600 sm:w-auto"
        >
          <Filter className="w-4 h-4" />
          {t("filters")}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 font-medium whitespace-nowrap"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {isAdmin
                          ? t("noMarketplaceServices")
                          : t("noServices")}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-gray-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-center text-sm text-gray-500 sm:text-left">
                {t("resultsRange", {
                  start:
                    data.length > 0
                      ? pagination.pageIndex * pagination.pageSize + 1
                      : 0,
                  end: Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    total,
                  ),
                  total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {common("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {common("next")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ActionsCell = ({
  service,
  onDelete,
}: {
  service: Service;
  onDelete: (id: string) => void;
}) => {
  const t = useTranslations("Services");
  const common = useTranslations("Common");
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/services/${service.id}`)}
            >
              {t("viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/services/${service.id}/edit`)
              }
            >
              {common("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setShowDeleteDialog(true)}
            >
              {common("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {common("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                onDelete(service.id);
                setShowDeleteDialog(false);
              }}
            >
              {common("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
