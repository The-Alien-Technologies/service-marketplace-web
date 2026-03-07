"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";

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

const columnHelper = createColumnHelper<Service>();

export default function ServicesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  const columns = useMemo(() => {
    const cols: ColumnDef<Service, any>[] = [
      columnHelper.accessor("title", {
        header: "Service Name",
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
                  No Img
                </div>
              )}
            </div>
            <span className="font-medium text-gray-900">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.category?.name || "Uncategorized", {
        id: "category",
        header: "Category",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
    ];

    if (isAdmin) {
      cols.push(
        columnHelper.accessor("provider", {
          header: "Provider",
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
                    "Unknown Provider"}
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
          header: "Starting Price",
          cell: (info) => (
            <span className="text-gray-600">
              GHS {info.getValue().toFixed(2)}
            </span>
          ),
        },
      ),
      columnHelper.display({
        id: "orders",
        header: "Total Orders",
        cell: () => <span className="text-gray-600">0</span>, // Mock for now
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const styles =
            status === "PUBLISHED"
              ? "bg-green-50 text-green-700 border-green-200"
              : status === "DRAFT"
                ? "bg-gray-100 text-gray-700 border-gray-200"
                : "bg-red-50 text-red-700 border-red-200";

          const label = status
            ? status.charAt(0) + status.slice(1).toLowerCase()
            : "Unknown";

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
  }, [isAdmin]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      let response;
      if (isAdmin) {
        response = await apiService.getAdminServices({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
      } else {
        response = await apiService.getMyServices({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
      }

      setData(response.services);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteService(id);
      toast.success("Service deleted successfully");
      fetchServices(); // Refresh list
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
    }
  };

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
  }, [pagination.pageIndex, pagination.pageSize, user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "Service Management" : "My Services"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin
              ? "Oversee all marketplace services."
              : "Manage your services, track performance, and update offerings."}
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="bg-[#15803d] hover:bg-[#14532d] text-white gap-2">
            <Plus className="w-4 h-4" />
            Add new service
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search services..." className="pl-10 bg-white" />
        </div>
        <Button variant="outline" className="gap-2 text-gray-600">
          <Filter className="w-4 h-4" />
          Filters
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
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 font-medium">
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
                      No services found. Create your first service to get
                      started!
                    </td>
                  </tr>
                ) : (
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
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Showing{" "}
                {data.length > 0
                  ? pagination.pageIndex * pagination.pageSize + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  total,
                )}{" "}
                of {total} results
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
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
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/services/${service.id}/edit`)
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                onDelete(service.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
