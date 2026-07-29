import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, AlertTriangle, Box, Calendar, CheckCircle2, Lightbulb, MapPin, Navigation, Package, RefreshCw, Route, X } from 'lucide-react-native';
import type { GoodsReceiptNote } from '@/features/inbound/types/grn';
import { useAuth } from '@/features/auth/context/auth-context';
import { formatApiError } from '@/shared/lib/api-client';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { StatusBadge } from '@/shared/ui';
import { getPutawaySuggestions, getPutawayTask } from '../api/putaway-api';
import type {
  NavigationPath,
  PutawayShelfSuggestion,
  PutawaySuggestionReason,
  PutawayTask,
  PutawayTaskItem,
} from '../types/putaway';
import { PutawayScanConfirmModal } from './putaway-scan-confirm-modal';
import { RackCellViewerModal } from './rack-cell-viewer-modal';
import { WarehouseRouteMapModal } from './warehouse-route-map-modal';

interface PutawayDetailModalProps {
  visible: boolean;
  task: PutawayTask | null;
  receipts?: GoodsReceiptNote[];
  onClose: () => void;
  onUpdate: (updated: PutawayTask) => void;
}

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' }
> = {
  PENDING: { label: 'Đang cất', variant: 'warning' },
  COMPLETED: { label: 'Đã cất hàng', variant: 'success' },
};

function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr || dateStr === 'Chưa cập nhật') return 'Chưa cập nhật';
  try {
    const raw = dateStr.trim();
    if (raw.includes('T')) {
      const datePart = raw.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;

    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return raw;
  } catch {
    return dateStr;
  }
}

