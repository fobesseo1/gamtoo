interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation-unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
  });
}

async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResponse> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("reverse-geocode-failed");
  return response.json();
}

/** "City, district" (e.g. "Seoul, Mapo-gu", "New York City, Manhattan") —
 * `locality` from the API lands at whatever granularity is locally natural
 * for that place, which happened to match what we wanted for both a Korean
 * and a US test coordinate without any country-specific formatting rules. */
function formatLocationLabel(data: ReverseGeocodeResponse): string | null {
  const primary = data.city || data.principalSubdivision || data.countryName;
  if (!primary) return null;
  const secondary = data.locality && data.locality !== primary ? data.locality : null;
  return secondary ? `${primary}, ${secondary}` : primary;
}

/** Best-effort default for the location field: current position → reverse
 * geocode → "City, district" label. Resolves to null (never throws) on any
 * failure — denied permission, unsupported browser, network error, timeout
 * — so the field is simply left blank for the user to fill in themselves,
 * same as before this existed. */
export async function detectLocationLabel(): Promise<string | null> {
  try {
    const position = await getCurrentPosition();
    const data = await reverseGeocode(position.coords.latitude, position.coords.longitude);
    return formatLocationLabel(data);
  } catch (error) {
    console.warn("[geolocation] location detection skipped:", error);
    return null;
  }
}
