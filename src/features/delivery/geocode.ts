import "server-only";

const cache = new Map<string, { latitude: number; longitude: number } | null>();

/**
 * Geocodes a free-text address via Nominatim (OpenStreetMap), free and keyless.
 * Results are cached in memory per server instance to respect Nominatim's 1 req/s policy.
 */
export async function geocodeAddress(
  query: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  if (!query) return null;
  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NenosFood/1.0 (contato@nenosfood.com.br)",
        "Accept-Language": "pt-BR",
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const result = results[0]
      ? { latitude: Number(results[0].lat), longitude: Number(results[0].lon) }
      : null;
    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, null);
    return null;
  }
}
