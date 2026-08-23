"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/ui/location-picker";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { LocationResult } from "@/lib/geocoding";
import { toast } from "react-toastify";

export function OnboardingLocationForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>();
  const { nextUserStep } = useAuthStore();

  const handleLocationChange = (location: LocationResult | null) => {
    setSelectedLocation(location);
    setValidationError(undefined);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLocation) {
      setValidationError("Select a location before continuing.");
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateLocation({
        ...selectedLocation,
        isPrimary: true,
      });
      toast.success("Location saved successfully!");
      nextUserStep();
    } catch (error) {
      console.error("Failed to save location:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save location",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
          Let&apos;s finish setting up your account
        </h1>
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Location set-up
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We&apos;ll use your location to show services and providers near you.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <LocationPicker
          label="Where are you located?"
          placeholder="Enter a city, area, or address"
          selectedHeading="Location selected"
          selectedLocation={selectedLocation}
          onSelect={handleLocationChange}
          disabled={isSaving}
          error={validationError}
        />

        <button
          type="button"
          onClick={nextUserStep}
          className="flex min-h-10 items-center rounded-md text-sm text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" />
          Skip for now
        </button>

        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>You can update this anytime in Settings.</span>
        </div>

        <Button
          type="submit"
          disabled={isSaving || !selectedLocation}
          className="h-12 w-full bg-green-600 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving location...
            </>
          ) : selectedLocation ? (
            "Continue"
          ) : (
            "Select a location"
          )}
        </Button>
      </form>
    </div>
  );
}
