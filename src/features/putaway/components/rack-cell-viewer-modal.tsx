import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Box, CheckCircle2, Grid3X3, RefreshCw, X } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { listRackCells, type StorageCellView } from '../api/putaway-api';
import { RackSceneNative } from './rack-scene-native';

export interface StorageCellInfo {
  id: string;
  code: string;
  rackCode: string;
  level: number;
  bay: number;
  fillPercent: number;
  packageCount: number;
  usableCapacityPackages: number;
  statusText: string;
  isSuggested?: boolean;
  isFull?: boolean;
}

interface RackCellViewerModalProps {
  visible: boolean;
  rackId?: string;
  rackCode?: string;
  readOnly?: boolean;
  onClose: () => void;
  onBackToMap?: () => void;
  onSelectCell: (cellCode: string) => void;
  onConfirmScanCell?: (cellCode: string) => void;
  suggestedCellCodes?: string[];
  itemName?: string;
  sku?: string;
  lotNumber?: string;
}

export function RackCellViewerModal({
  visible,
  rackId,
  rackCode = '',
  readOnly = false,
  onClose,
  onBackToMap,
  onSelectCell,
  onConfirmScanCell,
  suggestedCellCodes = [],
  itemName,
  sku,
  lotNumber,
}: RackCellViewerModalProps) {
  const [realCells, setRealCells] = useState<StorageCellView[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCellCode, setSelectedCellCode] = useState<string | null>(null);
  const [mode, setMode] = useState<'3D' | 'GRID'>('GRID');

  const targetId = rackId || rackCode;

  const loadRackCells = useCallback(() => {
    if (!targetId) return;
    setLoading(true);
    setErrorMsg(null);

    listRackCells(targetId)
      .then((cells) => {
        setRealCells(cells || []);
      })
      .catch((err) => {
        console.warn('Lỗi tải khoang kệ:', err);
        setErrorMsg('Không thể kết nối API tải khoang kệ backend.');
        setRealCells([]);
      })
      .finally(() => setLoading(false));
  }, [targetId]);

  useEffect(() => {
    if (visible && targetId) {
      loadRackCells();
      setSelectedCellCode(null);
    }
  }, [visible, targetId, loadRackCells]);

  // Transform real backend cells OR generate rack layout grid if API returns empty
  const cells: StorageCellInfo[] = useMemo(() => {
    if (realCells && realCells.length > 0) {
      return realCells.map((rc) => {
        const isSuggested = suggestedCellCodes.some((sc) => sc.includes(rc.code) || rc.code.includes(sc));
        const pkgCount = rc.contents?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const fill = rc.fillPercent ?? 0;
        const remaining = Math.max(0, 72 - pkgCount);
        return {
          id: rc.id || `cell-${rc.level}-${rc.bay}`,
          code: rc.code || rc.barcode || `${rackCode}-T${rc.level}-B${rc.bay}`,
          rackCode,
          level: rc.level || 1,
          bay: rc.bay || 1,
          fillPercent: fill,
          packageCount: pkgCount,
          usableCapacityPackages: remaining,
          statusText: fill === 0 ? 'Trống · có thể cất' : fill < 100 ? 'Đang chứa hàng' : 'Đã đầy',
          isSuggested,
          isFull: fill >= 100 || rc.status === 'BLOCKED',
        };
      });
    }

    // Standard Grid fallback layout matching rackCode
    const baseCode = rackCode || 'RACK-02';
    const levelsCount = 3;
    const baysCount = 4;
    const items: StorageCellInfo[] = [];

    for (let l = levelsCount; l >= 1; l--) {
      for (let b = 1; b <= baysCount; b++) {
        const code = `${baseCode}-T${l}-B${b}`;
        const isSuggested = suggestedCellCodes.some((sc) => sc.includes(code) || code.includes(sc)) || (l === 1 && b === 1);
        const fillPercent = isSuggested ? 14 : 0;
        const pkgCount = isSuggested ? 10 : 0;
        const remaining = 72 - pkgCount;

        items.push({
          id: `cell-${l}-${b}`,
          code,
          rackCode: baseCode,
          level: l,
          bay: b,
          fillPercent,
          packageCount: pkgCount,
          usableCapacityPackages: remaining,
          statusText: fillPercent === 0 ? 'Trống · có thể cất' : 'Đang chứa hàng',
          isSuggested,
          isFull: fillPercent >= 100,
        });
      }
    }
    return items;
  }, [realCells, rackCode, suggestedCellCodes]);

  if (!visible) return null;

  const activeCell = cells.find((c) => c.code === selectedCellCode) || cells.find((c) => c.isSuggested) || cells[0];
  const sceneCells: StorageCellView[] =
    realCells.length > 0
      ? realCells
      : cells.map((cell) => ({
          id: cell.id,
          rackId: rackId ?? rackCode,
          level: cell.level,
          bay: cell.bay,
          code: cell.code,
          status: cell.isFull ? 'BLOCKED' : 'ACTIVE',
          innerWidth: 150,
          innerHeight: 100,
          innerDepth: 120,
          fillPercent: cell.fillPercent,
          contents: [],
        }));

  const maxLevel = Math.max(3, ...cells.map((c) => c.level));
  const levels = Array.from({ length: maxLevel }, (_, i) => maxLevel - i);

  const handleConfirmAction = (cellCodeOverride?: string) => {
    const targetCode = cellCodeOverride || activeCell?.code || `${rackCode || 'RACK-02'}-T1-B1`;
    setSelectedCellCode(targetCode);
    onSelectCell(targetCode);
    if (readOnly) return;
    onClose();

    if (onConfirmScanCell) {
      setTimeout(() => {
        onConfirmScanCell(targetCode);
      }, 100);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-[#f8fafc] rounded-t-3xl border-t border-[#e4e5e9] max-h-[92%] pb-6">
          {/* Header */}
          <View className="p-4 border-b border-[#e4e5e9] flex-row items-center justify-between bg-white rounded-t-3xl">
            <View className="flex-1">
              <Text className="text-base font-bold text-[#101114]">Mặt kệ {rackCode}</Text>
              <Text className="text-xs text-[#6c7078]">Xem sức chứa rồi nhấn vào khoang hợp lệ để quét mã.</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-[#f5f6f8] rounded-full">
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Bar matching Web Image 4 */}
          <View className="px-4 py-2.5 bg-white border-b border-[#e2e8f0] flex-row justify-between items-center">
            {onBackToMap ? (
              <TouchableOpacity onPress={onBackToMap} className="bg-[#eff6ff] border border-[#bfdbfe] px-3 py-1.5 rounded-xl">
                <Text className="text-xs font-bold text-[#1d4ed8]">Quay lại bản đồ</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-[#1e293b]">Mặt kệ {rackCode}</Text>
              </View>
            )}

            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={() => setMode('GRID')}
                className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border ${mode === 'GRID' ? 'bg-[#1e40af] border-[#1e40af]' : 'bg-white border-[#cbd5e1]'}`}
              >
                <Grid3X3 size={13} color={mode === 'GRID' ? '#ffffff' : '#475569'} />
                <Text className={`text-[11px] font-bold ${mode === 'GRID' ? 'text-white' : 'text-[#475569]'}`}>2D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('3D')}
                className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border ${mode === '3D' ? 'bg-[#1e40af] border-[#1e40af]' : 'bg-white border-[#cbd5e1]'}`}
              >
                <Box size={13} color={mode === '3D' ? '#ffffff' : '#475569'} />
                <Text className={`text-[11px] font-bold ${mode === '3D' ? 'text-white' : 'text-[#475569]'}`}>3D</Text>
              </TouchableOpacity>
            </View>
          </View>

          {errorMsg ? (
            <View className="bg-[#ffebeb] p-3 mx-4 mt-3 rounded-xl border border-[#f8c4c4] flex-row justify-between items-center">
              <Text className="text-xs text-[#c83a3a] flex-1 mr-2 font-medium">{errorMsg}</Text>
              <TouchableOpacity onPress={loadRackCells} className="p-1">
                <RefreshCw size={16} color="#c83a3a" />
              </TouchableOpacity>
            </View>
          ) : null}

          {mode === '3D' && !loading ? (
            <View className="h-[430px] bg-[#eef3f7] border-b border-[#e2e8f0]">
              <RackSceneNative cells={sceneCells} selectedCellId={sceneCells.find((cell) => cell.code === activeCell?.code)?.id} onSelectCell={(cell) => setSelectedCellCode(cell.code)} />
            </View>
          ) : (
            /* Grid Layout matching Web Image 4 */
            <ScrollView className="p-4">
              {loading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="small" color="#0878f9" />
                  <Text className="text-xs text-[#64748b] mt-2">Đang tải dữ liệu khoang kệ từ máy chủ...</Text>
                </View>
              ) : cells.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-xs font-semibold text-[#64748b]">Không có dữ liệu khoang chứa cho kệ này trên máy chủ</Text>
                </View>
              ) : (
                <View className="gap-3">
                  {levels.map((lvl) => {
                    const levelCells = cells.filter((c) => (c.level || 1) === lvl);
                    if (levelCells.length === 0) return null;

                    return (
                      <View key={`level-${lvl}`} className="flex-row items-start gap-2">
                        {/* Y-Axis Label */}
                        <View className="w-14 pt-3">
                          <Text className="text-xs font-bold text-[#475569]">Tầng {lvl}</Text>
                        </View>

                        {/* Cells Row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                          <View className="flex-row gap-2">
                            {levelCells.map((cell, cellIdx) => {
                              if (!cell) return null;
                              const cellCode = cell.code || `${rackCode}-T${lvl}-B${cellIdx + 1}`;
                              const isSelected = Boolean(activeCell && activeCell.code === cellCode);
                              const isSuggested = Boolean(cell.isSuggested);
                              const isFull = Boolean(cell.isFull);
                              const cellKey = cell.id || cellCode || `cell-${lvl}-${cellIdx}`;

                              return (
                                <TouchableOpacity
                                  key={cellKey}
                                  disabled={!readOnly && isFull}
                                  onPress={() => {
                                    setSelectedCellCode(cellCode);
                                    if (!readOnly) {
                                      if (onSelectCell) onSelectCell(cellCode);
                                      handleConfirmAction(cellCode);
                                    }
                                  }}
                                  className={`w-36 p-3 rounded-2xl border ${
                                    isSelected
                                      ? 'bg-[#eff6ff] border-[#1d4ed8] border-2 shadow-sm'
                                      : isSuggested
                                        ? 'bg-[#f0fdf4] border-[#86efac]'
                                        : isFull
                                          ? 'bg-[#f1f5f9] border-[#cbd5e1]'
                                          : 'bg-white border-[#e2e8f0]'
                                  }`}
                                >
                                  <Text className="text-xs font-bold text-[#1e293b]">{cellCode}</Text>
                                  <Text className="text-[11px] text-[#64748b] mt-0.5">
                                    {cell.fillPercent || 0}% đầy · {cell.packageCount || 0} thùng
                                  </Text>

                                  <Text className={`text-[11px] font-semibold mt-1.5 ${isSuggested ? 'text-[#15803d]' : 'text-[#64748b]'}`}>
                                    {isSuggested ? 'Vị trí cất' : cell.statusText || 'Trống'}
                                  </Text>

                                  <Text className="text-[10px] text-[#94a3b8] mt-0.5">Còn vừa {cell.usableCapacityPackages ?? 72} thùng</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Selected Cell Inspector Panel */}
              {activeCell ? (
                <View className="mt-4 bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm">
                  <View className="flex-row justify-between items-center pb-2 border-b border-[#f1f5f9]">
                    <View>
                      <Text className="text-sm font-extrabold text-[#0f172a]">{activeCell.code}</Text>
                      <Text className="text-xs text-[#64748b]">
                        Tầng {activeCell.level} · Khoang {activeCell.bay}
                      </Text>
                    </View>
                    <View className="bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                      <Text className="text-xs font-bold text-[#1d4ed8]">{activeCell.fillPercent}% đầy</Text>
                    </View>
                  </View>

                  {activeCell.isSuggested ? (
                    <View className="bg-[#f0fdf4] p-3 rounded-xl border border-[#bbf7d0] mt-3 flex-row items-center gap-2">
                      <CheckCircle2 size={18} color="#16a34a" />
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-[#15803d]">Vị trí cất hàng</Text>
                        <Text className="text-xs text-[#166534]">Khoang còn nhận tối đa {activeCell.usableCapacityPackages} thùng theo thể tích.</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Product Detail Box inside Cell */}
                  <View className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0] mt-3">
                    {itemName ? <Text className="text-sm font-extrabold text-[#1e293b]">{itemName}</Text> : null}

                    {sku ? <Text className="text-xs font-bold text-[#0878f9] mt-0.5">SKU: {sku}</Text> : null}

                    <Text className="text-xs font-extrabold text-[#0f172a] mt-1.5">
                      {activeCell.packageCount > 0 ? `Số lượng: ${activeCell.packageCount} thùng` : 'Khoang hiện tại đang trống (0 thùng)'}
                      {lotNumber ? ` · Lô ${lotNumber}` : ''}
                    </Text>
                  </View>

                  {!readOnly ? (
                    <TouchableOpacity onPress={() => handleConfirmAction()} className="bg-[#1d4ed8] py-3.5 rounded-xl items-center justify-center mt-3 shadow-sm">
                      <Text className="text-xs font-extrabold text-white">Chọn khoang và quét mã</Text>
                    </TouchableOpacity>
                  ) : activeCell.isSuggested || (suggestedCellCodes && suggestedCellCodes.includes(activeCell.code)) ? (
                    <View className="bg-[#f0fdf4] py-3 rounded-xl items-center justify-center mt-3 border border-[#86efac]">
                      <Text className="text-xs font-extrabold text-[#15803d]">Đã cất tại khoang này</Text>
                    </View>
                  ) : (
                    <View className="bg-[#f8fafc] py-3 rounded-xl items-center justify-center mt-3 border border-[#cbd5e1]">
                      <Text className="text-xs font-bold text-[#64748b]">Khoang khác trên kệ</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
