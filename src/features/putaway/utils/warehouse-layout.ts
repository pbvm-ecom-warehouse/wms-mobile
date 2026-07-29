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

export function calculatePinchZoom(
  initialZoom: number,
  initialDistance: number,
  currentDistance: number,
): number {
  if (initialDistance <= 0 || !Number.isFinite(currentDistance)) {
    return clampMapZoom(initialZoom);
  }
  return clampMapZoom(roundLayout(initialZoom * (currentDistance / initialDistance)));
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

type RouteNode = LayoutPoint & { aisles: Set<number> };

function aislePoint(
  aisle: WarehouseLayoutAisle,
  point: LayoutPoint,
): LayoutPoint {
  const horizontal = aisle.widthM >= aisle.heightM;
  return horizontal
    ? {
        xM: clamp(point.xM, aisle.xM, aisle.xM + aisle.widthM),
        yM: aisle.yM + aisle.heightM / 2,
      }
    : {
        xM: aisle.xM + aisle.widthM / 2,
        yM: clamp(point.yM, aisle.yM, aisle.yM + aisle.heightM),
      };
}

export function getRackNavigationAccessPoint(
  rack: WarehouseLayoutRack,
  aisles: WarehouseLayoutAisle[],
  fromPoint?: LayoutPoint,
): LayoutPoint {
  if (aisles.length === 0) return getRackAccessPoint(rack, fromPoint);
  const rackRect = getRackRect(rack);
  const rackCenter = {
    xM: rackRect.xM + rackRect.widthM / 2,
    yM: rackRect.yM + rackRect.heightM / 2,
  };
  const candidates = aisles.map((aisle) => {
    const deltaX = Math.max(
      aisle.xM - (rackRect.xM + rackRect.widthM),
      rackRect.xM - (aisle.xM + aisle.widthM),
      0,
    );
    const deltaY = Math.max(
      aisle.yM - (rackRect.yM + rackRect.heightM),
      rackRect.yM - (aisle.yM + aisle.heightM),
      0,
    );
    return {
      point: aislePoint(aisle, rackCenter),
      distance: Math.hypot(deltaX, deltaY),
      priority: aisle.type === "RACK" ? 0 : 1,
    };
  });
  candidates.sort(
    (left, right) =>
      left.distance - right.distance || left.priority - right.priority,
  );
  return candidates[0].point;
}

function aisleIntersection(
  left: WarehouseLayoutAisle,
  right: WarehouseLayoutAisle,
): LayoutPoint | null {
  const leftHorizontal = left.widthM >= left.heightM;
  const rightHorizontal = right.widthM >= right.heightM;
  if (leftHorizontal === rightHorizontal) return null;
  const horizontal = leftHorizontal ? left : right;
  const vertical = leftHorizontal ? right : left;
  const point = {
    xM: vertical.xM + vertical.widthM / 2,
    yM: horizontal.yM + horizontal.heightM / 2,
  };
  return point.xM >= horizontal.xM &&
    point.xM <= horizontal.xM + horizontal.widthM &&
    point.yM >= vertical.yM &&
    point.yM <= vertical.yM + vertical.heightM
    ? point
    : null;
}

function simplifyRoute(points: LayoutPoint[]): LayoutPoint[] {
  const unique = points.filter(
    (point, index) =>
      index === 0 ||
      point.xM !== points[index - 1].xM ||
      point.yM !== points[index - 1].yM,
  );
  return unique.filter((point, index) => {
    if (index === 0 || index === unique.length - 1) return true;
    const previous = unique[index - 1];
    const next = unique[index + 1];
    return !(
      (previous.xM === point.xM && point.xM === next.xM) ||
      (previous.yM === point.yM && point.yM === next.yM)
    );
  });
}

export function buildAisleRoutePoints(
  gate: LayoutPoint,
  rack: WarehouseLayoutRack,
  aisles: WarehouseLayoutAisle[],
): LayoutPoint[] {
  const accessPoint = getRackNavigationAccessPoint(rack, aisles, gate);
  if (aisles.length === 0) return buildRackRoutePoints(gate, rack);

  const distanceToAisle = (point: LayoutPoint, aisle: WarehouseLayoutAisle) => {
    const projected = aislePoint(aisle, point);
    return Math.hypot(projected.xM - point.xM, projected.yM - point.yM);
  };
  const startAisle = aisles.reduce((best, aisle) =>
    distanceToAisle(gate, aisle) < distanceToAisle(gate, best) ? aisle : best,
  );
  const targetAisle = aisles.reduce((best, aisle) =>
    distanceToAisle(accessPoint, aisle) < distanceToAisle(accessPoint, best) ? aisle : best,
  );
  const nodes: RouteNode[] = [];
  const addNode = (point: LayoutPoint, aisleIndexes: number[]) => {
    const existing = nodes.find(
      (node) => Math.abs(node.xM - point.xM) < 0.0001 && Math.abs(node.yM - point.yM) < 0.0001,
    );
    if (existing) {
      aisleIndexes.forEach((index) => existing.aisles.add(index));
      return nodes.indexOf(existing);
    }
    nodes.push({ ...point, aisles: new Set(aisleIndexes) });
    return nodes.length - 1;
  };

  const startAisleIndex = aisles.indexOf(startAisle);
  const targetAisleIndex = aisles.indexOf(targetAisle);
  const startIndex = addNode(aislePoint(startAisle, gate), [startAisleIndex]);
  const targetIndex = addNode(aislePoint(targetAisle, accessPoint), [targetAisleIndex]);
  aisles.forEach((aisle, leftIndex) => {
    aisles.slice(leftIndex + 1).forEach((right, offset) => {
      const rightIndex = leftIndex + offset + 1;
      const intersection = aisleIntersection(aisle, right);
      if (intersection) addNode(intersection, [leftIndex, rightIndex]);
    });
  });

  const distances = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  const visited = new Set<number>();
  distances[startIndex] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    nodes.forEach((_, index) => {
      if (!visited.has(index) && (current < 0 || distances[index] < distances[current])) current = index;
    });
    if (current < 0 || distances[current] === Infinity || current === targetIndex) break;
    visited.add(current);
    nodes.forEach((candidate, index) => {
      if (visited.has(index) || index === current) return;
      const connected = [...nodes[current].aisles].some((aisleIndex) => candidate.aisles.has(aisleIndex));
      if (!connected) return;
      const nextDistance = distances[current] + Math.hypot(candidate.xM - nodes[current].xM, candidate.yM - nodes[current].yM);
      if (nextDistance < distances[index]) {
        distances[index] = nextDistance;
        previous[index] = current;
      }
    });
  }

  if (!Number.isFinite(distances[targetIndex])) return buildRackRoutePoints(gate, rack);
  const aislePath: LayoutPoint[] = [];
  for (let index = targetIndex; index >= 0; index = previous[index]) {
    aislePath.unshift({ xM: nodes[index].xM, yM: nodes[index].yM });
    if (index === startIndex) break;
  }
  return simplifyRoute([gate, ...aislePath, accessPoint]);
}

