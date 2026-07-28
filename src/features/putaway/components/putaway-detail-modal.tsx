import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, Lightbulb, Package, X } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { AppButton, StatusBadge } from '@/shared/ui';
import { confirmPutawayLine, getPutawaySuggestions, getPutawayTask } from '../api/putaway-api';
import type {
  PutawayShelfSuggestion,
  PutawayTask,
  PutawayTaskItem,
} from '../types/putaway';

interface PutawayDetailModalProps {
  visible: boolean;
  task: PutawayTask | null;
  onClose: () => void;
  onUpdate: (updated: PutawayTask) => void;
}

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' }
> = {
  PENDING: { label: 'Chờ sắp xếp', variant: 'warning' },
  COMPLETED: { label: 'Đã cất hàng', variant: 'success' },
};

export function PutawayDetailModal({
  visible,
  task,
  onClose,
  onUpdate,
}: PutawayDetailModalProps) {
  const { user } = useAuth();
  const [detailTask, setDetailTask] = useState<PutawayTask | null>(task);
  const [loading, setLoading] = useState(false);

  // Line Confirm Form State
  const [selectedItem, setSelectedItem] = useState<PutawayTaskItem | null>(null);
  const [itemBarcode, setItemBarcode] = useState('');
  const [shelfCode, setShelfCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [confirmingLine, setConfirmingLine] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<PutawayShelfSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && task?.id) {
      setDetailTask(task);
      setLoading(true);
      getPutawayTask(task.id)
        .then((fresh) => {
          if (fresh) setDetailTask(fresh);
        })
        .catch((err) => console.warn('Lỗi tải chi tiết Putaway task:', err))
        .finally(() => setLoading(false));
    } else {
      setDetailTask(null);
      setSelectedItem(null);
    }
  }, [visible, task?.id]);

  const activeTask = detailTask || task;
  if (!activeTask) return null;

  const userRole = user?.role?.toUpperCase();
  const canConfirm =
    activeTask.status === 'PENDING' &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const handleOpenConfirmLine = (item: PutawayTaskItem) => {
    setSelectedItem(item);
    setItemBarcode(item.sku || '');
    setShelfCode(item.shelfCode || 'SHELF-A1-01');
    const rem = item.remainingQty ?? item.quantity ?? 1;
    setQuantity(String(rem > 0 ? rem : 1));
    fetchSuggestions(item.sku, rem > 0 ? rem : 1);
  };

  const fetchSuggestions = async (sku: string, qty: number) => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    setWarningMsg(null);
    try {
      const res = await getPutawaySuggestions({ sku, quantity: qty });
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
      if (res.warning) {
        setWarningMsg(`Cảnh báo hệ thống: ${res.warning}`);
      }
    } catch (err: any) {
      console.warn('Lỗi tải gợi ý vị trí:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedItem) return;
    if (!itemBarcode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng quét hoặc nhập mã SKU / Barcode');
      return;
    }
    if (!shelfCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập vị trí/kệ hàng (Shelf Code)');
      return;
    }
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Thông báo', 'Số lượng xác nhận phải lớn hơn 0');
      return;
    }

    setConfirmingLine(true);
    setErrorMsg(null);

    try {
      const updated = await confirmPutawayLine(activeTask.id, {
        itemBarcode: itemBarcode.trim(),
        shelfCode: shelfCode.trim(),
        quantity: qtyNum,
        lotId: selectedItem.lotId || undefined,
      });

      Alert.alert(
        'Thành công',
        `Đã xác nhận cất ${qtyNum} sản phẩm vào kệ ${shelfCode.trim()}`,
      );
      setSelectedItem(null);
      setDetailTask(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Xác nhận dòng cất hàng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setConfirmingLine(false);
    }
  };

  const badgeConfig = statusBadgeMap[activeTask.status] || {
    label: activeTask.status,
    variant: 'neutral',
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-[#101114]">
                Lệnh Cất Hàng #{activeTask.id.substring(0, 8).toUpperCase()}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text className="text-xs text-[#6c7078] mt-0.5">
              Phiếu Nhập PO/GRN: {activeTask.grnNumber || activeTask.grnId || 'N/A'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-[#f5f6f8] rounded-full">
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View className="bg-[#ffebeb] p-3 mx-4 mt-3 rounded-xl border border-[#f8c4c4]">
            <Text className="text-xs font-semibold text-[#c83a3a]">{errorMsg}</Text>
          </View>
        ) : null}

        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {/* General Card */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Thông tin lệnh cất hàng</Text>
            <View className="flex-row justify-between py-1.5 border-b border-[#f5f6f8]">
              <Text className="text-xs text-[#6c7078]">Mã phiếu nhập (GRN ID):</Text>
              <Text className="text-xs font-bold text-[#101114]">{activeTask.grnNumber || activeTask.grnId}</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-[#6c7078]">Tổng số dòng hàng:</Text>
              <Text className="text-xs font-bold text-[#101114]">{activeTask.items?.length || 0} sản phẩm</Text>
            </View>
          </View>

          {/* Line Confirm Drawer / Card */}
          {selectedItem ? (
            <View className="bg-white p-4 rounded-2xl border-2 border-[#0878f9] mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold text-[#0878f9] uppercase">
                  Xác nhận cất hàng: {selectedItem.sku}
                </Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <X size={18} color="#6c7078" />
                </TouchableOpacity>
              </View>

              <View className="gap-2.5 mt-1.5">
                <View>
                  <Text className="text-xs font-semibold text-[#6c7078] mb-1">Mã SKU / Barcode quét được *</Text>
                  <TextInput
                    className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                    value={itemBarcode}
                    onChangeText={setItemBarcode}
                    placeholder="Quét mã SKU hoặc nhập mã..."
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-[#6c7078] mb-1">Mã Kệ / Vị trí đích (Shelf Code) *</Text>
                  <TextInput
                    className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                    value={shelfCode}
                    onChangeText={setShelfCode}
                    placeholder="VD: SHELF-A01"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-[#6c7078] mb-1">Số lượng cất thực tế *</Text>
                  <TextInput
                    className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="1"
                  />
                </View>

                {/* Suggestions Card */}
                <View className="bg-[#fffbeb] p-3 rounded-xl border border-[#fde68a] mt-1">
                  <View className="flex-row items-center gap-1.5">
                    <Lightbulb size={16} color="#d97706" />
                    <Text className="text-xs font-bold color-[#b45309]">
                      Gợi ý vị trí theo thể tích
                    </Text>
                  </View>

                  {loadingSuggestions ? (
                    <ActivityIndicator size="small" color="#d97706" className="my-2" />
                  ) : suggestions.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1.5 mt-2">
                      {suggestions.map((s, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setShelfCode(s.shelfCode)}
                          className="bg-[#fef3c7] px-2.5 py-1 rounded-lg border border-[#fde68a]"
                        >
                          <Text className="text-xs font-semibold text-[#92400e]">
                            📍 {s.shelfCode} (Sức chứa: {s.capacity})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-[11px] text-[#b45309] mt-1 italic">
                      {warningMsg || 'Không tìm thấy vị trí gợi ý tự động. Hãy nhập mã kệ thủ công.'}
                    </Text>
                  )}
                </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    className="flex-1 bg-[#f5f6f8] border border-[#e4e5e9] py-2.5 rounded-xl items-center"
                  >
                    <Text className="text-xs font-bold text-[#6c7078]">Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmSubmit}
                    disabled={confirmingLine}
                    className="flex-[2] bg-[#0878f9] py-2.5 rounded-xl items-center"
                  >
                    <Text className="text-xs font-bold text-white">
                      {confirmingLine ? 'Đang lưu...' : 'Xác Nhận Cất Vào Kệ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {/* Items List */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Danh sách mặt hàng cần cất</Text>
            {activeTask.items && activeTask.items.length > 0 ? (
              activeTask.items.map((item, idx) => {
                const isDone = (item.remainingQty ?? 0) <= 0;
                return (
                  <View key={item.itemId || idx} className="bg-[#f5f6f8] p-3 rounded-xl mb-2 border border-[#e4e5e9]">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-1.5 flex-1">
                        <Package size={16} color={isDone ? '#16a34a' : '#0878f9'} />
                        <Text className="text-sm font-bold text-[#101114]">
                          {item.itemName || item.sku}
                        </Text>
                      </View>
                      <View className={`px-2 py-0.5 rounded-lg ${isDone ? 'bg-[#dcfce7]' : 'bg-[#eaf3ff]'}`}>
                        <Text className={`text-xs font-bold ${isDone ? 'text-[#16a34a]' : 'text-[#0878f9]'}`}>
                          {isDone ? 'Đã cất đủ' : `Còn lại: ${item.remainingQty ?? item.quantity}`}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-[#6c7078] mt-1">
                      SKU: <Text className="font-bold text-[#101114]">{item.sku}</Text> · Tổng cần cất: {item.quantity} {item.unit || 'cái'}
                    </Text>

                    {item.lotNumber || item.lotId ? (
                      <Text className="text-xs text-[#6c7078]">
                        Số lô: <Text className="font-bold text-[#101114]">{item.lotNumber || item.lotId}</Text>
                      </Text>
                    ) : null}

                    {canConfirm && !isDone ? (
                      <View className="flex-row justify-end mt-2">
                        <TouchableOpacity
                          onPress={() => handleOpenConfirmLine(item)}
                          className="flex-row items-center gap-1.5 bg-[#0878f9] px-3 py-1.5 rounded-xl"
                        >
                          <CheckCircle2 size={15} color="#ffffff" />
                          <Text className="text-xs font-bold text-white">
                            Xác nhận cất hàng
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text className="text-xs text-[#9ca3af] italic">
                Không có dòng hàng nào
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
