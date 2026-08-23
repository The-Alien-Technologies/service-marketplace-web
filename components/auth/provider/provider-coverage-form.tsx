"use client";

import { FormEvent, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/ui/location-picker";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { LocationResult } from "@/lib/geocoding";
import { toast } from "react-toastify";

export function ProviderCoverageForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>();
  const { nextProviderStep, previousProviderStep } = useAuthStore();

  const handleLocationChange = (location: LocationResult | null) => {
    setSelectedLocation(location);
    setValidationError(undefined);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLocation) {
      setValidationError("Select a service area before continuing.");
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateLocation({
        ...selectedLocation,
        isPrimary: true,
      });
      toast.success("Service area saved successfully!");
      nextProviderStep();
    } catch (error) {
      console.error("Failed to save service area:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save service area",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>5/7</span>
          <span>71%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-2 w-[71%] rounded-full bg-green-600" />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="mb-6 text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white">
          Let&apos;s finish setting up your account
        </h1>
        <div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Coverage Area
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the area where you provide services.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <LocationPicker
          label="Where do you provide services?"
          placeholder="Enter a city, area, or address"
          selectedHeading="Service area selected"
          selectedLocation={selectedLocation}
          onSelect={handleLocationChange}
          disabled={isSaving}
          error={validationError}
        />

        <div className="flex items-start gap-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This helps clients find you when they&apos;re looking for services in
            your area. You can update it anytime in Settings.
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={previousProviderStep}
            disabled={isSaving}
            className="text-gray-600 hover:text-gray-700"
          >
            Previous
          </Button>

          <Button
            type="submit"
            disabled={isSaving || !selectedLocation}
            className="bg-green-600 px-6 font-medium text-white hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : selectedLocation ? (
              "Continue"
            ) : (
              "Select a location"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