export function PutawayDetailModal({
  visible,
  task,
  receipts = [],
  onClose,
  onUpdate,
}: PutawayDetailModalProps) {
  const { user } = useAuth();
  const [detailTask, setDetailTask] = useState<PutawayTask | null>(task);
  const [loading, setLoading] = useState(false);

  // Active Line Item State
  const [selectedItem, setSelectedItem] = useState<PutawayTaskItem | null>(null);

  // Modals State
  const [mapVisible, setMapVisible] = useState(false);
  const [scanConfirmVisible, setScanConfirmVisible] = useState(false);
  const [targetCellCode, setTargetCellCode] = useState('RACK-02-T1-B1');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<PutawayShelfSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Selected suggestion state (mirrors web's chosenCellId)
  const [chosenCellId, setChosenCellId] = useState('');

  const resolveItemSku = (item: PutawayTaskItem, grnId?: string): string => {
    if (item.sku && item.sku.trim() && !item.sku.startsWith('SKU-')) return item.sku.trim();
    const receipt = receipts.find((r) => r.id === (grnId || activeTask?.grnId));
    const grnItem = receipt?.items?.find((i) => i.itemId === item.itemId);
    return grnItem?.sku?.trim() || item.sku?.trim() || item.itemId;
  };

  const handleSelectItem = (item: PutawayTaskItem, grnId?: string) => {
    const sku = resolveItemSku(item, grnId);
    setSelectedItem(item);
    fetchSuggestions(item, sku, item.remainingQty ?? item.quantity ?? 1);
  };

  useEffect(() => {
    if (visible && task?.id) {
      setDetailTask(task);
      setLoading(true);

      const items = task.items || [];
      const pendingItem = items.find((i) => (i.remainingQty ?? i.quantity ?? 0) > 0) || items[0];
      if (pendingItem) {
        handleSelectItem(pendingItem, task.grnId);
      }

      getPutawayTask(task.id)
        .then((fresh) => {
          if (fresh) {
            setDetailTask(fresh);
            const freshItems = fresh.items || [];
            const freshPending = freshItems.find((i) => (i.remainingQty ?? i.quantity ?? 0) > 0) || freshItems[0];
            if (freshPending) {
              handleSelectItem(freshPending, fresh.grnId);
            }
          }
        })
        .catch((err) => console.warn('Lỗi tải chi tiết Putaway task:', err))
        .finally(() => setLoading(false));
    } else {
      setDetailTask(null);
      setSelectedItem(null);
      setMapVisible(false);
      setScanConfirmVisible(false);
    }
  }, [visible, task?.id]);

  const activeTask = detailTask || task;
  if (!activeTask) return null;

  const currentItem = selectedItem || activeTask.items?.[0];
  const currentGrn = receipts.find((r) => r.id === activeTask.grnId || r.grnNumber === activeTask.grnNumber);
  const grnItem = currentGrn?.items?.find((i) => i.itemId === currentItem?.itemId || i.sku === currentItem?.sku);

  const itemSku = currentItem ? resolveItemSku(currentItem) : grnItem?.sku || '';
  const itemName = currentItem?.itemName || grnItem?.itemName || itemSku || 'Sản phẩm';
  const grnNum = activeTask.grnNumber || currentGrn?.grnNumber || activeTask.grnId || 'Chưa cập nhật';
  const lotNum = currentItem?.lotNumber || grnItem?.lotNumber || currentItem?.lotId || 'Chưa cập nhật';
  const mfgDate = formatDateOnly(currentItem?.manufacturedDate || grnItem?.manufacturedDate);
  const packageDim = currentItem?.packageSpec
    ? `${currentItem.packageSpec.depthCm} × ${currentItem.packageSpec.widthCm} × ${currentItem.packageSpec.heightCm} cm`
    : 'Chưa cập nhật';
  const remQty = currentItem?.remainingQty ?? currentItem?.quantity ?? 0;
  const isCompleted = activeTask.status === 'COMPLETED' || remQty <= 0;

  const fetchSuggestions = async (item: PutawayTaskItem, resolvedSku: string, pkgCount: number) => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    setSuggestionsError(null);
    setWarningMsg(null);
    setChosenCellId('');
    try {
      const res = await getPutawaySuggestions({
        sku: resolvedSku,
        packageCount: pkgCount,
        lotId: item.lotId || undefined,
        packageSpec: item.packageSpec,
      });
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
        const top = res.suggestions[0];
        if (top) {
          setTargetCellCode(top.cellCode || top.shelfCode || 'RACK-02-T1-B1');
        }
      } else {
        setTargetCellCode('RACK-02-T1-B1');
      }
    } catch (err: any) {
      console.warn('Lỗi tải gợi ý vị trí:', err);
      setSuggestionsError('Không lấy được gợi ý vị trí.');
      setTargetCellCode('RACK-02-T1-B1');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const primaryCellCode = currentItem?.shelfCode || suggestions[0]?.cellCode || suggestions[0]?.shelfCode || targetCellCode;

  const handleOpenScanConfirm = (cellCodeToUse?: string) => {
    if (isCompleted) return;
    if (cellCodeToUse) {
      setTargetCellCode(cellCodeToUse);
    }
    setScanConfirmVisible(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="bg-[#f8fafc] border border-[#cbd5e1] px-3 py-1.5 rounded-xl">
            <Text className="text-xs font-bold text-[#334155]">Quay lại danh sách</Text>
          </TouchableOpacity>

          <Text className="text-base font-extrabold text-[#101114]">Cất hàng</Text>

          <TouchableOpacity onPress={() => task?.id && getPutawayTask(task.id)} className="bg-[#f8fafc] border border-[#cbd5e1] px-3 py-1.5 rounded-xl">
            <Text className="text-xs font-bold text-[#334155]">Làm mới</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {/* Product Header Card */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-base font-extrabold text-[#0f172a]">{itemName}</Text>
                <Text className="text-xs font-bold text-[#64748b] mt-0.5">{itemSku}</Text>
              </View>
              {isCompleted ? (
                <View className="bg-[#f0fdf4] px-3 py-1 rounded-lg border border-[#86efac]">
                  <Text className="text-xs font-extrabold text-[#16a34a]">Đã hoàn thành</Text>
                </View>
              ) : (
                <View className="bg-[#eff6ff] px-3 py-1 rounded-lg border border-[#bfdbfe]">
                  <Text className="text-xs font-extrabold text-[#1d4ed8]">Đang cất</Text>
                </View>
              )}
            </View>

            {/* 4 Metadata Cards Grid */}
            <View className="flex-row flex-wrap gap-2">
              <View className="flex-1 min-w-[45%] bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <Text className="text-[10px] font-bold text-[#64748b] uppercase">Phiếu nhập</Text>
                <Text className="text-xs font-extrabold text-[#0f172a] mt-0.5">{grnNum}</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <Text className="text-[10px] font-bold text-[#64748b] uppercase">Số lô</Text>
                <Text className="text-xs font-extrabold text-[#0f172a] mt-0.5">{lotNum}</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <Text className="text-[10px] font-bold text-[#64748b] uppercase">Kích thước thùng</Text>
                <Text className="text-xs font-extrabold text-[#0f172a] mt-0.5">{packageDim}</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                <Text className="text-[10px] font-bold text-[#64748b] uppercase">Ngày sản xuất</Text>
                <Text className="text-xs font-extrabold text-[#0f172a] mt-0.5">{mfgDate}</Text>
              </View>
            </View>
          </View>

          {/* Section: View-Only Completed Banner OR Active Putaway Guidance */}
          {isCompleted ? (
            <View className="bg-[#f0fdf4] p-4 rounded-2xl border-2 border-[#16a34a] mb-3 shadow-sm">
              <Text className="text-xs font-bold text-[#15803d] uppercase">Trạng thái cất hàng</Text>
              <Text className="text-base font-extrabold text-[#14532d] mt-1">
                Đã cất hàng thành công tại khoang: <Text className="text-[#15803d]">{primaryCellCode}</Text>
              </Text>
              <Text className="text-xs font-semibold text-[#166534] mt-1">
                Số lượng đã cất: {currentItem?.quantity || activeTask.items?.[0]?.quantity || 0} thùng
              </Text>

              <TouchableOpacity
                onPress={() => setMapVisible(true)}
                className="bg-white border border-[#86efac] py-2.5 px-4 rounded-xl mt-3 items-center shadow-sm"
              >
                <Text className="text-xs font-extrabold text-[#15803d]">Xem vị trí trên bản đồ kho</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <View className="flex-row justify-between items-center pb-3 border-b border-[#f1f5f9] mb-3">
                <Text className="text-sm font-bold text-[#0f172a]">Hướng dẫn cất hàng</Text>
                <View className="bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  <Text className="text-[11px] font-bold text-[#1d4ed8]">
                    {itemSku} · còn {remQty} thùng
                  </Text>
                </View>
              </View>

              {/* Subsection: Vị trí đề xuất */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Route size={14} color="#0878f9" />
                  <Text className="text-xs font-bold text-[#475569]">Vị trí đề xuất</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setMapVisible(true)}
                  className="bg-white border border-[#cbd5e1] px-3 py-1.5 rounded-xl shadow-sm flex-row items-center gap-1.5"
                >
                  <MapPin size={12} color="#334155" />
                  <Text className="text-xs font-extrabold text-[#1e293b]">Mở bản đồ kho</Text>
                </TouchableOpacity>
              </View>

              {/* Loading state */}
              {loadingSuggestions ? (
                <View className="flex-row items-center gap-2 py-3">
                  <ActivityIndicator size="small" color="#0878f9" />
                  <Text className="text-xs text-[#64748b]">Đang tính vị trí và đường đi...</Text>
                </View>
              ) : null}

              {/* Error state */}
              {!loadingSuggestions && suggestionsError ? (
                <View className="bg-[#fff1f2] border border-[#fecdd3] p-3 rounded-xl mb-2">
                  <Text className="text-xs text-[#be123c]">{suggestionsError}</Text>
                </View>
              ) : null}

              {/* Empty state */}
              {!loadingSuggestions && !suggestionsError && suggestions.length === 0 ? (
                <View className="bg-[#fffbeb] border border-[#fde68a] p-3 rounded-xl mb-2 flex-row items-center gap-2">
                  <AlertTriangle size={14} color="#92400e" />
                  <Text className="text-xs text-[#92400e] flex-1">
                    Chưa có khoang đủ điều kiện hoặc rack chưa nối với lối đi.
                  </Text>
                </View>
              ) : null}

              {/* Suggestion cards grid — mirrors web */}
              {!loadingSuggestions && suggestions.length > 0 ? (
                <View className="gap-2">
                  {suggestions.map((suggestion, index) => {
                    const cellCode = suggestion.cellCode || suggestion.shelfCode || '';
                    const isSelected = chosenCellId === (suggestion.cellId || cellCode);
                    const reasonLabel =
                      suggestion.reason === 'SAME_SKU_LOT_CELL'
                        ? 'Đã có cùng SKU và lô'
                        : suggestion.reason === 'SAME_SKU_CELL'
                        ? 'Đã có cùng SKU'
                        : suggestion.reason === 'BEST_FIT_VOLUME'
                        ? 'Vừa thể tích nhất'
                        : `Chứa thêm ${suggestion.capacity ?? 0} thùng`;

                    return (
                      <TouchableOpacity
                        key={`${suggestion.cellId}-${index}`}
                        onPress={() => {
                          const id = suggestion.cellId || cellCode;
                          setChosenCellId(id);
                          setTargetCellCode(cellCode);
                        }}
                        activeOpacity={0.8}
                        className={`rounded-xl border p-3 ${
                          isSelected
                            ? 'border-[#0878f9] bg-[#eff6ff]'
                            : 'border-[#e2e8f0] bg-white'
                        }`}
                      >
                        {/* Row 1: cell code + Ưu tiên badge */}
                        <View className="flex-row items-center justify-between">
                          <Text className="font-mono text-sm font-bold text-[#0f172a]">
                            {cellCode}
                          </Text>
                          {index === 0 ? (
                            <View className="bg-[#1d4ed8] px-2 py-0.5 rounded-md">
                              <Text className="text-[10px] font-bold text-white">Ưu tiên</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Row 2: Tầng · Khoang · distance */}
                        <Text className="text-[11px] text-[#64748b] mt-1.5">
                          Tầng {suggestion.level ?? '—'} · Khoang {suggestion.bay ?? '—'}{suggestion.path?.distanceM != null ? ` · ${suggestion.path.distanceM} m` : ''}
                        </Text>

                        {/* Row 3: reason */}
                        <Text className="text-[11px] font-semibold text-[#0f172a] mt-1">
                          {reasonLabel}
                        </Text>

                        {/* Row 4: HSD (if any) */}
                        {suggestion.path?.distanceM != null || suggestion.fillPercent != null ? (
                          <Text className="text-[11px] text-[#64748b] mt-0.5">
                            {suggestion.fillPercent != null ? `Đầy ${suggestion.fillPercent}%` : ''}
                          </Text>
                        ) : null}

                        {/* Confirm button when selected */}
                        {isSelected ? (
                          <TouchableOpacity
                            onPress={() => handleOpenScanConfirm(cellCode)}
                            className="mt-2.5 bg-[#1d4ed8] py-2 rounded-xl items-center"
                          >
                            <Text className="text-xs font-bold text-white">Chọn cất vào đây</Text>
                          </TouchableOpacity>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* 2D Route Map Modal matching Web Image 3 */}
        {(() => {
          const activeSuggestion = suggestions.find(
            (s) => (s.cellId && s.cellId === chosenCellId) || (s.cellCode && s.cellCode === targetCellCode),
          ) || suggestions[0];

          return (
            <WarehouseRouteMapModal
              visible={mapVisible}
              onClose={() => setMapVisible(false)}
              path={activeSuggestion?.path}
              targetLocation={primaryCellCode}
              readOnly={isCompleted}
              onSelectLocation={(loc) => {
                setTargetCellCode(loc);
              }}
              onConfirmScanCell={(loc) => {
                if (!isCompleted) {
                  handleOpenScanConfirm(loc);
                }
              }}
            />
          );
        })()}

        {/* Scan Confirmation Modal matching Web Image 5 */}
        <PutawayScanConfirmModal
          visible={scanConfirmVisible}
          taskId={activeTask.id}
          item={currentItem}
          initialCellCode={targetCellCode}
          suggestedCellId={suggestions[0]?.cellId}
          maxQuantity={remQty}
          onClose={() => setScanConfirmVisible(false)}
          onSuccess={(updated) => {
            setScanConfirmVisible(false);
            setMapVisible(false);
            onClose();
            setTimeout(() => {
              onUpdate(updated);
            }, 100);
          }}
        />
      </View>
    </Modal>
  );
}
