import { describe, it, expect, vi, afterEach } from "vitest";
import { orderStopsByRoadDistance } from "./routing";

const start = { latitude: 0, longitude: 0 };
const stops = [
  { id: "a", latitude: 1, longitude: 1 },
  { id: "b", latitude: 2, longitude: 2 },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("orderStopsByRoadDistance", () => {
  it("lista de 0 ou 1 parada não chama a API — retorna direto", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await orderStopsByRoadDistance(start, [])).toEqual([]);
    expect(await orderStopsByRoadDistance(start, [stops[0]])).toEqual([stops[0]]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reordena as paradas conforme o waypoint_index do OSRM", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "Ok",
          waypoints: [
            { waypoint_index: 0 }, // ponto de partida
            { waypoint_index: 2 }, // stops[0] ("a") é visitado por último
            { waypoint_index: 1 }, // stops[1] ("b") é visitado primeiro
          ],
        }),
      })
    );

    const ordered = await orderStopsByRoadDistance(start, stops);
    expect(ordered.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("cai pro cálculo local (linha reta) se o OSRM falhar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const ordered = await orderStopsByRoadDistance(start, stops);
    // fallback local: "a" (1,1) está mais perto da origem (0,0) que "b" (2,2)
    expect(ordered.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("cai pro cálculo local se o OSRM responder com http de erro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const ordered = await orderStopsByRoadDistance(start, stops);
    expect(ordered.map((s) => s.id)).toEqual(["a", "b"]);
  });
});
