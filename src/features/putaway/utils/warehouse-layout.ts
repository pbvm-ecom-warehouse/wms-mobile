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

export interface MapViewBox {
  xM: number;
  yM: number;
  widthM: number;
  heightM: number;
}

export interface MapSizePx {
  widthPx: number;
  heightPx: number;
}

export interface MapPanDeltaPx {
  dxPx: number;
  dyPx: number;
}

const mapPaddingM = 1;
const minZoom = 1;
const maxZoom = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundLayout(value: number): number {
  return Number(value.toFixed(4));
}

export function clampMapZoom(value: number): number {
  return clamp(Number.isFinite(value) ? value : minZoom, minZoom, maxZoom);
}

export function getMapViewBox(
  canvas: WarehouseLayoutCanvas,
  zoom: number,
  center: LayoutPoint,
): MapViewBox {
  const safeZoom = clampMapZoom(zoom);
  const fullWidth = canvas.widthM + mapPaddingM * 2;
  const fullHeight = canvas.heightM + mapPaddingM * 2;
  const widthM = fullWidth / safeZoom;
  const heightM = fullHeight / safeZoom;
  const minX = -mapPaddingM;
  const minY = -mapPaddingM;
  const maxX = minX + fullWidth - widthM;
  const maxY = minY + fullHeight - heightM;

  return {
    xM: roundLayout(clamp(center.xM - widthM / 2, minX, maxX)),
    yM: roundLayout(clamp(center.yM - heightM / 2, minY, maxY)),
    widthM: roundLayout(widthM),
    heightM: roundLayout(heightM),
  };
}

export function panMapCenter(
  center: LayoutPoint,
  canvas: WarehouseLayoutCanvas,
  zoom: number,
  size: MapSizePx,
  delta: MapPanDeltaPx,
): LayoutPoint {
  const viewBox = getMapViewBox(canvas, zoom, center);
  const meterPerPixelX = viewBox.widthM / Math.max(1, size.widthPx);
  const meterPerPixelY = viewBox.heightM / Math.max(1, size.heightPx);
  const nextCenter = {
    xM: center.xM - delta.dxPx * meterPerPixelX,
    yM: center.yM - delta.dyPx * meterPerPixelY,
  };
  const clampedViewBox = getMapViewBox(canvas, zoom, nextCenter);

  return {
    xM: roundLayout(clampedViewBox.xM + clampedViewBox.widthM / 2),
    yM: roundLayout(clampedViewBox.yM + clampedViewBox.heightM / 2),
  };
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

function normalizeRackTemplate(value: unknown): WarehouseLayout["rackTemplate"] {
  const template = record(value);
  if (!Object.keys(template).length) return undefined;
  return {
    widthM: number(template.widthM, 7),
    depthM: number(template.depthM, 1.8),
    heightM: number(template.heightM, 6),
    levelCount: number(template.levelCount, 0),
    bayCount: number(template.bayCount, 0),
  };
}

function flatAccessPoint(value: Record<string, unknown>): LayoutPoint | undefined {
  const xM = number(value.accessPointXM, NaN);
  const yM = number(value.accessPointYM, NaN);
  return Number.isFinite(xM) && Number.isFinite(yM) ? { xM, yM } : undefined;
}

function shelfCodesForRack(shelves: unknown[], rackId: string): string[] | undefined {
  const codes = shelves
    .map((shelf) => record(shelf))
    .filter((shelf) => shelf.rackId === rackId && typeof shelf.code === "string")
    .sort((left, right) => number(left.level, 0) - number(right.level, 0))
    .map((shelf) => shelf.code as string);

  return codes.length > 0 ? codes : undefined;
}

function normalizeRack(
  value: unknown,
  index: number,
  template: WarehouseLayout["rackTemplate"],
  shelves: unknown[],
): WarehouseLayoutRack {
  const rack = record(value);
  const code = string(rack.code, `RACK-${String(index + 1).padStart(2, "0")}`);
  const id = string(rack.id, code);
  const normalizedAccessPoint = accessPoint(rack.accessPoint) ?? flatAccessPoint(rack);

  return {
    id,
    zoneId: typeof rack.zoneId === "string" ? rack.zoneId : undefined,
    code,
    name: typeof rack.name === "string" ? rack.name : undefined,
    xM: number(rack.xM, 0),
    yM: number(rack.yM, 0),
    widthM: number(rack.widthM, template?.widthM ?? 2),
    depthM: rack.depthM == null ? template?.depthM : number(rack.depthM, template?.depthM ?? 2),
    heightM: rack.heightM == null ? template?.heightM : number(rack.heightM, template?.heightM ?? 2),
    rotation: rotation(rack.rotation),
    levelCount: rack.levelCount == null ? template?.levelCount : number(rack.levelCount, template?.levelCount ?? 0),
    bayCount: rack.bayCount == null ? template?.bayCount : number(rack.bayCount, template?.bayCount ?? 0),
    shelfCodes: Array.isArray(rack.shelfCodes) ? rack.shelfCodes.filter((item): item is string => typeof item === "string") : shelfCodesForRack(shelves, id),
    accessPoint: normalizedAccessPoint,
  };
}

function normalizeZone(value: unknown, index: number): WarehouseLayoutZone {
  const zone = record(value);
  const code = string(zone.code, `ZONE-${String(index + 1).padStart(2, "0")}`);
  return {
    id: string(zone.id, code),
    code,
    name: string(zone.name, code),
    xM: number(zone.xM, 0),
    yM: number(zone.yM, 0),
    widthM: number(zone.widthM, 1),
    heightM: number(zone.heightM, 1),
    rotation: rotation(zone.rotation),
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
  const rackTemplate = normalizeRackTemplate(source.rackTemplate);
  const shelves = array(source.shelves);
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
    rackTemplate,
    zones: array(source.zones).map(normalizeZone),
    racks: array(source.racks).map((rack, index) => normalizeRack(rack, index, rackTemplate, shelves)),
    shelves,
    aisles: array(source.aisles).map(normalizeAisle),
    gates: array(source.gates).map(normalizeGate),
    updatedAt:
      typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
}
