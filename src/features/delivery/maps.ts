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
