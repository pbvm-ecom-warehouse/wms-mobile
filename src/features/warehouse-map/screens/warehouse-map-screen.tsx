import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Box, Layers, MapPin, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react-native';
import { RackCellViewerModal } from '@/features/putaway/components/rack-cell-viewer-modal';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, Screen, Surface } from '@/shared/ui';

// Canvas & layout grid definitions matching web fe-pbvm-warehouse
const layoutCanvas = { widthM: 32, heightM: 22 };

const warehouseZones = [
  { id: 'zone-A', code: 'ZONE-A', name: 'Khu vực Kho Hàng Khô', xM: 2, yM: 2, widthM: 13, heightM: 17, color: '#eff6ff', border: '#bfdbfe' },
  { id: 'zone-B', code: 'ZONE-B', name: 'Khu vực Kho Bao Bì', xM: 17, yM: 2, widthM: 13, heightM: 17, color: '#f0fdf4', border: '#bbf7d0' },
];

const warehouseRacks = [
  // Zone A Racks
  { id: 'rack-A1', code: 'A01', zoneId: 'zone-A', xM: 3, yM: 4, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 40 },
  { id: 'rack-A2', code: 'A02', zoneId: 'zone-A', xM: 9, yM: 4, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 65 },
  { id: 'rack-A3', code: 'A03', zoneId: 'zone-A', xM: 3, yM: 10, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 20 },
  { id: 'rack-A4', code: 'A04', zoneId: 'zone-A', xM: 9, yM: 10, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 80 },
  { id: 'rack-A5', code: 'A05', zoneId: 'zone-A', xM: 3, yM: 16, widthM: 10, heightM: 2, totalCells: 18, fillPercent: 35 },

  // Zone B Racks
  { id: 'rack-B1', code: 'B01', zoneId: 'zone-B', xM: 18, yM: 4, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 50 },
  { id: 'rack-B2', code: 'B02', zoneId: 'zone-B', xM: 24, yM: 4, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 90 },
  { id: 'rack-B3', code: 'B03', zoneId: 'zone-B', xM: 18, yM: 10, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 15 },
  { id: 'rack-B4', code: 'B04', zoneId: 'zone-B', xM: 24, yM: 10, widthM: 4, heightM: 2, totalCells: 9, fillPercent: 75 },
  { id: 'rack-B5', code: 'B05', zoneId: 'zone-B', xM: 18, yM: 16, widthM: 10, heightM: 2, totalCells: 18, fillPercent: 45 },
];

const warehouseGates = [
  { id: 'gate-1', code: 'GATE-01', name: 'Cổng Nhập Kho', xM: 1, yM: 20 },
  { id: 'gate-2', code: 'GATE-02', name: 'Cổng Xuất Kho', xM: 29, yM: 20 },
];

