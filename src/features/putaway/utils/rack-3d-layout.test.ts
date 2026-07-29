import type { StorageCellView } from "../api/putaway-api";
import {
  getCellPosition,
  getRackMeasurements,
  packCellBoxes,
} from "./rack-3d-layout";

const cells: StorageCellView[] = [
  {
    id: "cell-1",
    rackId: "rack-1",
    level: 1,
    bay: 1,
    code: "RACK-01-T1-B1",
    status: "ACTIVE",
    innerWidth: 200,
    innerHeight: 100,
    innerDepth: 120,
    fillPercent: 25,
    contents: [
      {
        id: "content-1",
        sku: "SKU-RED",
        itemName: "Thùng đỏ",
        unit: "thùng",
        quantity: 2,
        packageWidthCm: 50,
        packageHeightCm: 40,
        packageDepthCm: 60,
      },
    ],
  },
  {
    id: "cell-2",
    rackId: "rack-1",
    level: 1,
    bay: 2,
    code: "RACK-01-T1-B2",
    status: "ACTIVE",
    innerWidth: 150,
    innerHeight: 100,
    innerDepth: 120,
    fillPercent: 0,
    contents: [],
  },
];

describe("rack 3D layout", () => {
  it("derives rack measurements from cell dimensions", () => {
    expect(getRackMeasurements(cells)).toEqual({
      widthM: 3.5,
      depthM: 1.2,
      heightM: 1,
      levels: 1,
      bays: 2,
      bayWidthsM: [2, 1.5],
      levelHeightsM: [1],
    });
  });

  it("positions cells in the center of their bay and level", () => {
    expect(getCellPosition(cells[0], getRackMeasurements(cells))).toEqual([
      -0.75, 0, 0,
    ]);
  });

  it("packs visible boxes using package dimensions", () => {
    expect(packCellBoxes(cells[0])).toEqual([
      {
        id: "content-1-0",
        contentId: "content-1",
        sku: "SKU-RED",
        size: [0.5, 0.4, 0.6],
        position: [-0.75, -0.3, -0.3],
      },
      {
        id: "content-1-1",
        contentId: "content-1",
        sku: "SKU-RED",
        size: [0.5, 0.4, 0.6],
        position: [-0.25, -0.3, -0.3],
      },
    ]);
  });

  it("keeps valid cell dimensions smaller than one meter", () => {
    const compactCell: StorageCellView = {
      ...cells[0],
      innerWidth: 50,
      innerHeight: 40,
      innerDepth: 60,
      contents: [],
    };

    expect(getRackMeasurements([compactCell])).toMatchObject({
      widthM: 0.5,
      heightM: 0.4,
      depthM: 0.6,
    });
  });
});