function segmentIntersectsRect(
  start: LayoutPoint,
  end: LayoutPoint,
  rect: LayoutRect,
  margin = 0.12,
): boolean {
  const left = rect.xM - margin;
  const right = rect.xM + rect.widthM + margin;
  const top = rect.yM - margin;
  const bottom = rect.yM + rect.heightM + margin;
  if (start.xM === end.xM) {
    return start.xM > left && start.xM < right &&
      Math.max(start.yM, end.yM) > top && Math.min(start.yM, end.yM) < bottom;
  }
  if (start.yM === end.yM) {
    return start.yM > top && start.yM < bottom &&
      Math.max(start.xM, end.xM) > left && Math.min(start.xM, end.xM) < right;
  }
  return false;
}

export function routeIntersectsRack(
  points: LayoutPoint[],
  rack: WarehouseLayoutRack,
): boolean {
  const rect = getRackRect(rack);
  return points.some(
    (point, index) =>
      index > 0 && segmentIntersectsRect(points[index - 1], point, rect),
  );
}

export function buildSafeWarehouseRoutePoints(
  gate: LayoutPoint,
  targetRack: WarehouseLayoutRack,
  aisles: WarehouseLayoutAisle[],
  racks: WarehouseLayoutRack[],
  canvas: WarehouseLayoutCanvas,
): LayoutPoint[] {
  const accessPoint = getRackNavigationAccessPoint(targetRack, aisles, gate);
  const blockers = racks;
  const aisleRoute = buildAisleRoutePoints(gate, targetRack, aisles);
  if (!blockers.some((rack) => routeIntersectsRack(aisleRoute, rack))) {
    return aisleRoute;
  }

  const step = Math.max(0.25, Math.min(0.5, canvas.gridM || 0.5));
  const columns = Math.floor(canvas.widthM / step) + 1;
  const rows = Math.floor(canvas.heightM / step) + 1;
  const toCell = (point: LayoutPoint) => ({
    x: clamp(Math.round(point.xM / step), 0, columns - 1),
    y: clamp(Math.round(point.yM / step), 0, rows - 1),
  });
  const toPoint = (x: number, y: number): LayoutPoint => ({
    xM: roundLayout(x * step),
    yM: roundLayout(y * step),
  });
  const key = (x: number, y: number) => y * columns + x;
  const start = toCell(gate);
  const target = toCell(accessPoint);
  const targetKey = key(target.x, target.y);
  const startKey = key(start.x, start.y);
  const blocked = (point: LayoutPoint) =>
    blockers.some((rack) => {
      const rect = getRackRect(rack);
      return point.xM > rect.xM - 0.12 &&
        point.xM < rect.xM + rect.widthM + 0.12 &&
        point.yM > rect.yM - 0.12 &&
        point.yM < rect.yM + rect.heightM + 0.12;
    });
  const aisleTraversalCost = (point: LayoutPoint) => {
    const costs = aisles
      .filter(
        (aisle) =>
          point.xM >= aisle.xM &&
          point.xM <= aisle.xM + aisle.widthM &&
          point.yM >= aisle.yM &&
          point.yM <= aisle.yM + aisle.heightM,
      )
      .map((aisle) => {
        const horizontal = aisle.widthM >= aisle.heightM;
        const distanceFromCenter = horizontal
          ? Math.abs(point.yM - (aisle.yM + aisle.heightM / 2))
          : Math.abs(point.xM - (aisle.xM + aisle.widthM / 2));
        const halfWidth = Math.max(step, (horizontal ? aisle.heightM : aisle.widthM) / 2);
        return 1 + (distanceFromCenter / halfWidth) * 4;
      });
    return costs.length > 0 ? Math.min(...costs) : 12;
  };

  const distance = new Map<number, number>([[startKey, 0]]);
  const score = new Map<number, number>([
    [startKey, Math.abs(start.x - target.x) + Math.abs(start.y - target.y)],
  ]);
  const previous = new Map<number, number>();
  const open = new Set<number>([startKey]);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

  while (open.size > 0) {
    let current = -1;
    open.forEach((candidate) => {
      if (current < 0 || (score.get(candidate) ?? Infinity) < (score.get(current) ?? Infinity)) {
        current = candidate;
      }
    });
    if (current === targetKey) break;
    open.delete(current);
    const currentX = current % columns;
    const currentY = Math.floor(current / columns);
    for (const [dx, dy] of directions) {
      const nextX = currentX + dx;
      const nextY = currentY + dy;
      if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) continue;
      const nextPoint = toPoint(nextX, nextY);
      const nextKey = key(nextX, nextY);
      if (nextKey !== targetKey && blocked(nextPoint)) continue;
      const nextDistance = (distance.get(current) ?? Infinity) + aisleTraversalCost(nextPoint);
      if (nextDistance >= (distance.get(nextKey) ?? Infinity)) continue;
      previous.set(nextKey, current);
      distance.set(nextKey, nextDistance);
      score.set(nextKey, nextDistance + Math.abs(nextX - target.x) + Math.abs(nextY - target.y));
      open.add(nextKey);
    }
  }

  if (!distance.has(targetKey)) return aisleRoute;
  const gridPath: LayoutPoint[] = [];
  for (let current = targetKey; ; current = previous.get(current)!) {
    gridPath.unshift(toPoint(current % columns, Math.floor(current / columns)));
    if (current === startKey) break;
  }
  return simplifyRoute([gate, ...gridPath, accessPoint]);
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
