"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Edit, Trash2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { Service } from "@/types/service";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await apiService.getService(id);
        setService(data);
      } catch (error) {
        console.error("Failed to fetch service:", error);
        toast.error("Failed to load service details");
        router.push("/dashboard/services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiService.deleteService(id);
      toast.success("Service deleted successfully");
      router.push("/dashboard/services");
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!service) {
    return null; // Will redirect or show loading
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <Link
            href="/dashboard/services"
            className="hover:text-gray-900 transition-colors"
          >
            My services
          </Link>
          <ChevronLeft className="w-4 h-4 mx-2 rotate-180" />
          <span className="text-gray-900 font-medium">{service.title}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {service.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  service.status === "PUBLISHED"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : service.status === "DRAFT"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-red-50 text-red-700 border-red-200",
                )}
              >
                {service.status.charAt(0) +
                  service.status.slice(1).toLowerCase()}
              </span>
              <span className="text-sm text-gray-500">
                Category: {service.category?.name || "Uncategorized"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Service</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this service? This action
                    cannot be undone.
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
                      setShowDeleteDialog(false);
                      handleDelete();
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Future: Edit Button */}
            {/* <Button className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Service
            </Button> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Service Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Cover Image */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Cover Image</h2>
            <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {service.coverImage ? (
                <Image
                  src={service.coverImage}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                  No cover image
                </div>
              )}
            </div>
          </div>

          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {service.overview}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {service.tags && service.tags.length > 0 ? (
                service.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No tags added</p>
              )}
            </div>
          </div>

          {/* Gallery - If exists */}
          {service.images && service.images.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {service.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={img.url}
                      alt="Service gallery image"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Pricing Plans */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pricing Plans
            </h2>
            <div className="space-y-4">
              {service.plans && service.plans.length > 0 ? (
                service.plans.map((plan) => (
                  <div
                    key={plan.id || plan.title}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {plan.title}
                          </h3>
                          {plan.isPopular && (
                            <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-2">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        GHS {Number(plan.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Inclusions
                      </h4>
                      <ul className="space-y-2">
                        {plan.inclusions.split("\n").map((inc, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <span className="block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No pricing plans available
                </div>
              )}
            </div>
          </div>

          {/* Addons */}
          {service.addons && service.addons.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add-ons</h2>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {service.addons.map((addon) => (
                  <div
                    key={addon.id || addon.title}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {addon.title}
                      </h3>
                      {addon.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {addon.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      + GHS {Number(addon.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
