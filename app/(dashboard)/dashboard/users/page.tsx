"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { apiService } from "@/lib/api";
import { User } from "@/types/auth";
import { toast } from "react-toastify";
import { useLocale, useTranslations } from "next-intl";
import { useMarketStore } from "@/store/market-store";
import { marketDisplayName } from "@/lib/market-display";

const columnHelper = createColumnHelper<User>();

export default function UsersPage() {
  const t = useTranslations("AdminOps");
  const common = useTranslations("Common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const dashboardSource = searchParams.get("source") === "dashboard";
  const marketId = searchParams.get("marketId") || undefined;
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const markets = useMarketStore((state) => state.markets);
  const scopedMarket = markets.find((market) => market.id === marketId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status update state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "SUSPENDED" | null>(
    null,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response = await apiService.getUsers({
          page,
          limit: pagination.limit,
          search: globalFilter || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          marketId,
          marketplaceOnly: dashboardSource,
          sortBy: sorting[0]?.id,
          orderBy: sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined,
        });
        setUsers(response.users);
        setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        });
      } catch {
        toast.error(t("usersLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [
      dashboardSource,
      globalFilter,
      marketId,
      pagination.limit,
      roleFilter,
      sorting,
      statusFilter,
      t,
    ],
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await apiService.deleteUser(userToDelete);
      toast.success(t("userDeleted"));
      fetchUsers(pagination.page);
    } catch {
      toast.error(t("userDeleteFailed"));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!userToUpdate || !newStatus) return;
    try {
      setIsUpdatingStatus(true);
      await apiService.updateUserStatus(userToUpdate.id, newStatus);
      toast.success(t("userStatusUpdated"));
      fetchUsers(pagination.page);
    } catch {
      toast.error(t("userStatusFailed"));
    } finally {
      setIsUpdatingStatus(false);
      setStatusDialogOpen(false);
      setUserToUpdate(null);
      setNewStatus(null);
    }
  };

  const openDeleteDialog = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const openStatusDialog = (user: User, status: "ACTIVE" | "SUSPENDED") => {
    setUserToUpdate(user);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.displayName || user.email.split("@")[0];
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "SERVICE_PROVIDER":
        return "Freelancer";
      case "USER":
        return "Client";
      default:
        return role;
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        id: "name",
        header: "Name",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
              {info.row.original.avatar ? (
                <Image
                  src={info.row.original.avatar}
                  alt={getUserDisplayName(info.row.original)}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                  {getUserDisplayName(info.row.original)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <span className="font-medium text-gray-900">
              {getUserDisplayName(info.row.original)}
            </span>
          </div>
        ),
        size: 250,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <span className="text-gray-600">{getRoleLabel(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("email", {
        id: "email",
        header: "Email",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();

          let badgeStyles = "bg-gray-50 text-gray-700 border-gray-200";
          let dotStyles = "bg-gray-500";

          if (status === "ACTIVE") {
            badgeStyles = "bg-green-50 text-green-700 border-green-200";
            dotStyles = "bg-green-500";
          } else if (status === "PENDING") {
            badgeStyles = "bg-amber-50 text-amber-800 border-amber-200";
            dotStyles = "bg-amber-500";
          } else if (status === "REJECTED") {
            badgeStyles = "bg-red-50 text-red-700 border-red-200";
            dotStyles = "bg-red-500";
          } else if (status === "SUSPENDED") {
            badgeStyles = "bg-orange-50 text-orange-700 border-orange-200";
            dotStyles = "bg-orange-500";
          }

          return (
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles}`}
              ></span>
              {status}
            </div>
          );
        },
      }),
      columnHelper.accessor("emailVerified", {
        header: "Verification",
        cell: (info) => {
          const isVerified = info.getValue();
          const textStyles = isVerified ? "text-green-700" : "text-orange-700";
          const label = isVerified ? "Verified" : "Pending";

          return (
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${textStyles}`}
            >
              {label}
              {isVerified ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Date of Joining",
        cell: (info) => (
          <span className="text-gray-600">
            {info.getValue()
              ? new Date(info.getValue()!).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {row.original.status === "ACTIVE" ? (
                  <DropdownMenuItem
                    className="text-orange-600"
                    onClick={() => openStatusDialog(row.original, "SUSPENDED")}
                  >
                    Suspend User
                  </DropdownMenuItem>
                ) : row.original.status === "SUSPENDED" ? (
                  <DropdownMenuItem
                    className="text-green-600"
                    onClick={() => openStatusDialog(row.original, "ACTIVE")}
                  >
                    Activate User
                  </DropdownMenuItem>
                ) : row.original.role === "SERVICE_PROVIDER" &&
                  ((row.original.status === "PENDING" &&
                    row.original.providerApplicationSubmittedAt) ||
                    row.original.status === "REJECTED") ? (
                  <DropdownMenuItem
                    className="text-green-700"
                    onClick={() => {
                      window.location.href = `/dashboard/provider-applications?application=${row.original.id}`;
                    }}
                  >
                    Review application
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openDeleteDialog(row.original.id)}
                >
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: {
          align: "right",
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("usersTitle")}</h1>
        <p className="text-gray-500">{t("usersSubtitle")}</p>
      </div>

      {dashboardSource && (
        <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t(
              roleFilter === "SERVICE_PROVIDER" && statusFilter === "ACTIVE"
                ? "dashboardActiveProvidersScope"
                : "dashboardUsersScope",
              {
                market: scopedMarket
                  ? marketDisplayName(locale, scopedMarket)
                  : t("allMarkets"),
              },
            )}
          </p>
          <Link
            href="/dashboard/users"
            className="shrink-0 font-semibold text-green-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          >
            {t("clearDashboardScope")}
          </Link>
        </div>
      )}

      {/* Server-side filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t("searchUsers")}
            className="pl-10"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label={t("filterByRole")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">{t("allRoles")}</option>
            <option value="USER">{t("clients")}</option>
            <option value="SERVICE_PROVIDER">{t("serviceProviders")}</option>
            <option value="ADMIN">{t("administrators")}</option>
            <option value="SUPER_ADMIN">{t("superAdministrators")}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label={t("filterByStatus")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="ACTIVE">{t("active")}</option>
            <option value="SUSPENDED">{t("suspended")}</option>
            <option value="PENDING">{t("pendingVerification")}</option>
            <option value="REJECTED">{t("rejected")}</option>
            <option value="DELETED">{t("deleted")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[760px] w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-6 py-4 ${
                            header.id === "name" ? "w-[250px]" : ""
                          } ${
                            (header.column.columnDef.meta as any)?.align ===
                            "right"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="flex items-center gap-1 text-left disabled:cursor-default"
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? null}
                          </button>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {t("noUsers")}
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
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-4 sm:px-6">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                {common("previous")}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-green-50 text-green-600 border-0"
                >
                  {pagination.page}
                </Button>
                <span className="text-gray-400 px-2">
                  of {pagination.totalPages || 1}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                {common("next")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center">
                {t("deleteUser")}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-2">
                {t("deleteUserBody")}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center w-full px-4 pb-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-200"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {common("cancel")}
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {common("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="flex flex-col items-center text-center p-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                newStatus === "SUSPENDED" ? "bg-orange-50" : "bg-green-50"
              }`}
            >
              {newStatus === "SUSPENDED" ? (
                <Clock className="w-6 h-6 text-orange-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center">
                {newStatus === "SUSPENDED"
                  ? t("suspendUser")
                  : t("activateUser")}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-2">
                {newStatus === "SUSPENDED"
                  ? t("suspendBody")
                  : t("activateBody")}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center w-full px-4 pb-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-200"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              {common("cancel")}
            </Button>
            <Button
              className={`flex-1 text-white ${
                newStatus === "SUSPENDED"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {newStatus === "SUSPENDED" ? t("suspend") : t("activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
