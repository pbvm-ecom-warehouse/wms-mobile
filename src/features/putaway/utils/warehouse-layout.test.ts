import {
  buildRackRoutePoints,
  getRackAccessPoint,
  getMapViewBox,
  getRackRect,
  normalizeWarehouseLayout,
  panMapCenter,
} from "./warehouse-layout";

describe("warehouse layout normalization", () => {
  it("uses rack depth as plan height when rotation is zero", () => {
    expect(
      getRackRect({
        id: "rack-01",
        code: "RACK-01",
        xM: 3,
        yM: 4,
        widthM: 7,
        depthM: 1.8,
        rotation: 0,
      }),
    ).toEqual({ xM: 3, yM: 4, widthM: 7, heightM: 1.8 });
  });

  it("swaps rack width and depth when rotation is 90 degrees", () => {
    expect(
      getRackRect({
        id: "rack-20",
        code: "RACK-20",
        xM: 5,
        yM: 12,
        widthM: 8.5,
        depthM: 1.8,
        rotation: 90,
      }),
    ).toEqual({ xM: 5, yM: 12, widthM: 1.8, heightM: 8.5 });
  });

  it("preserves the complete layout contract returned by the API", () => {
    const layout = normalizeWarehouseLayout({
      data: {
        id: "layout-01",
        revision: 4,
        status: "PUBLISHED",
        canvas: { widthM: 36, heightM: 24, gridM: 1 },
        rackTemplate: {
          widthM: 7,
          depthM: 1.8,
          heightM: 6,
          levelCount: 3,
          bayCount: 4,
        },
        zones: [
          {
            id: "zone-01",
            code: "ZONE-01",
            name: "Kho chính",
            xM: 0,
            yM: 0,
            widthM: 36,
            heightM: 24,
            rotation: 0,
          },
        ],
        racks: [
          {
            id: "rack-01",
            zoneId: "zone-01",
            code: "RACK-01",
            name: "Rack 01",
            xM: 3,
            yM: 4,
            widthM: 7,
            depthM: 1.8,
            rotation: 0,
            levelCount: 3,
            bayCount: 4,
            shelfCodes: [],
            accessPoint: { xM: 6.5, yM: 6 },
          },
        ],
        shelves: [],
        aisles: [
          {
            id: "aisle-01",
            code: "AISLE-01",
            type: "MAIN",
            xM: 0,
            yM: 10,
            widthM: 36,
            heightM: 2,
          },
        ],
        gates: [
          {
            id: "gate-01",
            code: "GATE-01",
            label: "Cổng nhập",
            xM: 18,
            yM: 23,
          },
        ],
        updatedAt: "2026-07-29T00:00:00.000Z",
      },
    });

    expect(layout.canvas).toEqual({ widthM: 36, heightM: 24, gridM: 1 });
    expect(layout.aisles).toHaveLength(1);
    expect(layout.gates[0].code).toBe("GATE-01");
    expect(layout.racks[0].rotation).toBe(0);
  });

  it("uses the selected rack access point as the route endpoint", () => {
    const gate = { id: "gate-01", code: "GATE-01", xM: 18, yM: 23 };
    const rack = {
      id: "rack-10",
      code: "RACK-10",
      xM: 19.5,
      yM: 4.8,
      widthM: 7,
      depthM: 1.8,
      rotation: 0 as const,
      accessPoint: { xM: 23, yM: 7.2 },
    };

    const points = buildRackRoutePoints(gate, rack);

    expect(points.at(-1)).toEqual({ xM: 23, yM: 7.2 });
  });

  it("falls back to the nearest rack edge center when access point is missing", () => {
    const point = getRackAccessPoint(
      {
        id: "rack-02",
        code: "RACK-02",
        xM: 23.4,
        yM: 14,
        widthM: 1.8,
        heightM: 8.5,
      },
      { xM: 18.4, yM: 23.5 },
    );

    expect(point.xM).toBeCloseTo(24.3);
    expect(point.yM).toBeCloseTo(22.5);
  });

  it("routes to the nearest rack edge when backend access point is missing", () => {
    const points = buildRackRoutePoints(
      { xM: 18.4, yM: 23.5 },
      {
        id: "rack-02",
        code: "RACK-02",
        xM: 23.4,
        yM: 14,
        widthM: 1.8,
        heightM: 8.5,
      },
    );

    expect(points.at(-1)?.xM).toBeCloseTo(24.3);
    expect(points.at(-1)?.yM).toBeCloseTo(22.5);
  });

  it("normalizes numeric strings and replaces invalid layout numbers", () => {
    const layout = normalizeWarehouseLayout({
      data: {
        canvas: { widthM: "55", heightM: null, gridM: "0.5" },
        racks: [
          {
            id: "rack-27",
            code: "RACK-27",
            xM: "27.5",
            yM: "12.5",
            widthM: null,
            depthM: "1.8",
            accessPoint: { xM: "27.5", yM: undefined },
          },
        ],
        zones: [{ id: "zone-01", code: "ZONE-01", xM: "0", yM: "0", widthM: "55", heightM: "24", rotation: "0" }],
        aisles: [],
        gates: [{ id: "gate-01", code: "GATE-01", xM: "24", yM: "25" }],
      },
    });

    expect(layout.canvas).toEqual({ widthM: 55, heightM: 24, gridM: 0.5 });
    expect(layout.zones[0]).toMatchObject({ xM: 0, yM: 0, widthM: 55, heightM: 24, rotation: 0 });
    expect(getRackRect(layout.racks[0])).toEqual({
      xM: 27.5,
      yM: 12.5,
      widthM: 2,
      heightM: 1.8,
    });
    expect(layout.racks[0].accessPoint).toBeUndefined();
    expect(layout.gates[0]).toMatchObject({ xM: 24, yM: 25 });
  });

  it("applies rack template dimensions and flat access point fields from the API", () => {
    const layout = normalizeWarehouseLayout({
      data: {
        canvas: { widthM: 55, heightM: 24, gridM: 1 },
        rackTemplate: {
          widthM: 7,
          depthM: 1.8,
          heightM: 6,
          levelCount: 3,
          bayCount: 4,
        },
        zones: [],
        racks: [
          {
            id: "rack-10",
            code: "RACK-10",
            xM: 27.5,
            yM: 12.5,
            rotation: 90,
            accessPointXM: 27.5,
            accessPointYM: 12.5,
          },
        ],
        shelves: [{ rackId: "rack-10", level: 2, code: "RACK-10-T2" }],
        aisles: [],
        gates: [],
      },
    });

    expect(layout.racks[0]).toMatchObject({
      widthM: 7,
      depthM: 1.8,
      levelCount: 3,
      bayCount: 4,
      shelfCodes: ["RACK-10-T2"],
      accessPoint: { xM: 27.5, yM: 12.5 },
    });
    expect(getRackRect(layout.racks[0])).toEqual({
      xM: 27.5,
      yM: 12.5,
      widthM: 1.8,
      heightM: 7,
    });
  });

  it("keeps map viewbox inside the warehouse canvas while zoomed", () => {
    expect(
      getMapViewBox(
        { widthM: 55, heightM: 24, gridM: 1 },
        2,
        { xM: 54, yM: 23 },
      ),
    ).toEqual({
      xM: 27.5,
      yM: 12,
      widthM: 28.5,
      heightM: 13,
    });
  });

  it("pans the map center using screen drag distance", () => {
    expect(
      panMapCenter(
        { xM: 27.5, yM: 12 },
        { widthM: 55, heightM: 24, gridM: 1 },
        2,
        { widthPx: 300, heightPx: 390 },
        { dxPx: 30, dyPx: -39 },
      ),
    ).toEqual({ xM: 24.65, yM: 13.3 });
  });
});
