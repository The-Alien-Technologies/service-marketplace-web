"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  MoreVertical,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { apiService } from "@/lib/api";
import { Category } from "@/types/auth";
import { toast } from "react-toastify";
import { useCategoriesStore } from "@/store/categories-store";
import { useTranslations } from "next-intl";

// --- Types ---

type CategoryTableRow = {
  id: string;
  name: string;
  subCategories: number;
  activeListings: number;
  isFeatured: boolean;
  imageUrl?: string;
  displayOrder?: string;
  createdAt: string;
};

// --- Column Helpers ---

const categoryColumnHelper = createColumnHelper<CategoryTableRow>();

// --- Main Component ---

const tabs = ["Categories", "Featured"];

export default function CategoriesPage() {
  const t = useTranslations("AdminOps");
  const common = useTranslations("Common");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState("Categories");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParentCategoryId, setFormParentCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API state
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invalidateGlobalCache = useCategoriesStore(
    (state) => state.invalidateCache
  );

  const [categoriesPagination, setCategoriesPagination] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories(true, {
        search: globalFilter.trim() || undefined,
        featured: activeTab === "Featured" ? true : undefined,
      });
      setCategories(response.categories);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, globalFilter]);

  const fetchParentCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories(true);
      setParentCategories(response.categories);
    } catch {
      setParentCategories([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchCategories(), 300);
    return () => window.clearTimeout(timer);
  }, [fetchCategories]);

  useEffect(() => {
    void fetchParentCategories();
  }, [fetchParentCategories]);

  // Transform categories to table format
  const categoryTableData: CategoryTableRow[] = useMemo(() => {
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      subCategories: cat.subCategories?.length || 0,
      activeListings: cat._count?.services ?? 0,
      isFeatured: cat.featured,
      imageUrl: cat.imageUrl,
      createdAt: cat.createdAt
        ? new Date(cat.createdAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "",
    }));
  }, [categories]);

  const featuredCategories = useMemo(() => {
    return categoryTableData.map((cat, index) => ({
        ...cat,
        displayOrder: `#${index + 1}`,
      }));
  }, [categoryTableData]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormParentCategoryId("");
    setIsFeatured(false);
    setSelectedImage(null);
    setImagePreview(null);
    setIsEditMode(false);
    setEditingCategory(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error(t("categoryRequired"));
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditMode && editingCategory) {
        await apiService.updateCategory(
          editingCategory.id,
          {
            name: formName,
            description: formDescription || undefined,
            parentCategoryId: formParentCategoryId || null,
            featured: isFeatured,
          },
          selectedImage || undefined
        );
      } else {
        await apiService.createCategory(
          {
            name: formName,
            description: formDescription || undefined,
            parentCategoryId: formParentCategoryId || undefined,
            featured: isFeatured,
          },
          selectedImage || undefined
        );
      }

      setIsAddCategoryOpen(false);
      resetForm();
      fetchCategories();
      fetchParentCategories();
      invalidateGlobalCache(); // Refresh cache for other components
      toast.success(
        isEditMode
          ? "Category updated successfully!"
          : "Category created successfully!"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = useCallback(
    (category: CategoryTableRow) => {
      const fullCategory = categories.find((c) => c.id === category.id);
      if (fullCategory) {
        setEditingCategory(fullCategory);
        setFormName(fullCategory.name);
        setFormDescription(fullCategory.description || "");
        setFormParentCategoryId(fullCategory.parentCategoryId || "");
        setIsFeatured(fullCategory.featured);
        setImagePreview(fullCategory.imageUrl || null);
        setIsEditMode(true);
        setIsAddCategoryOpen(true);
      }
    },
    [categories],
  );

  // Handle delete - show confirmation modal
  const openDeleteDialog = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await apiService.deleteCategory(categoryToDelete);
      toast.success(t("categoryDeleted"));
      fetchCategories();
      fetchParentCategories();
      invalidateGlobalCache(); // Refresh cache for other components
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleRemoveFeatured = useCallback(
    async (category: CategoryTableRow) => {
      try {
        await apiService.updateCategory(category.id, { featured: false });
        toast.success(t("featuredRemoved"));
        await Promise.all([fetchCategories(), fetchParentCategories()]);
        invalidateGlobalCache();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("categoryUpdateFailed"),
        );
      }
    }, [fetchCategories, fetchParentCategories, invalidateGlobalCache, t],
  );

  // --- Column Definitions ---
  const categoryColumns = useMemo(
    () => [
      categoryColumnHelper.accessor("name", {
        header: "Category",
        cell: (info) => (
          <div className="flex items-center gap-3">
            {info.row.original.imageUrl && (
              <div className="w-8 h-8 rounded overflow-hidden bg-gray-100">
                <Image
                  src={info.row.original.imageUrl}
                  alt={info.getValue()}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <span className="font-medium text-gray-900">{info.getValue()}</span>
          </div>
        ),
      }),
      categoryColumnHelper.accessor("subCategories", {
        header: "Sub-categories",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("activeListings", {
        header: "Active listings",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("isFeatured", {
        header: "Featured",
        cell: (info) => {
          const isFeatured = info.getValue();
          return (
            <div className="flex items-center">
              {isFeatured ? (
                <div className="flex items-center justify-center w-5 h-5 bg-green-700 rounded text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="text-gray-400 font-medium text-lg ml-1">
                  —
                </span>
              )}
            </div>
          );
        },
      }),
      categoryColumnHelper.accessor("createdAt", {
        header: "Date of created",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.display({
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
                <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openDeleteDialog(row.original.id)}
                >
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: { align: "right" },
      }),
    ],
    [handleEdit]
  );

  const featuredColumns = useMemo(
    () => [
      categoryColumnHelper.accessor("name", {
        header: "Category",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("subCategories", {
        header: "Sub-categories",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("activeListings", {
        header: "Active listings",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("displayOrder", {
        header: "Display",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.accessor("createdAt", {
        header: "Date of created",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      categoryColumnHelper.display({
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
                <DropdownMenuItem
                  onClick={() => void handleRemoveFeatured(row.original)}
                >
                  Remove from Featured
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: { align: "right" },
      }),
    ],
    [handleRemoveFeatured]
  );

  // --- Table Configuration ---

  const currentData = useMemo(() => {
    switch (activeTab) {
      case "Featured":
        return featuredCategories;
      case "Categories":
      default:
        return categoryTableData;
    }
  }, [activeTab, categoryTableData, featuredCategories]);

  const currentColumns = useMemo(() => {
    switch (activeTab) {
      case "Featured":
        return featuredColumns;
      case "Categories":
      default:
        return categoryColumns;
    }
  }, [activeTab, categoryColumns, featuredColumns]);

  const table = useReactTable({
    data: currentData,
    columns: currentColumns as ColumnDef<CategoryTableRow, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: categoriesPagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setCategoriesPagination,
  });

  const getAddButtonText = () => {
    if (activeTab === "Featured") return t("addFeatured");
    return t("addCategory");
  };

  // Get parent category options (exclude current category if editing)
  const parentCategoryOptions = parentCategories.filter(
    (cat) => !editingCategory || cat.id !== editingCategory.id
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("categoryTitle")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("categorySubtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex w-full items-center gap-2 overflow-x-auto rounded-lg bg-gray-100/50 p-1 sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setGlobalFilter(""); // Reset filter on tab change
                setSorting([]); // Reset sorting on tab change
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
            >
              {tab === "Categories" ? t("categories") : t("featured")}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t("searchCategories")}
            className="pl-10 bg-white"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Button
            className="w-full gap-2 bg-green-700 text-white hover:bg-green-800 sm:w-auto"
            onClick={() => {
              if (activeTab === "Categories") {
                resetForm();
                setIsAddCategoryOpen(true);
              } else {
                resetForm();
                setIsFeatured(true);
                setIsAddCategoryOpen(true);
              }
            }}
          >
            <Plus className="w-4 h-4" />
            {getAddButtonText()}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        /* Table */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[720px] w-full text-sm text-left">
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
                          : ""
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
                            : ""
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
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
                  total: table.getPageCount(),
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
      )}

      {/* Add/Edit Category Sheet */}
      <Sheet
        open={isAddCategoryOpen}
        onOpenChange={(open) => {
          setIsAddCategoryOpen(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="sm:max-w-[500px] p-0">
          <SheetHeader className="px-6 py-6 border-b border-gray-100">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? t("editCategory") : t("addCategoryTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Category Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("categoryImage")}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
              >
                {imagePreview ? (
                  <div className="relative w-24 h-24">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {t("uploadImage")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      SVG, PNG, JPG (max 5MB)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* Category Name */}
            <div className="space-y-2">
              <label
                htmlFor="category-name"
                className="text-sm font-medium text-gray-700"
              >
                {t("categoryName")}
              </label>
              <Input
                id="category-name"
                placeholder={t("categoryNamePlaceholder")}
                className="bg-white"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                {common("description")}
              </label>
              <textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                className="flex min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <label
                htmlFor="parent-category"
                className="text-sm font-medium text-gray-700"
              >
                {t("parentCategory")} ({common("optional")})
              </label>
              <div className="relative">
                <select
                  id="parent-category"
                  className="flex h-10 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formParentCategoryId}
                  onChange={(e) => setFormParentCategoryId(e.target.value)}
                >
                  <option value="">{t("selectOption")}</option>
                  {parentCategoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-3 h-4 w-4 rotate-90 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="featured-toggle"
                className="text-sm font-medium text-gray-900"
              >
                {t("featured")}
              </label>
              <button
                id="featured-toggle"
                type="button"
                role="switch"
                aria-checked={isFeatured}
                onClick={() => setIsFeatured(!isFeatured)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2",
                  isFeatured ? "bg-green-600" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isFeatured ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          <SheetFooter className="px-6 py-6 border-t border-gray-100 sm:justify-between w-full bg-white mt-auto">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsAddCategoryOpen(false)}
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-11"
                disabled={isSubmitting}
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex-1 bg-green-800 hover:bg-green-900 text-white h-11"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditMode ? "Update" : "Save"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center">
                Delete Category
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-2">
                Are you sure you want to delete this category? This action
                cannot be undone.
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
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
