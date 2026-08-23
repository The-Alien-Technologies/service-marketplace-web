"use client";

import {
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, Loader2, MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LocationResult,
  reverseGeocodeLocation,
  searchLocations,
} from "@/lib/geocoding";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  label: string;
  placeholder: string;
  selectedHeading: string;
  selectedLocation: LocationResult | null;
  onSelect: (location: LocationResult | null) => void;
  disabled?: boolean;
  error?: string;
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Search for your area instead.";
  }
  if (error.code === error.TIMEOUT) {
    return "Finding your location took too long. Try again or search manually.";
  }
  return "We could not get your current location. Try searching for your area.";
}

export function LocationPicker({
  label,
  placeholder,
  selectedHeading,
  selectedLocation,
  onSelect,
  disabled = false,
  error,
}: LocationPickerProps) {
  const [query, setQuery] = useState(
    selectedLocation?.formattedAddress ?? "",
  );
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryCount, setRetryCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef(new Map<string, LocationResult[]>());
  const listboxId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.formattedAddress);
    }
  }, [selectedLocation]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (
      normalizedQuery.length < 3 ||
      normalizedQuery === selectedLocation?.formattedAddress
    ) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    const cachedResults = cacheRef.current.get(normalizedQuery.toLowerCase());
    if (cachedResults) {
      setResults(cachedResults);
      setHasSearched(true);
      setIsOpen(true);
      return;
    }

    setResults([]);
    setHasSearched(false);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const locations = await searchLocations(
          normalizedQuery,
          controller.signal,
        );
        cacheRef.current.set(normalizedQuery.toLowerCase(), locations);
        setResults(locations);
        setHasSearched(true);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setResults([]);
        setHasSearched(true);
        setIsOpen(true);
        setSearchError(
          requestError instanceof Error
            ? requestError.message
            : "Location search is unavailable. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retryCount, selectedLocation?.formattedAddress]);

  const selectLocation = (location: LocationResult) => {
    onSelect(location);
    setQuery(location.formattedAddress);
    setResults([]);
    setSearchError(null);
    setLocationError(null);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const clearLocation = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
    setLocationError(null);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    onSelect(null);
    setQuery(value);
    setLocationError(null);
    setIsOpen(value.trim().length >= 3);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && isOpen && results.length > 0) {
      event.preventDefault();
      selectLocation(results[activeIndex >= 0 ? activeIndex : 0]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "This browser does not support location access. Search for your area instead.",
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const location = await reverseGeocodeLocation(
            coords.latitude,
            coords.longitude,
          );
          selectLocation(location);
        } catch (requestError) {
          setLocationError(
            requestError instanceof Error
              ? requestError.message
              : "We could not identify your current address. Search for your area instead.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      (geolocationError) => {
        setLocationError(geolocationErrorMessage(geolocationError));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const showResults = isOpen && query.trim().length >= 3;
  const describedBy = [hintId, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className="space-y-3">
      <div>
        <label
          htmlFor={`${listboxId}-input`}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            id={`${listboxId}-input`}
            ref={inputRef}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => {
              if (query.trim().length >= 3) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            className="h-12 pl-10 pr-11"
          />
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
            {isSearching ? (
              <Loader2
                aria-label="Searching locations"
                className="h-4 w-4 animate-spin text-green-600"
              />
            ) : query ? (
              <button
                type="button"
                onClick={clearLocation}
                aria-label="Clear location search"
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {showResults && (
            <div
              id={listboxId}
              role="listbox"
              className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)] dark:border-gray-700 dark:bg-gray-900"
            >
              {searchError ? (
                <div
                  role="alert"
                  className="px-3 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  <p>{searchError}</p>
                  <button
                    type="button"
                    onClick={() => setRetryCount((count) => count + 1)}
                    className="mt-2 font-semibold text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-green-400"
                  >
                    Try again
                  </button>
                </div>
              ) : hasSearched && !isSearching && results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                  No matching locations in Ghana or the United Kingdom. Try a
                  city, neighbourhood, or fuller address.
                </p>
              ) : (
                results.map((location, index) => (
                  <button
                    key={location.placeId}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectLocation(location)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
                      activeIndex === index
                        ? "bg-green-50 dark:bg-green-950/40"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {location.addressName}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-gray-600 dark:text-gray-300">
                        {location.formattedAddress}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div
          id={hintId}
          className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
        >
          <span>Searches Ghana and the United Kingdom.</span>
          <span>
            Search by{" "}
            <a
              href="https://photon.komoot.io/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Photon
            </a>
            {" · "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
            >
              © OpenStreetMap contributors
            </a>
          </span>
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={disabled || isLocating}
        className="flex min-h-10 items-center rounded-md text-sm font-medium text-green-600 transition-colors hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLocating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        {isLocating ? "Finding your location..." : "Use my current location"}
      </button>

      {locationError && (
        <p role="alert" className="text-sm text-red-600">
          {locationError}
        </p>
      )}

      {selectedLocation && (
        <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950/30">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                {selectedHeading}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-green-800 dark:text-green-200">
                {selectedLocation.formattedAddress}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
