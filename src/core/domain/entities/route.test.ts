import { describe, it, expect } from "vitest";
import { haversineDistanceKm, orderStopsByNearestNeighbor } from "./route";

describe("haversineDistanceKm", () => {
  it("distância de um ponto pra ele mesmo é zero", () => {
    const p = { latitude: -9.6498, longitude: -35.7089 };
    expect(haversineDistanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it("calcula a distância aproximada entre dois pontos conhecidos (Maceió)", () => {
    // ~2km em linha reta entre dois pontos no centro de Maceió
    const a = { latitude: -9.6498, longitude: -35.7089 };
    const b = { latitude: -9.6658, longitude: -35.7350 };
    const km = haversineDistanceKm(a, b);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(4);
  });
});

describe("orderStopsByNearestNeighbor", () => {
  it("visita sempre a parada mais próxima restante primeiro", () => {
    const start = { latitude: 0, longitude: 0 };
    const far = { id: "far", latitude: 0, longitude: 10 };
    const near = { id: "near", latitude: 0, longitude: 1 };
    const middle = { id: "middle", latitude: 0, longitude: 5 };

    const ordered = orderStopsByNearestNeighbor(start, [far, middle, near]);
    expect(ordered.map((s) => s.id)).toEqual(["near", "middle", "far"]);
  });

  it("lista vazia retorna rota vazia", () => {
    expect(orderStopsByNearestNeighbor({ latitude: 0, longitude: 0 }, [])).toEqual([]);
  });

  it("uma única parada retorna ela mesma", () => {
    const stop = { id: "only", latitude: 1, longitude: 1 };
    expect(orderStopsByNearestNeighbor({ latitude: 0, longitude: 0 }, [stop])).toEqual([stop]);
  });

  it("não perde nem duplica nenhuma parada", () => {
    const start = { latitude: 0, longitude: 0 };
    const stops = [
      { id: "a", latitude: 3, longitude: 1 },
      { id: "b", latitude: -2, longitude: 4 },
      { id: "c", latitude: 1, longitude: -3 },
    ];
    const ordered = orderStopsByNearestNeighbor(start, stops);
    expect(ordered).toHaveLength(3);
    expect(new Set(ordered.map((s) => s.id))).toEqual(new Set(["a", "b", "c"]));
  });
});
