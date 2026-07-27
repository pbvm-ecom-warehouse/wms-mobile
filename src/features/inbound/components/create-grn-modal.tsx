import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  Square,
  X,
} from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppButton, StatusBadge } from '@/shared/ui';
import { createGoodsReceiptNote, listPurchaseOrdersForReceiving } from '../api/grn-api';
import type { GoodsReceiptNote, PurchaseOrderSummary } from '../types/grn';

interface CreateGrnModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (grn: GoodsReceiptNote) => void;
}

interface DraftItemState {
  itemId: string;
  sku: string;
  itemName?: string;
  expectedQty: number;
  actualQty: string;
  unit: string;
  lotNumber: string;
  expiryDate: string;
  note: string;
  selected: boolean;
}

export function CreateGrnModal({ visible, onClose, onSuccess }: CreateGrnModalProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);
  const [loadingPos, setLoadingPos] = useState(false);
  const [searchPo, setSearchPo] = useState('');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderSummary | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItemState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<number | null>(null);

  const handleSelectDate = (dateStr: string) => {
    if (activeDatePickerIndex !== null) {
      handleItemChange(activeDatePickerIndex, 'expiryDate', dateStr);
    }
    setActiveDatePickerIndex(null);
  };

  useEffect(() => {
    if (visible) {
      loadPos();
      setSelectedPo(null);
      setDraftItems([]);
      setErrorMsg(null);
      setSearchPo('');
      setActiveDatePickerIndex(null);
    }
  }, [visible]);

  const loadPos = async () => {
    setLoadingPos(true);
    setErrorMsg(null);
    try {
      const list = await listPurchaseOrdersForReceiving();
      setPurchaseOrders(list);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMsg(
          'Lỗi 403 Forbidden từ Server Deploy: Tài khoản RECEIVER chưa được cấp quyền xem PO. Cần redeploy Backend đã cập nhật @Roles hoặc đăng nhập bằng tài khoản ADMIN / MANAGER.',
        );
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn PO';
        setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
      }
    } finally {
      setLoadingPos(false);
    }
  };

  const handleSelectPo = (po: PurchaseOrderSummary) => {
    setSelectedPo(po);
    const initialItems: DraftItemState[] = (po.items || []).map((item) => ({
      itemId: item.itemId,
      sku: item.sku,
      itemName: item.itemName,
      expectedQty: item.expectedQty,
      actualQty: String(item.expectedQty),
      unit: item.unit || 'Cái',
      lotNumber: '',
      expiryDate: '',
      note: '',
      selected: true,
    }));
    setDraftItems(initialItems);
  };

  const handleItemChange = (index: number, key: keyof DraftItemState, value: any) => {
    setDraftItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const toggleSelectItem = (index: number) => {
    setDraftItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!selectedPo) return;
    setErrorMsg(null);

    const activeItems = draftItems.filter((i) => i.selected);

    if (activeItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 mặt hàng để nhập kho');
      return;
    }

    const invalidItem = activeItems.find(
      (item) => isNaN(Number(item.actualQty)) || Number(item.actualQty) <= 0,
    );
    if (invalidItem) {
      setErrorMsg(`Số lượng thực nhập cho SKU ${invalidItem.sku} phải là số dương`);
      return;
    }

    setSubmitting(true);
    try {
      const grn = await createGoodsReceiptNote({
        purchaseOrderId: selectedPo.id,
        items: activeItems.map((item) => ({
          itemId: item.itemId,
          actualQty: Number(item.actualQty),
          unit: item.unit,
          lotNumber: item.lotNumber?.trim() || undefined,
          expiryDate: item.expiryDate?.trim() || undefined,
          note: item.note?.trim() || undefined,
        })),
      });
      Alert.alert('Thành công', `Đã tạo phiếu nhập kho ${grn.grnNumber || ''}`);
      onSuccess(grn);
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMsg(
          'Lỗi 403 Forbidden từ Server: Tài khoản hiện tại chưa được phân quyền tạo phiếu nhập kho (POST /goods-receipt-notes). Vui lòng đăng nhập bằng tài khoản Quản lý (MANAGER / ADMIN) hoặc kiểm tra phân quyền tài khoản.',
        );
      } else {
        const msg =
          err?.response?.data?.message || err?.message || 'Tạo phiếu nhập kho thất bại';
        setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const query = searchPo.trim().toLowerCase();
  const filteredPos = purchaseOrders.filter((po) => {
    if (!query) return true;
    const matchPoNumber = po.poNumber?.toLowerCase().includes(query);
    const matchSupplier = po.supplierName?.toLowerCase().includes(query) || po.supplierCode?.toLowerCase().includes(query);
    return Boolean(matchPoNumber || matchSupplier);
  });

  const totalActualQty = draftItems
    .filter((i) => i.selected)
    .reduce((sum, item) => sum + (Number(item.actualQty) || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {selectedPo ? (
              <TouchableOpacity
                onPress={() => setSelectedPo(null)}
                style={styles.backBtn}
              >
                <ArrowLeft size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>Tạo Phiếu Nhập Kho</Text>
              <Text style={styles.subtitleText}>
                {selectedPo ? `Đơn mua: ${selectedPo.poNumber}` : 'Bước 1: Chọn Đơn hàng PO & Hàng thực nhận'}
              </Text>
            </View>
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
          {!selectedPo ? (
            /* STEP 1: Select PO */
            <View>
              {/* Header & Search */}
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>
                  Danh sách Đơn Mua Hàng (PO)
                </Text>
                <TouchableOpacity
                  onPress={loadPos}
                  disabled={loadingPos}
                  style={styles.reloadBtn}
                >
                  <RefreshCw size={13} color={colors.primary} />
                  <Text style={styles.reloadText}>Tải lại</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchPo}
                  onChangeText={setSearchPo}
                  placeholder="Tìm theo mã PO hoặc Nhà cung cấp..."
                />
                {searchPo ? (
                  <TouchableOpacity onPress={() => setSearchPo('')}>
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {loadingPos ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.mutedText}>
                    Đang tải danh sách đơn PO...
                  </Text>
                </View>
              ) : filteredPos.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Package size={36} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>
                    Không tìm thấy đơn PO
                  </Text>
                  <Text style={styles.emptyDesc}>
                    Chưa có đơn đặt hàng PO nào chờ nhận hàng hoặc khớp với từ khóa tìm kiếm.
                  </Text>
                </View>
              ) : (
                filteredPos.map((po) => (
                  <TouchableOpacity
                    key={po.id}
                    onPress={() => handleSelectPo(po)}
                    style={styles.poCard}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={styles.poNumberText}>{po.poNumber}</Text>
                        <StatusBadge variant="neutral" label={po.status || 'CONFIRMED'} />
                      </View>
                      <Text style={styles.supplierText}>
                        NCC: {po.supplierName || 'Chưa cập nhật'}
                      </Text>
                      <View style={styles.poMetaRow}>
                        <Text style={styles.metaText}>
                          Số SKU: <Text style={{ fontWeight: 'bold', color: '#101114' }}>{po.items?.length || 0} mặt hàng</Text>
                        </Text>
                        {po.orderDate ? (
                          <Text style={styles.metaText}>
                            Ngày đặt: <Text style={{ fontWeight: '500', color: '#101114' }}>{po.orderDate}</Text>
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.selectPoBtn}>
                      <Text style={styles.selectPoBtnText}>Chọn PO</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            /* STEP 2: Enter Item Details */
            <View style={{ paddingBottom: 40 }}>
              {/* Selected PO Summary Header */}
              <View style={styles.selectedPoCard}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.poLabelHeader}>
                    Đơn Đặt Hàng PO Được Chọn
                  </Text>
                  <Text style={styles.selectedPoNumber}>{selectedPo.poNumber}</Text>
                  <Text style={styles.metaText}>
                    Nhà cung cấp: <Text style={{ fontWeight: '600', color: '#101114' }}>{selectedPo.supplierName}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPo(null)}
                  style={styles.changePoBtn}
                >
                  <Text style={styles.changePoBtnText}>Đổi PO</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                Danh sách Hàng Thực Nhập ({draftItems.filter((i) => i.selected).length}/{draftItems.length} mặt hàng)
              </Text>

              {draftItems.map((item, index) => (
                <View
                  key={item.itemId || index}
                  style={[
                    styles.itemCard,
                    item.selected ? styles.itemCardSelected : styles.itemCardUnselected,
                  ]}
                >
                  {/* Item Header & Selection Checkbox */}
                  <View style={styles.itemCardHeader}>
                    <TouchableOpacity
                      onPress={() => toggleSelectItem(index)}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}
                    >
                      {item.selected ? (
                        <CheckSquare size={20} color="#0878f9" />
                      ) : (
                        <Square size={20} color={colors.textMuted} />
                      )}
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.itemNameText}>
                          {item.itemName || item.sku}
                        </Text>
                        <Text style={styles.skuText}>SKU: {item.sku}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.expectedQtyBadge}>
                      <Text style={styles.expectedQtyText}>
                        PO đặt: {item.expectedQty} {item.unit}
                      </Text>
                    </View>
                  </View>

                  {item.selected ? (
                    <View>
                      {/* Quantity & Lot Number Inputs */}
                      <View style={styles.flexRowGap}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>
                            Thực nhập ({item.unit}) <Text style={{ color: '#ef4444' }}>*</Text>
                          </Text>
                          <TextInput
                            style={[styles.inputField, { fontWeight: 'bold' }]}
                            keyboardType="numeric"
                            value={item.actualQty}
                            onChangeText={(val) => handleItemChange(index, 'actualQty', val)}
                            placeholder="Số lượng thực nhập"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Số Lô (Lot Number)</Text>
                          <TextInput
                            style={styles.inputField}
                            value={item.lotNumber}
                            onChangeText={(val) => handleItemChange(index, 'lotNumber', val)}
                            placeholder="VD: LOT-20260727"
                          />
                        </View>
                      </View>

                      {/* Expiry Date & Note Inputs */}
                      <View style={[styles.flexRowGap, { marginTop: 8 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Hạn Sử Dụng</Text>
                          {Platform.OS === 'web' ? (
                            <TextInput
                              style={styles.inputField}
                              // @ts-ignore
                              type="date"
                              value={item.expiryDate}
                              onChangeText={(val) => handleItemChange(index, 'expiryDate', val)}
                            />
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setActiveDatePickerIndex(index)}
                              style={styles.datePickerButton}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Calendar size={16} color="#6c7078" style={{ marginRight: 6 }} />
                                <Text
                                  style={[
                                    styles.datePickerText,
                                    !item.expiryDate && styles.datePickerPlaceholder,
                                  ]}
                                >
                                  {item.expiryDate || 'YYYY-MM-DD'}
                                </Text>
                              </View>
                              {item.expiryDate ? (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    // @ts-ignore
                                    if (e && e.stopPropagation) e.stopPropagation();
                                    handleItemChange(index, 'expiryDate', '');
                                  }}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                              ) : null}
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Ghi Chú</Text>
                          <TextInput
                            style={styles.inputField}
                            value={item.note}
                            onChangeText={(val) => handleItemChange(index, 'note', val)}
                            placeholder="Ghi chú hàng hóa"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.unselectedText}>
                      Bỏ chọn (không nhập mặt hàng này)
                    </Text>
                  )}
                </View>
              ))}

              {/* Submit Section */}
              <View style={{ marginTop: 16, marginBottom: 32 }}>
                <View style={styles.totalRow}>
                  <Text style={styles.metaText}>Tổng số lượng thực nhận:</Text>
                  <Text style={styles.totalQtyText}>{totalActualQty} sản phẩm</Text>
                </View>
                <AppButton
                  label="Xác Nhận Tạo Phiếu Nhập (DRAFT)"
                  loading={submitting}
                  onPress={handleSubmit}
                  icon={<CheckCircle2 size={18} color="#ffffff" />}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      <DatePickerModal
        visible={activeDatePickerIndex !== null}
        value={activeDatePickerIndex !== null ? draftItems[activeDatePickerIndex]?.expiryDate : ''}
        onSelect={handleSelectDate}
        onClose={() => setActiveDatePickerIndex(null)}
      />
    </Modal>
  );
}

interface DatePickerModalProps {
  visible: boolean;
  value?: string;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

function DatePickerModal({ visible, value, onSelect, onClose }: DatePickerModalProps) {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  useEffect(() => {
    if (visible) {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m] = value.split('-').map(Number);
        setYear(y);
        setMonth(m - 1);
      } else {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
      }
    }
  }, [visible, value]);

  if (!visible) return null;

  const getDaysArray = (y: number, m: number) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;

    const result: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < offset; i++) {
      result.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      result.push({ day: d, dateStr: `${y}-${monthStr}-${dayStr}` });
    }
    return result;
  };

  const days = getDaysArray(year, month);

  const monthLabels = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePreset = (monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onSelect(`${y}-${m}-${day}`);
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.dpOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.dpContent}>
          {/* Header */}
          <View style={styles.dpHeader}>
            <Text style={styles.dpTitle}>Chọn Hạn Sử Dụng</Text>
            <TouchableOpacity onPress={onClose} style={styles.dpCloseBtn}>
              <X size={18} color="#6c7078" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dpPresetsRow}>
            <TouchableOpacity style={styles.dpChip} onPress={() => handlePreset(0)}>
              <Text style={styles.dpChipText}>Hôm nay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpChip} onPress={() => handlePreset(3)}>
              <Text style={styles.dpChipText}>+3 Tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpChip} onPress={() => handlePreset(6)}>
              <Text style={styles.dpChipText}>+6 Tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpChip} onPress={() => handlePreset(12)}>
              <Text style={styles.dpChipText}>+1 Năm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpChip} onPress={() => handlePreset(24)}>
              <Text style={styles.dpChipText}>+2 Năm</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month / Year Navigator */}
          <View style={styles.dpNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.dpNavBtn}>
              <ChevronLeft size={20} color="#101114" />
            </TouchableOpacity>
            <Text style={styles.dpNavTitle}>
              {monthLabels[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.dpNavBtn}>
              <ChevronRight size={20} color="#101114" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.dpWeekRow}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <Text key={idx} style={styles.dpWeekText}>{w}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.dpGrid}>
            {days.map((item, idx) => {
              if (!item) {
                return <View key={`empty-${idx}`} style={styles.dpDayCell} />;
              }
              const isSelected = value === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[styles.dpDayCell, isSelected && styles.dpDayCellSelected]}
                  onPress={() => onSelect(item.dateStr)}
                >
                  <Text style={[styles.dpDayText, isSelected && styles.dpDayTextSelected]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ececf1',
  },
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f5f6f8',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f5f6f8',
    borderRadius: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101114',
  },
  subtitleText: {
    fontSize: 12,
    color: '#6c7078',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#ffebeb',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f8c4c4',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c83a3a',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#101114',
    marginBottom: 8,
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  reloadText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0878f9',
  },
  searchBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#101114',
    marginLeft: 8,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    fontSize: 12,
    color: '#6c7078',
    marginTop: 8,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101114',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#6c7078',
    textAlign: 'center',
    marginTop: 4,
  },
  poCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  supplierText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#101114',
  },
  poMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f5f6f8',
  },
  metaText: {
    fontSize: 12,
    color: '#6c7078',
  },
  selectPoBtn: {
    backgroundColor: '#0878f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectPoBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectedPoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poLabelHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0878f9',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  selectedPoNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101114',
  },
  changePoBtn: {
    backgroundColor: '#f5f6f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  changePoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c7078',
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemCardSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#0878f9',
  },
  itemCardUnselected: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e4e5e9',
    opacity: 0.6,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f6f8',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#101114',
  },
  skuText: {
    fontSize: 12,
    color: '#6c7078',
  },
  expectedQtyBadge: {
    backgroundColor: '#eaf3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expectedQtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  flexRowGap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c7078',
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: '#f5f6f8',
    borderWidth: 1,
    borderColor: '#e4e5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#101114',
  },
  unselectedText: {
    fontSize: 12,
    color: '#6c7078',
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalRow: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalQtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  datePickerButton: {
    backgroundColor: '#f5f6f8',
    borderWidth: 1,
    borderColor: '#e4e5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  datePickerText: {
    fontSize: 14,
    color: '#101114',
  },
  datePickerPlaceholder: {
    color: '#9ca3af',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f6f8',
  },
  iosModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101114',
  },
  iosModalDoneText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  dpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dpContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101114',
  },
  dpCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f5f6f8',
  },
  dpPresetsRow: {
    marginBottom: 12,
  },
  dpChip: {
    backgroundColor: '#eaf3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dpChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0878f9',
  },
  dpNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dpNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f5f6f8',
  },
  dpNavTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#101114',
  },
  dpWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dpWeekText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6c7078',
  },
  dpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dpDayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  dpDayCellSelected: {
    backgroundColor: '#0878f9',
  },
  dpDayText: {
    fontSize: 14,
    color: '#101114',
    fontWeight: '500',
  },
  dpDayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
