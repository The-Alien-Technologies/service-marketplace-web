import assert from "node:assert/strict";
import test from "node:test";
import { mapPhotonFeature, searchLocations } from "./geocoding.ts";

const accraFeature = {
  geometry: { coordinates: [-0.1869644, 5.6037168] },
  properties: {
    osm_id: 192763,
    osm_type: "R",
    name: "Accra",
    city: "Accra",
    state: "Greater Accra Region",
    country: "Ghana",
    countrycode: "GH",
  },
};

test("Photon features map to the existing location payload", () => {
  assert.deepEqual(mapPhotonFeature(accraFeature), {
    placeId: "R:192763",
    addressName: "Accra",
    formattedAddress: "Accra, Greater Accra Region, Ghana",
    latitude: 5.6037168,
    longitude: -0.1869644,
    city: "Accra",
    state: "Greater Accra Region",
    country: "Ghana",
    postalCode: undefined,
  });
});

test("invalid Photon features are ignored", () => {
  assert.equal(mapPhotonFeature({ properties: { name: "Missing point" } }), null);
});

test("search keeps the existing Ghana and UK coverage restriction", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(
      JSON.stringify({
        features: [
          accraFeature,
          {
            geometry: { coordinates: [2.3522, 48.8566] },
            properties: {
              osm_id: 7444,
              osm_type: "R",
              name: "Paris",
              country: "France",
              countrycode: "FR",
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const results = await searchLocations("Accra");
    assert.equal(results.length, 1);
    assert.equal(results[0].addressName, "Accra");
    assert.deepEqual(
      new URL(requestedUrl).searchParams.getAll("countrycode"),
      ["GH", "GB"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
