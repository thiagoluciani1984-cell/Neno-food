import "server-only";
import {
  orderStopsByNearestNeighbor,
  type GeoPoint,
} from "@/core/domain/entities/route";

const OSRM_BASE = "https://router.project-osrm.org";

interface OsrmWaypoint {
  waypoint_index: number;
}

interface OsrmTripResponse {
  code: string;
  waypoints?: OsrmWaypoint[];
}

/**
 * Ordena as paradas pela rota real de rua (OSRM, serviço público gratuito,
 * sem chave). Se o serviço falhar ou demorar, cai pro cálculo local em
 * linha reta (orderStopsByNearestNeighbor) — a feature nunca trava por
 * causa de um serviço de terceiro fora do ar.
 */
export async function orderStopsByRoadDistance<T extends GeoPoint>(
  start: GeoPoint,
  stops: T[]
): Promise<T[]> {
  if (stops.length <= 1) return stops;

  try {
    const coords = [start, ...stops]
      .map((p) => `${p.longitude},${p.latitude}`)
      .join(";");

    const url = `${OSRM_BASE}/trip/v1/driving/${coords}?roundtrip=false&source=first`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`OSRM respondeu ${res.status}`);

    const data = (await res.json()) as OsrmTripResponse;
    if (data.code !== "Ok" || !data.waypoints || data.waypoints.length !== stops.length + 1) {
      throw new Error("Resposta inesperada do OSRM");
    }

    return data.waypoints
      .slice(1)
      .map((wp, index) => ({ stop: stops[index], order: wp.waypoint_index }))
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.stop);
  } catch {
    return orderStopsByNearestNeighbor(start, stops);
  }
}
