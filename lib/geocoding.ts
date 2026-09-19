const DEFAULT_GEOCODING_API_URL = "https://photon.komoot.io";
const SEARCH_RESULT_LIMIT = 5;
const SUPPORTED_COUNTRY_CODES = new Set(["GH", "ZA"]);

const GEOCODING_API_URL = (
  process.env.NEXT_PUBLIC_GEOCODING_API_URL || DEFAULT_GEOCODING_API_URL
).replace(/\/+$/, "");

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    county?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export interface LocationResult {
  placeId: string;
  addressName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  countryIso2?: string;
  postalCode?: string;
}

export class GeocodingError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeocodingError";
    this.status = status;
  }
}

function uniqueParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();

  return parts.filter((part): part is string => {
    const normalized = part?.trim();
    if (!normalized) return false;

    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapPhotonFeature(
  feature: PhotonFeature,
): LocationResult | null {
  const [longitude, latitude] = feature.geometry?.coordinates ?? [];
  const properties = feature.properties;

  if (
    !properties ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const streetAddress = [properties.housenumber, properties.street]
    .filter(Boolean)
    .join(" ");
  const addressName =
    properties.name ||
    streetAddress ||
    properties.city ||
    properties.district ||
    properties.state ||
    properties.country ||
    "Selected location";
  const formattedAddress = uniqueParts([
    properties.name,
    streetAddress,
    properties.district,
    properties.county,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]).join(", ");
  const providerId = [properties.osm_type, properties.osm_id]
    .filter((part) => part !== undefined && part !== "")
    .join(":");

  return {
    placeId:
      providerId ||
      `coordinates:${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`,
    addressName,
    formattedAddress: formattedAddress || addressName,
    latitude: Number(latitude),
    longitude: Number(longitude),
    city: properties.city || properties.district,
    state: properties.state,
    country: properties.country,
    countryIso2: properties.countrycode?.toUpperCase(),
    postalCode: properties.postcode,
  };
}

function isSupportedSearchResult(feature: PhotonFeature): boolean {
  const countryCode = feature.properties?.countrycode?.toUpperCase();
  return Boolean(countryCode && SUPPORTED_COUNTRY_CODES.has(countryCode));
}

async function fetchPhoton(
  path: "/api" | "/reverse",
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<PhotonFeature[]> {
  const response = await fetch(
    `${GEOCODING_API_URL}${path}?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );

  if (!response.ok) {
    const message =
      response.status === 429
        ? "Location search is busy. Wait a moment and try again."
        : "Location search is temporarily unavailable. Please try again.";
    throw new GeocodingError(message, response.status);
  }

  const payload = (await response.json()) as PhotonResponse;
  return Array.isArray(payload.features) ? payload.features : [];
}

export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<LocationResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return [];

  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: "5",
    lang: "en",
    lat: "7.9465",
    lon: "-1.0232",
  });
  params.append("countrycode", "GH");
  params.append("countrycode", "ZA");
  const features = await fetchPhoton("/api", params, signal);

  return features
    .filter(isSupportedSearchResult)
    .map(mapPhotonFeature)
    .filter((location): location is LocationResult => location !== null)
    .slice(0, SEARCH_RESULT_LIMIT);
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<LocationResult> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    limit: "1",
    lang: "en",
  });
  const [feature] = await fetchPhoton("/reverse", params, signal);
  const result = feature ? mapPhotonFeature(feature) : null;

  if (!result) {
    throw new GeocodingError(
      "We found your coordinates but could not identify the address. Search for your area instead.",
    );
  }

  return {
    ...result,
    latitude,
    longitude,
  };
}
