export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distância em linha reta (km) entre dois pontos — fórmula de haversine. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Ordena paradas pela heurística do vizinho mais próximo, começando na
 * posição atual do entregador. Não é o ótimo global (TSP exato), mas dá uma
 * rota boa o suficiente pra até 3 paradas sem precisar de API de rotas paga.
 */
export function orderStopsByNearestNeighbor<T extends GeoPoint>(
  start: GeoPoint,
  stops: T[]
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current: GeoPoint = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((stop, index) => {
      const distance = haversineDistanceKm(current, stop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}
