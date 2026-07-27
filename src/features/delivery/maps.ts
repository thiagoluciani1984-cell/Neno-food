export function formatAddressForMaps(
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zip?: string;
  } | null
): string | null {
  if (!address) return null;
  return `${address.street}, ${address.number}, ${address.district}, ${address.city}, ${address.state}, Brasil`;
}

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirectionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function mapsCoordsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function openStreetMapEmbedUrl(lat: number, lng: number): string {
  const pad = 0.01;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/**
 * Rota com múltiplas paradas: a última entrada é o destino final, as
 * anteriores viram waypoints — Google Maps navega turn-by-turn por todas.
 */
export function mapsMultiStopUrl(stopsInVisitOrder: string[]): string {
  if (stopsInVisitOrder.length === 0) return "";

  const destination = stopsInVisitOrder[stopsInVisitOrder.length - 1];
  const waypoints = stopsInVisitOrder.slice(0, -1);

  const params = new URLSearchParams({ api: "1", destination });
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
