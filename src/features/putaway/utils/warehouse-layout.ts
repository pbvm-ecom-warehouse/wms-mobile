export type WarehouseLayoutRotation = 0 | 90;

export interface WarehouseLayoutCanvas {
  widthM: number;
  heightM: number;
  gridM: number;
}

export interface WarehouseLayoutZone {
  id: string;
  code: string;
  name: string;
  xM: number;
  yM: number;
  widthM: number;
  heightM: number;
  rotation: WarehouseLayoutRotation;
}

export interface WarehouseLayoutRack {
  id: string;
  zoneId?: string;
  code: string;
  name?: string;
  xM: number;
  yM: number;
  widthM: number;
  depthM?: number;
  heightM?: number;
  rotation?: WarehouseLayoutRotation;
  levelCount?: number;
  bayCount?: number;
  shelfCodes?: string[];
  accessPoint?: { xM: number; yM: number };
}

export interface WarehouseLayoutAisle {
  id: string;
  code: string;
  type: "MAIN" | "RACK";
  xM: number;
  yM: number;
  widthM: number;
  heightM: number;
}

export interface WarehouseLayoutGate {
  id: string;
  code: string;
  label?: string;
  name?: string;
  xM: number;
  yM: number;
}

export interface WarehouseLayout {
  id?: string;
  revision?: number;
  status?: "DRAFT" | "PUBLISHED";
  canvas: WarehouseLayoutCanvas;
  rackTemplate?: {
    widthM: number;
    depthM: number;
    heightM: number;
    levelCount: number;
    bayCount: number;
  };
  zones: WarehouseLayoutZone[];
  racks: WarehouseLayoutRack[];
  shelves: unknown[];
  aisles: WarehouseLayoutAisle[];
  gates: WarehouseLayoutGate[];
  updatedAt?: string;
}

export interface LayoutRect {
  xM: number;
  yM: number;
  widthM: number;
  heightM: number;
}

export interface LayoutPoint {
  xM: number;
  yM: number;
}

export function getRackRect(rack: WarehouseLayoutRack): LayoutRect {
  const depthM = rack.depthM ?? rack.heightM ?? 2;
  return {
    xM: rack.xM,
    yM: rack.yM,
    widthM: rack.rotation === 90 ? depthM : rack.widthM,
    heightM: rack.rotation === 90 ? rack.widthM : depthM,
  };
}

export function getRackAccessPoint(
  rack: WarehouseLayoutRack,
  fromPoint?: LayoutPoint,
): LayoutPoint {
  if (rack.accessPoint) {
    return rack.accessPoint;
  }

  const rect = getRackRect(rack);
  const candidates: LayoutPoint[] = [
    { xM: rect.xM + rect.widthM / 2, yM: rect.yM },
    { xM: rect.xM + rect.widthM / 2, yM: rect.yM + rect.heightM },
    { xM: rect.xM, yM: rect.yM + rect.heightM / 2 },
    { xM: rect.xM + rect.widthM, yM: rect.yM + rect.heightM / 2 },
  ];

  if (!fromPoint) {
    return rect.heightM >= rect.widthM ? candidates[0] : candidates[1];
  }

  return candidates.reduce((nearest, candidate) => {
    const nearestDistance = Math.hypot(nearest.xM - fromPoint.xM, nearest.yM - fromPoint.yM);
    const candidateDistance = Math.hypot(candidate.xM - fromPoint.xM, candidate.yM - fromPoint.yM);
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}

export function buildRackRoutePoints(
  gate: LayoutPoint,
  rack: WarehouseLayoutRack,
): LayoutPoint[] {
  const accessPoint = getRackAccessPoint(rack, gate);
  return [
    { xM: gate.xM, yM: gate.yM },
    { xM: gate.xM, yM: accessPoint.yM },
    accessPoint,
  ];
}

export function calculateRouteDistance(points: LayoutPoint[]): number {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    const previous = points[index - 1];
    return total + Math.hypot(point.xM - previous.xM, point.yM - previous.yM);
  }, 0);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeWarehouseLayout(payload: unknown): WarehouseLayout {
  let source = record(payload);
  if (source.data && typeof source.data === "object") {
    source = record(source.data);
  }
  if (
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.racks)
  ) {
    source = record(source.data);
  }

  const canvas = record(source.canvas);
  return {
    id: typeof source.id === "string" ? source.id : undefined,
    revision: typeof source.revision === "number" ? source.revision : undefined,
    status:
      source.status === "DRAFT" || source.status === "PUBLISHED"
        ? source.status
        : undefined,
    canvas: {
      widthM: typeof canvas.widthM === "number" ? canvas.widthM : 36,
      heightM: typeof canvas.heightM === "number" ? canvas.heightM : 24,
      gridM: typeof canvas.gridM === "number" ? canvas.gridM : 1,
    },
    rackTemplate:
      source.rackTemplate && typeof source.rackTemplate === "object"
        ? (source.rackTemplate as WarehouseLayout["rackTemplate"])
        : undefined,
    zones: array<WarehouseLayoutZone>(source.zones),
    racks: array<WarehouseLayoutRack>(source.racks),
    shelves: array(source.shelves),
    aisles: array<WarehouseLayoutAisle>(source.aisles),
    gates: array<WarehouseLayoutGate>(source.gates),
    updatedAt:
      typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
}
