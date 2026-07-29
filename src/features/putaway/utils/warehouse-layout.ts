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

export function isFiniteLayoutPoint(point: LayoutPoint): boolean {
  return Number.isFinite(point.xM) && Number.isFinite(point.yM);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function string(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function rotation(value: unknown): WarehouseLayoutRotation {
  return value === 90 || value === "90" ? 90 : 0;
}

function accessPoint(value: unknown): LayoutPoint | undefined {
  const point = record(value);
  const xM = number(point.xM, NaN);
  const yM = number(point.yM, NaN);
  return Number.isFinite(xM) && Number.isFinite(yM) ? { xM, yM } : undefined;
}

function normalizeRack(value: unknown, index: number): WarehouseLayoutRack {
  const rack = record(value);
  const code = string(rack.code, `RACK-${String(index + 1).padStart(2, "0")}`);
  const normalizedAccessPoint = accessPoint(rack.accessPoint);

  return {
    id: string(rack.id, code),
    zoneId: typeof rack.zoneId === "string" ? rack.zoneId : undefined,
    code,
    name: typeof rack.name === "string" ? rack.name : undefined,
    xM: number(rack.xM, 0),
    yM: number(rack.yM, 0),
    widthM: number(rack.widthM, 2),
    depthM: rack.depthM == null ? undefined : number(rack.depthM, 2),
    heightM: rack.heightM == null ? undefined : number(rack.heightM, 2),
    rotation: rotation(rack.rotation),
    levelCount: rack.levelCount == null ? undefined : number(rack.levelCount, 0),
    bayCount: rack.bayCount == null ? undefined : number(rack.bayCount, 0),
    shelfCodes: Array.isArray(rack.shelfCodes) ? rack.shelfCodes.filter((item): item is string => typeof item === "string") : undefined,
    accessPoint: normalizedAccessPoint,
  };
}

function normalizeAisle(value: unknown, index: number): WarehouseLayoutAisle {
  const aisle = record(value);
  const code = string(aisle.code, `AISLE-${String(index + 1).padStart(2, "0")}`);
  return {
    id: string(aisle.id, code),
    code,
    type: aisle.type === "RACK" ? "RACK" : "MAIN",
    xM: number(aisle.xM, 0),
    yM: number(aisle.yM, 0),
    widthM: number(aisle.widthM, 1),
    heightM: number(aisle.heightM, 1),
  };
}

function normalizeGate(value: unknown, index: number): WarehouseLayoutGate {
  const gate = record(value);
  const code = string(gate.code, `GATE-${String(index + 1).padStart(2, "0")}`);
  return {
    id: string(gate.id, code),
    code,
    label: typeof gate.label === "string" ? gate.label : undefined,
    name: typeof gate.name === "string" ? gate.name : undefined,
    xM: number(gate.xM, 0),
    yM: number(gate.yM, 0),
  };
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
      widthM: number(canvas.widthM, 36),
      heightM: number(canvas.heightM, 24),
      gridM: number(canvas.gridM, 1),
    },
    rackTemplate:
      source.rackTemplate && typeof source.rackTemplate === "object"
        ? (source.rackTemplate as WarehouseLayout["rackTemplate"])
        : undefined,
    zones: array<WarehouseLayoutZone>(source.zones),
    racks: array(source.racks).map(normalizeRack),
    shelves: array(source.shelves),
    aisles: array(source.aisles).map(normalizeAisle),
    gates: array(source.gates).map(normalizeGate),
    updatedAt:
      typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
}
