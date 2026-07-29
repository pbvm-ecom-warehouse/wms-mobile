import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Maximize2, Minus, Navigation, Plus, X } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { fetchWarehouseLayout, type WarehouseLayout, type WarehouseLayoutGate, type WarehouseLayoutRack } from '../api/putaway-api';
import type { NavigationPath } from '../types/putaway';
import { buildRackRoutePoints, calculateRouteDistance, getRackRect } from '../utils/warehouse-layout';
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

export function WarehouseRouteMapModal({ visible, onClose, path, targetLocation = 'RACK-02-T1-B1', readOnly = false, onSelectLocation, onConfirmScanCell }: WarehouseRouteMapModalProps) {
  const [selectedRack, setSelectedRack] = useState<WarehouseLayoutRack | null>(null);
  const [layout, setLayout] = useState<WarehouseLayout>(fallbackLayout);
  const [loading, setLoading] = useState(false);
  const [rackViewerOpen, setRackViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  if (!visible) return null;

  const racks = layout.racks;
  const canvas = layout.canvas;
  const gates = layout.gates.length > 0 ? layout.gates : [defaultGate];
  const startGate = gates.find((gate) => gate.code === path?.startGateCode) ?? gates[0];
  const selectedPathMatches = selectedRack ? path?.targetRackId === selectedRack.id || path?.targetRackId === selectedRack.code : false;
  const points = selectedPathMatches && path?.points?.length ? path.points : selectedRack ? buildRackRoutePoints(startGate, selectedRack) : [];

  const routePolylinePoints = points.map((p) => `${p.xM},${p.yM}`).join(' ');
  const distance = selectedPathMatches && path?.distanceM ? path.distanceM : calculateRouteDistance(points);
  const gateCode = path?.startGateCode ?? startGate.code;
  const currentRackCode = selectedRack?.code || 'RACK-02';
  const viewBoxWidth = (canvas.widthM + 2) / zoomLevel;
  const viewBoxHeight = (canvas.heightM + 2) / zoomLevel;
  const routeCenter =
    points.length > 0
      ? {
          xM: points.reduce((total, point) => total + point.xM, 0) / points.length,
          yM: points.reduce((total, point) => total + point.yM, 0) / points.length,
        }
      : { xM: canvas.widthM / 2, yM: canvas.heightM / 2 };
  const viewBoxX = Math.max(-1, Math.min(canvas.widthM + 1 - viewBoxWidth, routeCenter.xM - viewBoxWidth / 2));
  const viewBoxY = Math.max(-1, Math.min(canvas.heightM + 1 - viewBoxHeight, routeCenter.yM - viewBoxHeight / 2));
  const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;

  const handleRackPress = (rack: WarehouseLayoutRack) => {
    setSelectedRack(rack);
  };

  const handleOpenRackViewer = () => {
    setRackViewerOpen(true);
  };

  const handleZoomIn = () => setZoomLevel((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((value) => Math.max(1, Number((value - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1);

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
              <View className="w-full">
                <View className="absolute right-2 top-2 z-10 flex-row bg-white/95 rounded-xl border border-[#cbd5e1] overflow-hidden">
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
                <Svg width="100%" height="390" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
                  <Defs>
                    <Pattern id="operation-grid-mobile" width={canvas.gridM} height={canvas.gridM} patternUnits="userSpaceOnUse">
                      <Path d={`M ${canvas.gridM} 0 L 0 0 0 ${canvas.gridM}`} fill="none" stroke="#cbd5e1" strokeWidth="0.025" />
                    </Pattern>
                  </Defs>
                  {/* Outer Border */}
                  <Rect x="0" y="0" width={canvas.widthM} height={canvas.heightM} fill="#ffffff" stroke="#334155" strokeWidth="0.18" />
                  <Rect x="0" y="0" width={canvas.widthM} height={canvas.heightM} fill="url(#operation-grid-mobile)" />

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
                        onPress={() => handleRackPress(rack)}
                      />
                      <SvgText x={rect.xM + rect.widthM / 2} y={rect.yM + rect.heightM / 2 + 0.25} fontSize="0.55" fontWeight="bold" fill={isTarget ? '#78350f' : '#1e293b'} textAnchor="middle" onPress={() => handleRackPress(rack)}>
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