export function WarehouseMapScreen() {
  const [selectedRackCode, setSelectedRackCode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const totalRacks = warehouseRacks.length;
  const totalCells = warehouseRacks.reduce((acc, r) => acc + r.totalCells, 0);
  const avgFill = Math.round(
    warehouseRacks.reduce((acc, r) => acc + r.fillPercent, 0) / totalRacks,
  );

  return (
    <Screen withTabBar>
      <AppHeader
        title="Sơ Đồ Kho 2D (Warehouse Layout)"
        subtitle="Mặt bằng khu vực, dãy kệ và lối đi trực quan"
      />

      {/* Summary KPI Bar */}
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1 bg-white p-3 rounded-2xl border border-[#e4e5e9]">
          <Text className="text-[10px] font-bold text-[#6c7078] uppercase">Tổng dãy kệ</Text>
          <Text className="text-base font-extrabold text-[#101114] mt-0.5">{totalRacks} Kệ</Text>
        </View>
        <View className="flex-1 bg-white p-3 rounded-2xl border border-[#e4e5e9]">
          <Text className="text-[10px] font-bold text-[#6c7078] uppercase">Tổng khoang cất</Text>
          <Text className="text-base font-extrabold text-[#0878f9] mt-0.5">{totalCells} Khoang</Text>
        </View>
        <View className="flex-1 bg-white p-3 rounded-2xl border border-[#e4e5e9]">
          <Text className="text-[10px] font-bold text-[#6c7078] uppercase">Tỷ lệ lấp đầy</Text>
          <Text className="text-base font-extrabold text-[#16a34a] mt-0.5">{avgFill}%</Text>
        </View>
      </View>

      {/* Legend & Zoom Tools */}
      <View className="bg-white p-3 rounded-2xl border border-[#e4e5e9] mb-3 flex-row justify-between items-center">
        <View className="flex-row gap-3">
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-full bg-[#bfdbfe] border border-[#3b82f6]" />
            <Text className="text-[11px] text-[#334155] font-medium">Kho Hàng Khô</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-full bg-[#bbf7d0] border border-[#16a34a]" />
            <Text className="text-[11px] text-[#334155] font-medium">Kho Bao Bì</Text>
          </View>
        </View>

        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
            className="p-1.5 bg-[#f5f6f8] rounded-lg border border-[#e4e5e9]"
          >
            <ZoomIn size={16} color="#6c7078" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            className="p-1.5 bg-[#f5f6f8] rounded-lg border border-[#e4e5e9]"
          >
            <ZoomOut size={16} color="#6c7078" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2D Interactive SVG Floor Plan */}
      <ScrollView className="flex-1 bg-white rounded-3xl border border-[#e4e5e9] p-2 overflow-hidden mb-3">
        <View className="items-center justify-center py-2" style={{ transform: [{ scale: zoomLevel }] }}>
          <Svg
            width="100%"
            height="320"
            viewBox={`0 0 ${layoutCanvas.widthM} ${layoutCanvas.heightM}`}
          >
            {/* Outer Warehouse Wall */}
            <Rect
              x="0.5"
              y="0.5"
              width={layoutCanvas.widthM - 1}
              height={layoutCanvas.heightM - 1}
              fill="#fafafa"
              stroke="#cbd5e1"
              strokeWidth="0.3"
              rx="0.5"
            />

            {/* Zones */}
            {warehouseZones.map((zone) => (
              <G key={zone.id}>
                <Rect
                  x={zone.xM}
                  y={zone.yM}
                  width={zone.widthM}
                  height={zone.heightM}
                  fill={zone.color}
                  stroke={zone.border}
                  strokeWidth="0.2"
                  strokeDasharray="0.6 0.3"
                  rx="0.4"
                />
                <SvgText
                  x={zone.xM + zone.widthM / 2}
                  y={zone.yM + 1.2}
                  fontSize="0.85"
                  fontWeight="bold"
                  fill="#475569"
                  textAnchor="middle"
                >
                  {zone.name}
                </SvgText>
              </G>
            ))}

            {/* Racks */}
            {warehouseRacks.map((rack) => {
              const isSelected = selectedRackCode === rack.code;
              return (
                <G key={rack.id} onPress={() => setSelectedRackCode(rack.code)}>
                  <Rect
                    x={rack.xM}
                    y={rack.yM}
                    width={rack.widthM}
                    height={rack.heightM}
                    rx="0.2"
                    fill={isSelected ? '#fef3c7' : '#ffffff'}
                    stroke={isSelected ? '#d97706' : '#94a3b8'}
                    strokeWidth={isSelected ? '0.3' : '0.15'}
                  />

                  {/* Fill Gauge inside Rack */}
                  <Rect
                    x={rack.xM + 0.1}
                    y={rack.yM + rack.heightM - 0.4}
                    width={(rack.widthM - 0.2) * (rack.fillPercent / 100)}
                    height="0.3"
                    fill={rack.fillPercent > 75 ? '#ef4444' : rack.fillPercent > 40 ? '#f59e0b' : '#22c55e'}
                    rx="0.1"
                  />

                  <SvgText
                    x={rack.xM + rack.widthM / 2}
                    y={rack.yM + rack.heightM / 2}
                    fontSize="0.8"
                    fontWeight="bold"
                    fill={isSelected ? '#b45309' : '#1e293b'}
                    textAnchor="middle"
                  >
                    {rack.code}
                  </SvgText>
                </G>
              );
            })}

            {/* Gates */}
            {warehouseGates.map((gate) => (
              <G key={gate.id}>
                <Rect
                  x={gate.xM - 1}
                  y={gate.yM - 0.5}
                  width="2.5"
                  height="1"
                  fill="#0f766e"
                  rx="0.2"
                />
                <SvgText
                  x={gate.xM + 0.25}
                  y={gate.yM + 0.2}
                  fontSize="0.65"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  {gate.code}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      </ScrollView>

      {/* Rack Selector Grid Bar */}
      <Surface className="p-3 mb-3">
        <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
          Danh sách Kệ (Bấm để xem mặt kệ & khoang theo tầng):
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {warehouseRacks.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelectedRackCode(r.code)}
              className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                selectedRackCode === r.code
                  ? 'bg-[#eff6ff] border-[#3b82f6]'
                  : 'bg-[#f8fafc] border-[#e2e8f0]'
              }`}
            >
              <Box size={14} color={selectedRackCode === r.code ? '#2563eb' : '#64748b'} />
              <Text
                className={`text-xs font-bold ${
                  selectedRackCode === r.code ? 'text-[#1d4ed8]' : 'text-[#334155]'
                }`}
              >
                Kệ {r.code} ({r.fillPercent}%)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Surface>

      {/* Rack Cell Viewer Modal */}
      <RackCellViewerModal
        visible={Boolean(selectedRackCode)}
        rackCode={selectedRackCode || 'A01'}
        onClose={() => setSelectedRackCode(null)}
        onSelectCell={() => setSelectedRackCode(null)}
      />
    </Screen>
  );
}
