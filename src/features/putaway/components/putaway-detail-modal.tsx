import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.titleText}>
                Lệnh Cất Hàng #{activeTask.id.substring(0, 8).toUpperCase()}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text style={styles.subtitleText}>
              Phiếu Nhập PO/GRN: {activeTask.grnNumber || activeTask.grnId || 'N/A'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* General Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Thông tin lệnh cất hàng</Text>
            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Mã phiếu nhập (GRN ID):</Text>
              <Text style={styles.metaValueBold}>{activeTask.grnNumber || activeTask.grnId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Tổng số dòng hàng:</Text>
              <Text style={styles.metaValueBold}>{activeTask.items?.length || 0} sản phẩm</Text>
            </View>
          </View>

          {/* Line Confirm Drawer / Card */}
          {selectedItem ? (
            <View style={[styles.card, { borderColor: '#0878f9', borderWidth: 2 }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardHeader, { color: '#0878f9' }]}>
                  Xác nhận cất hàng: {selectedItem.sku}
                </Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <X size={18} color="#6c7078" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10, marginTop: 6 }}>
                <View>
                  <Text style={styles.fieldLabel}>Mã SKU / Barcode quét được *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemBarcode}
                    onChangeText={setItemBarcode}
                    placeholder="Quét mã SKU hoặc nhập mã..."
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Mã Kệ / Vị trí đích (Shelf Code) *</Text>
                  <TextInput
                    style={styles.input}
                    value={shelfCode}
                    onChangeText={setShelfCode}
                    placeholder="VD: SHELF-A01"
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Số lượng cất thực tế *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="1"
                  />
                </View>

                {/* Suggestions Card */}
                <View style={styles.suggestionBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={16} color="#d97706" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>
                      Gợi ý vị trí theo thể tích
                    </Text>
                  </View>

                  {loadingSuggestions ? (
                    <ActivityIndicator size="small" color="#d97706" style={{ marginVertical: 8 }} />
                  ) : suggestions.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {suggestions.map((s, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setShelfCode(s.shelfCode)}
                          style={styles.suggestionChip}
                        >
                          <Text style={styles.suggestionChipText}>
                            📍 {s.shelfCode} (Sức chứa: {s.capacity})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>
                      {warningMsg || 'Không tìm thấy vị trí gợi ý tự động. Hãy nhập mã kệ thủ công.'}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmSubmit}
                    disabled={confirmingLine}
                    style={styles.submitConfirmBtn}
                  >
                    <Text style={styles.submitConfirmText}>
                      {confirmingLine ? 'Đang lưu...' : 'Xác Nhận Cất Vào Kệ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {/* Items List */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Danh sách mặt hàng cần cất</Text>
            {activeTask.items && activeTask.items.length > 0 ? (
              activeTask.items.map((item, idx) => {
                const isDone = (item.remainingQty ?? 0) <= 0;
                return (
                  <View key={item.itemId || idx} style={styles.itemBox}>
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Package size={16} color={isDone ? '#16a34a' : '#0878f9'} />
                        <Text style={styles.itemName}>
                          {item.itemName || item.sku}
                        </Text>
                      </View>
                      <View style={[styles.qtyBadge, isDone ? { backgroundColor: '#dcfce7' } : null]}>
                        <Text style={[styles.qtyText, isDone ? { color: '#16a34a' } : null]}>
                          {isDone ? 'Đã cất đủ' : `Còn lại: ${item.remainingQty ?? item.quantity}`}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.subText}>
                      SKU: <Text style={styles.boldText}>{item.sku}</Text> · Tổng cần cất: {item.quantity} {item.unit || 'cái'}
                    </Text>

                    {item.lotNumber || item.lotId ? (
                      <Text style={styles.subText}>
                        Số lô: <Text style={styles.boldText}>{item.lotNumber || item.lotId}</Text>
                      </Text>
                    ) : null}

                    {canConfirm && !isDone ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleOpenConfirmLine(item)}
                          style={styles.confirmLineBtn}
                        >
                          <CheckCircle2 size={15} color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
                            Xác nhận cất hàng
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                Không có dòng hàng nào
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ececf1' },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: { fontSize: 16, fontWeight: 'bold', color: '#101114' },
  subtitleText: { fontSize: 12, color: '#6c7078', marginTop: 2 },
  closeBtn: { padding: 8, backgroundColor: '#f5f6f8', borderRadius: 20 },
  errorBox: {
    backgroundColor: '#ffebeb',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f8c4c4',
  },
  errorText: { fontSize: 12, fontWeight: '600', color: '#c83a3a' },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    marginBottom: 12,
  },
  cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#101114', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { fontSize: 12, color: '#6c7078' },
  metaValueBold: { fontSize: 12, fontWeight: 'bold', color: '#101114' },
  itemBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 13, fontWeight: 'bold', color: '#101114' },
  qtyBadge: { backgroundColor: '#ffebeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  qtyText: { fontSize: 11, fontWeight: 'bold', color: '#dc2626' },
  subText: { fontSize: 12, color: '#6c7078', marginTop: 3 },
  boldText: { color: '#101114', fontWeight: '600' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6c7078', marginBottom: 4 },
  input: {
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#101114',
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  suggestionBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  suggestionChipText: { fontSize: 11, fontWeight: 'bold', color: '#b45309' },
  confirmLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0878f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f6f8',
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#6c7078' },
  submitConfirmBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0878f9',
  },
  submitConfirmText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
});
