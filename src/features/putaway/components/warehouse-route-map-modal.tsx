import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, PanResponder, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize2, Minus, Navigation, Plus, X } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { fetchWarehouseLayout, getNavigationPath, type WarehouseLayout, type WarehouseLayoutGate, type WarehouseLayoutRack } from '../api/putaway-api';
import type { NavigationPath } from '../types/putaway';
import { buildSafeWarehouseRoutePoints, calculatePinchZoom, calculateRouteDistance, clampMapZoom, getMapViewBox, getRackRect, panMapCenter, type LayoutPoint } from '../utils/warehouse-layout';
import { RackCellViewerModal } from './rack-cell-viewer-modal';

export interface WarehouseRouteMapModalProps {
  visible: boolean;
  onClose: () => void;
  path?: NavigationPath;
  targetLocation?: string;
  readOnly?: boolean;
  onSelectLocation?: (locationCode: string) => void;
  onConfirmScanCell?: (locationCode: string) => void;
}

const layoutCanvas = { widthM: 36, heightM: 24 };

// Grid Racks Layout matching Web Image 3 exactly
const webStandardRacks: WarehouseLayoutRack[] = [
  // Top Section (Horizontal)
  { id: 'rack-17', code: 'RACK-17', xM: 1.5, yM: 2, widthM: 7, heightM: 1.8 },
  { id: 'rack-14', code: 'RACK-14', xM: 10.5, yM: 2, widthM: 7, heightM: 1.8 },
  { id: 'rack-08', code: 'RACK-08', xM: 19.5, yM: 2, widthM: 7, heightM: 1.8 },
  { id: 'rack-09', code: 'RACK-09', xM: 28.5, yM: 2, widthM: 7, heightM: 1.8 },

  { id: 'rack-18', code: 'RACK-18', xM: 1.5, yM: 4.8, widthM: 7, heightM: 1.8 },
  {
    id: 'rack-15',
    code: 'RACK-15',
    xM: 10.5,
    yM: 4.8,
    widthM: 7,
    heightM: 1.8,
  },
  {
    id: 'rack-10',
    code: 'RACK-10',
    xM: 19.5,
    yM: 4.8,
    widthM: 7,
    heightM: 1.8,
  },
  {
    id: 'rack-11',
    code: 'RACK-11',
    xM: 28.5,
    yM: 4.8,
    widthM: 7,
    heightM: 1.8,
  },

  { id: 'rack-19', code: 'RACK-19', xM: 1.5, yM: 7.6, widthM: 7, heightM: 1.8 },
  {
    id: 'rack-16',
    code: 'RACK-16',
    xM: 10.5,
    yM: 7.6,
    widthM: 7,
    heightM: 1.8,
  },
  {
    id: 'rack-12',
    code: 'RACK-12',
    xM: 19.5,
    yM: 7.6,
    widthM: 7,
    heightM: 1.8,
  },
  {
    id: 'rack-13',
    code: 'RACK-13',
    xM: 28.5,
    yM: 7.6,
    widthM: 7,
    heightM: 1.8,
  },

  // Bottom-Left Section (Vertical)
  {
    id: 'rack-20',
    code: 'RACK-20',
    xM: 1.2,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-21',
    code: 'RACK-21',
    xM: 3.6,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-22',
    code: 'RACK-22',
    xM: 6.0,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-23',
    code: 'RACK-23',
    xM: 8.4,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-24',
    code: 'RACK-24',
    xM: 10.8,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-25',
    code: 'RACK-25',
    xM: 13.2,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-26',
    code: 'RACK-26',
    xM: 15.6,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },

  // Bottom-Right Section (Vertical)
  {
    id: 'rack-01',
    code: 'RACK-01',
    xM: 21.0,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-02',
    code: 'RACK-02',
    xM: 23.4,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-03',
    code: 'RACK-03',
    xM: 25.8,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-04',
    code: 'RACK-04',
    xM: 28.2,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-05',
    code: 'RACK-05',
    xM: 30.6,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-06',
    code: 'RACK-06',
    xM: 33.0,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
  {
    id: 'rack-07',
    code: 'RACK-07',
    xM: 35.4,
    yM: 14,
    widthM: 1.8,
    heightM: 8.5,
  },
];

const webStandardAisles = [
  { code: 'AISLE-02', xM: 0, yM: 10.5, widthM: 36, heightM: 2.2, isMain: true },
  {
    code: 'AISLE-01',
    xM: 17.6,
    yM: 12.7,
    widthM: 1.6,
    heightM: 10.8,
    isMain: false,
  },
];

const defaultGate: WarehouseLayoutGate = {
  id: 'gate-01',
  code: 'GATE-01',
  xM: 18.4,
  yM: 23.5,
};
const fallbackLayout: WarehouseLayout = {
  canvas: { ...layoutCanvas, gridM: 1 },
  zones: [],
  racks: webStandardRacks,
  shelves: [],
  aisles: webStandardAisles.map((aisle, index) => ({
    id: `aisle-${index + 1}`,
    code: aisle.code,
    type: aisle.isMain ? 'MAIN' : 'RACK',
    xM: aisle.xM,
    yM: aisle.yM,
    widthM: aisle.widthM,
    heightM: aisle.heightM,
  })),
  gates: [defaultGate],
};

interface WarehouseMapSvgContentProps {
  svgRef: React.RefObject<React.ElementRef<typeof Svg>>;
  canvas: WarehouseLayout['canvas'];
  layout: WarehouseLayout;
  racks: WarehouseLayoutRack[];
  gates: WarehouseLayoutGate[];
  points: { xM: number; yM: number }[];
  routePolylinePoints: string;
  currentRackCode: string;
  onRackPress: (rack: WarehouseLayoutRack) => void;
}

const WarehouseMapSvgContent = memo(function WarehouseMapSvgContent({
  svgRef,
  canvas,
  layout,
  racks,
  gates,
  points,
  routePolylinePoints,
  currentRackCode,
  onRackPress,
}: WarehouseMapSvgContentProps) {
  return (
    <Svg ref={svgRef} width="100%" height="390" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Pattern id="operation-grid-mobile" width={canvas.gridM} height={canvas.gridM} patternUnits="userSpaceOnUse">
          <Path d={`M ${canvas.gridM} 0 L 0 0 0 ${canvas.gridM}`} fill="none" stroke="#cbd5e1" strokeWidth="0.025" />
        </Pattern>
      </Defs>
      {/* Outer Border */}
      <Rect x="0" y="0" width={canvas.widthM} height={canvas.heightM} fill="#ffffff" stroke="#334155" strokeWidth="0.18" />
      <Rect x="0" y="0" width={canvas.widthM} height={canvas.heightM} fill="url(#operation-grid-mobile)" />

      {/* Zones */}
      {layout.zones.map((zone) => (
        <Rect
          key={zone.id}
          x={zone.xM}
          y={zone.yM}
          width={zone.rotation === 90 ? zone.heightM : zone.widthM}
          height={zone.rotation === 90 ? zone.widthM : zone.heightM}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeDasharray="0.3 0.22"
          strokeWidth="0.06"
        />
      ))}

      {/* Aisles Corridors */}
      {layout.aisles.map((aisle) => (
        <G key={aisle.code}>
          <Rect x={aisle.xM} y={aisle.yM} width={aisle.widthM} height={aisle.heightM} fill={aisle.type === 'MAIN' ? '#dbe4e7' : '#eef2f3'} stroke="#cbd5e1" strokeWidth="0.04" />
          <SvgText x={aisle.xM + aisle.widthM / 2} y={aisle.yM + aisle.heightM / 2 + 0.15} fontSize="0.45" fontWeight="bold" fill="#64748b" textAnchor="middle">
            {aisle.code}
          </SvgText>
        </G>
      ))}

      {/* Racks */}
      {racks.map((rack) => {
        const isTarget = currentRackCode === rack.code;
        const rect = getRackRect(rack);
        return (
          <G key={rack.id || rack.code}>
            <Rect
              x={rect.xM}
              y={rect.yM}
              width={rect.widthM}
              height={rect.heightM}
              rx="0.2"
              fill={isTarget ? '#f59e0b' : '#cbd5e1'}
              stroke={isTarget ? '#b45309' : '#475569'}
              strokeWidth={isTarget ? '0.3' : '0.1'}
              onPress={() => onRackPress(rack)}
            />
            <SvgText x={rect.xM + rect.widthM / 2} y={rect.yM + rect.heightM / 2 + 0.25} fontSize="0.55" fontWeight="bold" fill={isTarget ? '#78350f' : '#1e293b'} textAnchor="middle" onPress={() => onRackPress(rack)}>
              {rack.code}
            </SvgText>
          </G>
        );
      })}

      {/* Route Polyline Path */}
      {routePolylinePoints ? (
        <>
          <Polyline points={routePolylinePoints} fill="none" stroke="#2563eb" strokeWidth="0.45" strokeDasharray="0.6 0.3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((pt, idx) => (
            <Circle
              key={idx}
              cx={pt.xM}
              cy={pt.yM}
              r={idx === 0 || idx === points.length - 1 ? '0.5' : '0.25'}
              fill={idx === 0 ? '#0f766e' : idx === points.length - 1 ? '#d97706' : '#2563eb'}
              stroke="#ffffff"
              strokeWidth="0.1"
            />
          ))}
        </>
      ) : null}

      {/* Gate Markers */}
      {gates.map((gate) => (
        <G key={gate.id}>
          <Circle cx={gate.xM} cy={gate.yM} r="0.55" fill="#0f766e" stroke="#ffffff" strokeWidth="0.1" />
          <SvgText x={gate.xM} y={gate.yM - 0.8} fontSize="0.5" fontWeight="bold" fill="#0f766e" textAnchor="middle">
            {gate.code}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
});

export function WarehouseRouteMapModal({ visible, onClose, path, targetLocation = 'RACK-02-T1-B1', readOnly = false, onSelectLocation, onConfirmScanCell }: WarehouseRouteMapModalProps) {
  const [selectedRack, setSelectedRack] = useState<WarehouseLayoutRack | null>(null);
  const [layout, setLayout] = useState<WarehouseLayout>(fallbackLayout);
  const [loading, setLoading] = useState(false);
  const [rackViewerOpen, setRackViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<LayoutPoint>({ xM: layoutCanvas.widthM / 2, yM: layoutCanvas.heightM / 2 });
  const [mapSize, setMapSize] = useState({ widthPx: 1, heightPx: 390 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const zoomRef = useRef(zoomLevel);
  const mapCenterRef = useRef(mapCenter);
  const canvasRef = useRef(layout.canvas);
  const mapSizeRef = useRef(mapSize);
  const svgRef = useRef<React.ElementRef<typeof Svg>>(null);

  zoomRef.current = zoomLevel;
  mapCenterRef.current = mapCenter;
  canvasRef.current = layout.canvas;
  mapSizeRef.current = mapSize;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchWarehouseLayout()
        .then((layout) => {
          if (layout && layout.racks && layout.racks.length > 0) {
            setLayout(layout);
            const found = layout.racks.find((r) => targetLocation.includes(r.code)) || layout.racks.find((r) => r.code === 'RACK-02') || layout.racks[0];
            setSelectedRack(found);
          } else {
            setLayout(fallbackLayout);
            const found = webStandardRacks.find((r) => r.code === 'RACK-02') || webStandardRacks[0];
            setSelectedRack(found);
          }
        })
        .catch(() => {
          setLayout(fallbackLayout);
          setSelectedRack(webStandardRacks.find((r) => r.code === 'RACK-02') || webStandardRacks[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, targetLocation]);

  const [fetchedPath, setFetchedPath] = useState<NavigationPath | null>(null);

  useEffect(() => {
    if (visible && selectedRack?.id) {
      if (path && (path.targetRackId === selectedRack.id || path.targetRackId === selectedRack.code)) {
        setFetchedPath(null);
        return;
      }
      getNavigationPath(selectedRack.id)
        .then((navPath) => {
          if (navPath) {
            setFetchedPath(navPath);
          } else {
            setFetchedPath(null);
          }
        })
        .catch(() => {
          setFetchedPath(null);
        });
    } else {
      setFetchedPath(null);
    }
  }, [visible, selectedRack?.id, selectedRack?.code, path]);

  const activePath = fetchedPath || path;

  const racks = layout.racks;
  const canvas = layout.canvas;
  const gates = layout.gates.length > 0 ? layout.gates : [defaultGate];
  const startGate = gates.find((gate) => gate.code === activePath?.startGateCode) ?? gates[0];

  // Prefer API path.points when available (from suggestion or fetchedPath), fallback to local geometry
  const apiPathPoints: LayoutPoint[] = useMemo(() => {
    if (activePath?.points && activePath.points.length > 0) {
      return activePath.points;
    }
    return [];
  }, [activePath]);

  const localPoints = useMemo(
    () => selectedRack ? buildSafeWarehouseRoutePoints(startGate, selectedRack, layout.aisles, racks, canvas) : [],
    [canvas, layout.aisles, racks, selectedRack, startGate],
  );

  // Use API points if available, otherwise fall back to locally computed
  const points = apiPathPoints.length > 0 ? apiPathPoints : localPoints;

  const routePolylinePoints = useMemo(() => points.map((p) => `${p.xM},${p.yM}`).join(' '), [points]);
  // Prefer server-calculated distance; fallback to local geometry
  const distance = useMemo(
    () => activePath?.distanceM != null ? activePath.distanceM : calculateRouteDistance(points),
    [activePath?.distanceM, points],
  );
  const gateCode = activePath?.startGateCode ?? startGate.code;
  const currentRackCode = selectedRack?.code || 'RACK-02';
  const routeCenter = useMemo(
    () =>
      points.length > 0
        ? {
            xM: points.reduce((total, point) => total + point.xM, 0) / points.length,
            yM: points.reduce((total, point) => total + point.yM, 0) / points.length,
          }
        : { xM: canvas.widthM / 2, yM: canvas.heightM / 2 },
    [canvas.heightM, canvas.widthM, points],
  );

  useEffect(() => {
    if (visible) {
      const center = routeCenter;
      mapCenterRef.current = center;
      zoomRef.current = 1;
      setMapCenter(center);
      setZoomLevel(1);
      // Apply viewBox immediately via native props so Svg shows correct view
      // without waiting for the React state → render → prop cycle
      requestAnimationFrame(() => {
        applyNativeViewport(center, 1);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selectedRack?.id, selectedRack?.code, routeCenter]);

  const applyNativeViewport = (center: LayoutPoint, zoom: number) => {
    const nextViewBox = getMapViewBox(canvasRef.current, zoom, center);
    const nativeSvg = svgRef.current as unknown as {
      setNativeProps: (props: Record<string, unknown>) => void;
    };
    nativeSvg?.setNativeProps({
      minX: nextViewBox.xM,
      minY: nextViewBox.yM,
      vbWidth: nextViewBox.widthM,
      vbHeight: nextViewBox.heightM,
      align: 'xMidYMid',
      meetOrSlice: 0,
    });
  };

  const handleRackPress = (rack: WarehouseLayoutRack) => {
    setSelectedRack(rack);
  };

  const handleOpenRackViewer = () => {
    setRackViewerOpen(true);
  };

  const handleZoom = (delta: number) => {
    const nextZoom = clampMapZoom(Number((zoomRef.current + delta).toFixed(2)));
    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
    applyNativeViewport(mapCenterRef.current, nextZoom);
  };
  const handleZoomIn = () => handleZoom(0.25);
  const handleZoomOut = () => handleZoom(-0.25);
  const handleResetZoom = () => {
    zoomRef.current = 1;
    mapCenterRef.current = routeCenter;
    setZoomLevel(1);
    setMapCenter(routeCenter);
    applyNativeViewport(routeCenter, 1);
  };

  const handlePanStep = (dxPx: number, dyPx: number) => {
    const nextCenter = panMapCenter(
      mapCenterRef.current,
      canvasRef.current,
      zoomRef.current,
      mapSizeRef.current,
      { dxPx, dyPx },
    );
    mapCenterRef.current = nextCenter;
    setMapCenter(nextCenter);
    applyNativeViewport(nextCenter, zoomRef.current);
  };

  const mapPanResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
        onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponder: (event, gestureState) => event.nativeEvent.touches.length >= 2 || Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (event, gestureState) => event.nativeEvent.touches.length >= 2 || Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: (event) => {
          lastPanRef.current = { x: 0, y: 0 };
          const touches = event.nativeEvent.touches;
          pinchRef.current =
            touches.length >= 2
              ? {
                  distance: Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY),
                  zoom: zoomRef.current,
                }
              : null;
        },
        onPanResponderMove: (event, gestureState) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const nextDistance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            if (!pinchRef.current) {
              pinchRef.current = { distance: nextDistance, zoom: zoomRef.current };
              return;
            }
            const pinch = pinchRef.current;
            if (pinch && pinch.distance > 0) {
              const nextZoom = calculatePinchZoom(pinch.zoom, pinch.distance, nextDistance);
              zoomRef.current = nextZoom;
              applyNativeViewport(mapCenterRef.current, nextZoom);
            }
            return;
          }

          const dxPx = gestureState.dx - lastPanRef.current.x;
          const dyPx = gestureState.dy - lastPanRef.current.y;
          lastPanRef.current = { x: gestureState.dx, y: gestureState.dy };
          const nextCenter = panMapCenter(mapCenterRef.current, canvasRef.current, zoomRef.current, mapSizeRef.current, { dxPx, dyPx });
          mapCenterRef.current = nextCenter;
          applyNativeViewport(nextCenter, zoomRef.current);
        },
        onPanResponderRelease: () => {
          setZoomLevel(zoomRef.current);
          setMapCenter(mapCenterRef.current);
          pinchRef.current = null;
          lastPanRef.current = { x: 0, y: 0 };
        },
        onPanResponderTerminate: () => {
          setZoomLevel(zoomRef.current);
          setMapCenter(mapCenterRef.current);
          pinchRef.current = null;
          lastPanRef.current = { x: 0, y: 0 };
        },
        onShouldBlockNativeResponder: () => true,
      }),
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-center p-3">
        <View className="bg-white rounded-3xl overflow-hidden border border-[#e4e5e9]">
          {/* Header matching Web Image 3 */}
          <View className="p-4 border-b border-[#e4e5e9] flex-row items-center justify-between bg-white">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-[#101114]">Bản đồ đường đi trong kho</Text>
              <Text className="text-xs text-[#6c7078] mt-0.5">Chọn rack để xem đường đi, sau đó bấm Xem mặt kệ.</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-[#f5f6f8] rounded-full">
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Route Distance Sub-bar matching Web Image 3 */}
          <View className="bg-[#f8fafc] px-4 py-2.5 flex-row justify-between items-center border-b border-[#e2e8f0]">
            <View className="flex-row items-center gap-1.5">
              <Navigation size={15} color="#2563eb" />
              <Text className="text-xs font-bold text-[#1e40af]">Đường từ {gateCode}</Text>
            </View>
            <Text className="text-xs font-extrabold text-[#1d4ed8]">{distance.toLocaleString('vi-VN')} m</Text>
          </View>

          {/* SVG Canvas Map matching Web Image 3 Layout Grid */}
          <View className="px-2 py-3 bg-[#edf2f4] items-center justify-center">
            {loading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#0878f9" />
                <Text className="text-xs text-[#64748b] mt-2">Đang tải sơ đồ kho từ máy chủ backend...</Text>
              </View>
            ) : (
              <View
                className="w-full"
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setMapSize({ widthPx: Math.max(1, width), heightPx: Math.max(1, height) });
                }}
                {...mapPanResponder.panHandlers}
              >
                <View className="absolute right-2 top-2 z-20 flex-row bg-white/95 rounded-xl border border-[#cbd5e1] overflow-hidden shadow-sm">
                  <TouchableOpacity onPress={handleZoomOut} className="p-2 border-r border-[#e2e8f0]" accessibilityLabel="Thu nhỏ bản đồ">
                    <Minus size={15} color="#334155" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResetZoom} className="p-2 border-r border-[#e2e8f0]" accessibilityLabel="Đặt lại zoom bản đồ">
                    <Maximize2 size={15} color="#334155" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleZoomIn} className="p-2" accessibilityLabel="Phóng to bản đồ">
                    <Plus size={15} color="#334155" />
                  </TouchableOpacity>
                </View>

                {/* Directional Navigation Controls (Edge Overlay) */}
                <View className="absolute top-2 left-0 right-0 items-center z-10" pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={() => handlePanStep(0, 60)}
                    className="w-8 h-8 rounded-full bg-white/95 border border-[#cbd5e1] items-center justify-center shadow-sm active:bg-slate-100"
                    accessibilityLabel="Di chuyển lên"
                  >
                    <ChevronUp size={18} color="#334155" />
                  </TouchableOpacity>
                </View>

                <View className="absolute bottom-2 left-0 right-0 items-center z-10" pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={() => handlePanStep(0, -60)}
                    className="w-8 h-8 rounded-full bg-white/95 border border-[#cbd5e1] items-center justify-center shadow-sm active:bg-slate-100"
                    accessibilityLabel="Di chuyển xuống"
                  >
                    <ChevronDown size={18} color="#334155" />
                  </TouchableOpacity>
                </View>

                <View className="absolute left-2 top-0 bottom-0 justify-center z-10" pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={() => handlePanStep(60, 0)}
                    className="w-8 h-8 rounded-full bg-white/95 border border-[#cbd5e1] items-center justify-center shadow-sm active:bg-slate-100"
                    accessibilityLabel="Di chuyển sang trái"
                  >
                    <ChevronLeft size={18} color="#334155" />
                  </TouchableOpacity>
                </View>

                <View className="absolute right-2 top-0 bottom-0 justify-center z-10" pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={() => handlePanStep(-60, 0)}
                    className="w-8 h-8 rounded-full bg-white/95 border border-[#cbd5e1] items-center justify-center shadow-sm active:bg-slate-100"
                    accessibilityLabel="Di chuyển sang phải"
                  >
                    <ChevronRight size={18} color="#334155" />
                  </TouchableOpacity>
                </View>
                <WarehouseMapSvgContent
                  svgRef={svgRef}
                  canvas={canvas}
                  layout={layout}
                  racks={racks}
                  gates={gates}
                  points={points}
                  routePolylinePoints={routePolylinePoints}
                  currentRackCode={currentRackCode}
                  onRackPress={handleRackPress}
                />
              </View>
            )}
          </View>

          {/* Footer Bar matching Web Image 3 */}
          <View className="p-4 bg-white border-t border-[#e4e5e9]">
            <Text className="text-xs text-[#475569] mb-3 font-medium">
              Đã chọn <Text className="font-extrabold text-[#0f172a]">{currentRackCode}</Text>. Kiểm tra đường đi rồi mở mặt kệ khi đã sẵn sàng.
            </Text>

            <TouchableOpacity onPress={handleOpenRackViewer} className="bg-[#1d4ed8] py-3.5 px-4 rounded-xl flex-row items-center justify-center shadow-sm">
              <Text className="text-xs font-extrabold text-white">Xem mặt kệ {currentRackCode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rack Cell Viewer Modal */}
        <RackCellViewerModal
          visible={rackViewerOpen}
          rackId={selectedRack?.id}
          rackCode={currentRackCode}
          readOnly={readOnly}
          suggestedCellCodes={targetLocation ? [targetLocation] : []}
          onClose={() => setRackViewerOpen(false)}
          onBackToMap={() => setRackViewerOpen(false)}
          onSelectCell={(loc) => {
            if (onSelectLocation) onSelectLocation(loc);
          }}
          onConfirmScanCell={(loc) => {
            if (readOnly) return;
            setRackViewerOpen(false);
            onClose();
            if (onConfirmScanCell) {
              setTimeout(() => {
                onConfirmScanCell(loc);
              }, 100);
            }
          }}
        />
      </View>
    </Modal>
  );
}
