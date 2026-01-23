"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Upload, X, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";
import { useCategoriesStore } from "@/store/categories-store";

type Plan = {
  id: string;
  title: string;
  price: string;
  inclusions: string;
  isPopular: boolean;
  isExpanded: boolean;
};

type Addon = {
  id: string;
  title: string;
  description: string;
  price: string;
  isSelected: boolean;
};

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;
  const { categories, fetchCategories } = useCategoriesStore();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch service data and categories on mount
  useEffect(() => {
    fetchCategories();

    const fetchServiceData = async () => {
      if (!serviceId) return;

      try {
        setIsLoading(true);
        const service = await apiService.getService(serviceId);

        // Populate form fields
        setTitle(service.title);
        setCategoryId(service.categoryId);
        setOverview(service.overview);
        setTags(service.tags || []);

        // Set cover image preview
        if (service.coverImage) {
          setCoverImagePreview(service.coverImage);
        }

        // Convert plans to local format
        if (service.plans && service.plans.length > 0) {
          setPlans(
            service.plans.map((plan, index) => ({
              id: plan.id || String(index + 1),
              title: plan.title,
              price: String(plan.price),
              inclusions: plan.inclusions,
              isPopular: plan.isPopular || false,
              isExpanded: false,
            })),
          );
        }

        // Convert addons to local format
        if (service.addons && service.addons.length > 0) {
          setAddons(
            service.addons.map((addon, index) => ({
              id: addon.id || String(index + 1),
              title: addon.title,
              description: addon.description || "",
              price: String(addon.price),
              isSelected: false,
            })),
          );
          setShowAddons(true);
        }

        // Set existing portfolio images as previews
        if (service.images && service.images.length > 0) {
          setPortfolioImagePreviews(service.images.map((img) => img.url));
        }
      } catch (error) {
        console.error("Failed to fetch service:", error);
        toast.error("Failed to load service data");
        router.push("/dashboard/services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId, fetchCategories, router]);

  // Service data state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [overview, setOverview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // File uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioImagePreviews, setPortfolioImagePreviews] = useState<
    string[]
  >([]);

  // Loading state
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);

  const [addons, setAddons] = useState<Addon[]>([]);

  const [showAddons, setShowAddons] = useState(true);

  const togglePlanExpansion = (id: string) => {
    setPlans(
      plans.map((p) => (p.id === id ? { ...p, isExpanded: !p.isExpanded } : p)),
    );
  };

  const updatePlan = (id: string, field: keyof Plan, value: any) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addPlan = () => {
    if (plans.length >= 5) {
      toast.error("Maximum 5 pricing plans allowed");
      return;
    }
    const newId = (plans.length + 1).toString();
    setPlans([
      ...plans.map((p) => ({ ...p, isExpanded: false })), // Collapse others
      {
        id: newId,
        title: "",
        price: "",
        inclusions: "",
        isPopular: false,
        isExpanded: true,
      },
    ]);
  };

  const removePlan = (id: string) => {
    if (plans.length <= 1) {
      toast.error("You must have at least one pricing plan");
      return;
    }
    const updatedPlans = plans.filter((p) => p.id !== id);
    // If the deleted plan was expanded, expand the first plan
    const deletedPlan = plans.find((p) => p.id === id);
    if (deletedPlan?.isExpanded && updatedPlans.length > 0) {
      updatedPlans[0].isExpanded = true;
    }
    setPlans(updatedPlans);
    toast.success("Plan removed successfully");
  };

  const updateAddon = (id: string, field: keyof Addon, value: any) => {
    setAddons(addons.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const addAddon = () => {
    const newId = (addons.length + 1).toString();
    setAddons([
      ...addons,
      {
        id: newId,
        title: "",
        description: "",
        price: "",
        isSelected: false,
      },
    ]);
  };

  const removeAddon = (id: string) => {
    setAddons(addons.filter((a) => a.id !== id));
  };

  // File upload handlers
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 total images
    const remainingSlots = 10 - portfolioImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(
        `Maximum 10 images allowed. Only ${remainingSlots} images will be added.`,
      );
    }

    setPortfolioImages([...portfolioImages, ...filesToAdd]);

    // Generate previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
    setPortfolioImagePreviews(
      portfolioImagePreviews.filter((_, i) => i !== index),
    );
  };

  // Tag management
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Submit handler
  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a service title");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!overview.trim()) {
      toast.error("Please enter an overview");
      return;
    }
    if (plans.length === 0) {
      toast.error("Please add at least one pricing plan");
      return;
    }

    // Check if all plans have required fields
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      if (!plan.title.trim()) {
        toast.error(`Plan ${i + 1}: Please add a plan title`);
        return;
      }
      if (!plan.price || Number.parseFloat(plan.price) <= 0) {
        toast.error(
          `Plan ${i + 1} ("${plan.title}"): Please add a valid price`,
        );
        return;
      }
      if (!plan.inclusions.trim()) {
        toast.error(
          `Plan ${i + 1} ("${
            plan.title
          }"): Please add plan inclusions (what's included)`,
        );
        return;
      }
    }

    try {
      if (status === "DRAFT") {
        setIsDraftSaving(true);
      } else {
        setIsPublishing(true);
      }

      // Prepare data
      const serviceData = {
        title,
        categoryId,
        overview,
        tags,
        plans: plans.map((plan, index) => ({
          title: plan.title,
          price: Number.parseFloat(plan.price),
          inclusions: plan.inclusions,
          isPopular: plan.isPopular,
          sortOrder: index,
        })),
        addons: showAddons
          ? addons
              .filter((addon) => addon.title.trim() && addon.price)
              .map((addon) => ({
                title: addon.title,
                description: addon.description,
                price: Number.parseFloat(addon.price),
              }))
          : [],
      };

      // Update service
      const service = await apiService.updateService(
        serviceId,
        serviceData,
        coverImage || undefined,
      );

      toast.success("Service updated successfully!");

      // Upload portfolio images if any
      if (portfolioImages.length > 0) {
        try {
          await apiService.uploadServiceImages(service.id, portfolioImages);
          toast.success(
            `${portfolioImages.length} new portfolio image(s) uploaded!`,
          );
        } catch (error) {
          console.error("Failed to upload portfolio images:", error);
          toast.warning(
            "Service updated but some portfolio images failed to upload",
          );
        }
      }

      // If user wants to publish, update status
      if (status === "PUBLISHED") {
        await apiService.updateServiceStatus(service.id, "PUBLISHED");
        toast.success("Service published!");
      }

      // Redirect to services list
      router.push("/dashboard/services");
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast.error(error?.message || "Failed to update service");
    } finally {
      setIsDraftSaving(false);
      setIsPublishing(false);
    }
  };

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
          <span className="text-gray-900 font-medium">
            {title || "Edit Service"}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
            <p className="text-gray-500 mt-1">
              Update your service details and pricing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Service Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Cover Image */}
          <div className="space-y-4">
            <span
              className="block text-sm font-semibold text-gray-900"
              id="cover-image-label"
            >
              Cover image
            </span>
            <input
              type="file"
              id="cover-image-input"
              accept="image/*"
              className="hidden"
              onChange={handleCoverImageChange}
            />
            <label
              htmlFor="cover-image-input"
              aria-labelledby="cover-image-label"
              className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group cursor-pointer hover:bg-gray-50 transition-colors block"
            >
              {coverImagePreview ? (
                <>
                  <Image
                    src={coverImagePreview}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="bg-white/90 backdrop-blur rounded-lg px-4 py-2 text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Image
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload cover image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG (max. 5MB)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* General Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              General details
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Service title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="category-select"
                className="text-sm font-medium text-gray-700"
              >
                Service category
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category-select" className="bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose the category that best describes your service.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="overview"
                className="text-sm font-medium text-gray-700"
              >
                Overview
              </label>
              <Textarea
                id="overview"
                className="min-h-[200px] bg-white leading-relaxed resize-none"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-400">
                  {overview.length}/500
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 group cursor-default"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hidden group-hover:block hover:text-red-600"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder="Add tag..."
                    className="text-xs h-7 w-24"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="text-xs text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 rounded-full px-3 py-1 flex items-center gap-1 hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Catalogue */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Catalogue</h2>
            <p className="text-sm text-gray-500 -mt-2">
              Upload your best work to impress clients. (Max 10 images)
            </p>

            <input
              type="file"
              id="portfolio-images-input"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePortfolioImagesChange}
            />
            <label
              htmlFor="portfolio-images-input"
              className="w-full border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer block"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-green-700">
                Click to upload{" "}
                <span className="text-gray-500 font-normal">
                  or drag and drop
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG (max. 5MB each)
              </p>
            </label>

            {portfolioImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {portfolioImagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <Image
                      src={preview}
                      alt={`Portfolio image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(index)}
                        className="w-6 h-6 rounded-full bg-white/90 text-gray-600 flex items-center justify-center hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Pricing Plans */}
        <div className="lg:col-span-5 space-y-8">
          {/* Pricing Plans Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pricing plans
              </h2>
              <p className="text-sm text-gray-500">
                Break down your service into simple, clear plans that showcase
                your value. (Max 5 plans)
              </p>
            </div>

            {/* Suggested Examples */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">
                💡 Suggested plan names:
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-blue-700">
                <span className="bg-white px-2 py-1 rounded">
                  Basic / Standard / Premium
                </span>
                <span className="bg-white px-2 py-1 rounded">
                  Starter / Professional / Enterprise
                </span>
                <span className="bg-white px-2 py-1 rounded">
                  Bronze / Silver / Gold
                </span>
                <span className="bg-white px-2 py-1 rounded">
                  Quick / Standard / Deluxe
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "bg-white rounded-xl border transition-all duration-200",
                    plan.isExpanded
                      ? "border-gray-200 shadow-sm"
                      : "border-transparent hover:border-gray-200",
                  )}
                >
                  {/* Header/Summary View */}
                  <button
                    type="button"
                    onClick={() => togglePlanExpansion(plan.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-xl text-left",
                      plan.isExpanded && "border-b border-gray-100",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          plan.isExpanded
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400",
                        )}
                      >
                        <BoxIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {plan.title || "Untitled Plan"}
                        </h3>
                        {!plan.isExpanded && plan.price && (
                          <p className="text-xs text-gray-500">
                            GHS {plan.price}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.isPopular && !plan.isExpanded && (
                        <span className="bg-green-50 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      {plan.isExpanded ? (
                        <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-200" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {plan.isExpanded && (
                    <div className="p-4 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.isPopular}
                            onCheckedChange={(checked) =>
                              updatePlan(plan.id, "isPopular", checked)
                            }
                            id={`popular-${plan.id}`}
                          />
                          <label
                            htmlFor={`popular-${plan.id}`}
                            className="text-sm text-gray-600 cursor-pointer"
                          >
                            Mark as popular
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`plan-title-${plan.id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Plan title
                        </label>
                        <Input
                          id={`plan-title-${plan.id}`}
                          value={plan.title}
                          onChange={(e) =>
                            updatePlan(plan.id, "title", e.target.value)
                          }
                          className="bg-white"
                          placeholder="e.g., Basic Plan, Quick Service, Starter Package"
                          maxLength={50}
                        />
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">
                            Use clear, descriptive names
                          </span>
                          <span className="text-xs text-gray-400">
                            {plan.title.length}/50
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`plan-price-${plan.id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Price
                        </label>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 px-3 bg-gray-50 border-r border-gray-200 rounded-l-md flex items-center">
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                              GHS
                            </span>
                          </div>
                          <Input
                            id={`plan-price-${plan.id}`}
                            value={plan.price}
                            onChange={(e) =>
                              updatePlan(plan.id, "price", e.target.value)
                            }
                            className="pl-20 bg-white"
                            type="number"
                            placeholder="50.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`plan-inclusions-${plan.id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Plan inclusions
                        </label>
                        <Textarea
                          id={`plan-inclusions-${plan.id}`}
                          value={plan.inclusions}
                          onChange={(e) =>
                            updatePlan(plan.id, "inclusions", e.target.value)
                          }
                          className="min-h-[120px] bg-white resize-none text-sm"
                          placeholder="• 1-hour consultation\n• 2 revisions included\n• Delivery within 3 days\n• Email support"
                        />
                        <p className="text-xs text-gray-400">
                          List what's included in this plan (one item per line)
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        {plans.length > 1 && (
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => removePlan(plan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => togglePlanExpansion(plan.id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-[#15803d] hover:bg-[#14532d] text-white"
                          onClick={() => togglePlanExpansion(plan.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addPlan}
                disabled={plans.length >= 5}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors pl-1",
                  plans.length >= 5
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#15803d] hover:text-[#14532d] cursor-pointer",
                )}
              >
                <Plus className="w-4 h-4" />
                {plans.length >= 5
                  ? "Maximum plans reached"
                  : "Add another plan"}
              </button>
            </div>
          </div>

          {/* Add-ons Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  Add-ons{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Give clients more flexibility with optional upgrades.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Switch checked={showAddons} onCheckedChange={setShowAddons} />
              </div>
            </div>

            {showAddons && (
              <div className="space-y-4">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4"
                  >
                    {/* Using a simplified view similar to plans - always expanded for demo per image, 
                               but ideally would be collapsible too. Image shows it expanded. */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-2">
                      <Plus className="w-4 h-4 rotate-45" />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`addon-title-${addon.id}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Title
                      </label>
                      <Input
                        id={`addon-title-${addon.id}`}
                        value={addon.title}
                        onChange={(e) =>
                          updateAddon(addon.id, "title", e.target.value)
                        }
                        className="bg-white"
                        placeholder="e.g., Express Delivery, Extra Revision, Priority Support"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`addon-desc-${addon.id}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Short description{" "}
                        <span className="text-gray-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <Input
                        id={`addon-desc-${addon.id}`}
                        value={addon.description}
                        onChange={(e) =>
                          updateAddon(addon.id, "description", e.target.value)
                        }
                        className="bg-white"
                        placeholder="Brief description of what this add-on provides"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`addon-price-${addon.id}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Price
                      </label>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 px-3 bg-gray-50 border-r border-gray-200 rounded-l-md flex items-center">
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            GHS
                          </span>
                        </div>
                        <Input
                          id={`addon-price-${addon.id}`}
                          value={addon.price}
                          onChange={(e) =>
                            updateAddon(addon.id, "price", e.target.value)
                          }
                          className="pl-20 bg-white"
                          type="number"
                          placeholder="25.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => removeAddon(addon.id)}
                      >
                        Cancel
                      </Button>
                      <Button className="flex-1 bg-[#15803d] hover:bg-[#14532d] text-white">
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addAddon}
                  className="flex items-center gap-2 text-sm font-medium text-[#15803d] hover:text-[#14532d] transition-colors pl-1"
                >
                  <Plus className="w-4 h-4" /> Add another
                </button>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-8 space-y-3">
            <Button
              variant="outline"
              className="w-full py-6 text-base font-medium"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isDraftSaving || isPublishing}
            >
              {isDraftSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save as draft"
              )}
            </Button>
            <Button
              className="w-full py-6 text-base font-medium bg-[#15803d] hover:bg-[#14532d] text-white"
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isDraftSaving || isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Box Icon component for the plan header
function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
