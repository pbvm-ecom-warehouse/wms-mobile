import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package,
  RefreshCw,
  Search,
  Square,
  X,
} from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { formatApiError } from '@/shared/lib/api-client';
import { AppAlertModal, AppAlertModalProps, AppButton, StatusBadge } from '@/shared/ui';
import { createGoodsReceiptNote, listPurchaseOrdersForReceiving } from '../api/grn-api';
import type { GoodsReceiptNote, PurchaseOrderSummary } from '../types/grn';
import {
  formatLotNumber,
  isCalendarDate,
  normalizeLotSequence,
  todayInHoChiMinh,
} from '../utils/lot-number';

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
  remainingQty: number;
  actualQty: string;
  unit: string;
  manufacturedDate: string;
  lotSequence: string;
  lotNumber: string;
  expiryDate: string;
  note: string;
  isPerishable: boolean;
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

  // Custom App UI Alert/Confirm state
  const [alertState, setAlertState] = useState<AppAlertModalProps | null>(null);

  const showAlert = (config: Omit<AppAlertModalProps, 'visible'>) => {
    setAlertState({
      ...config,
      visible: true,
      onClose: () => setAlertState(null),
    });
  };
  const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<{
    index: number;
    field: 'manufacturedDate' | 'expiryDate';
  } | null>(null);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  const handleSelectDate = (dateStr: string) => {
    if (activeDatePickerIndex !== null) {
      const { index, field } = activeDatePickerIndex;
      handleItemChange(index, field, dateStr);
    }
    setActiveDatePickerIndex(null);
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Cần cấp quyền',
          message: 'Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh minh chứng.',
          variant: 'warning',
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (err: any) {
      showAlert({ title: 'Lỗi', message: err?.message || 'Không thể mở máy ảnh', variant: 'danger' });
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Cần cấp quyền',
          message: 'Ứng dụng cần quyền truy cập thư viện ảnh.',
          variant: 'warning',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        setEvidenceImages((prev) => [...prev, ...uris]);
      }
    } catch (err: any) {
      showAlert({ title: 'Lỗi', message: err?.message || 'Không thể mở thư viện ảnh', variant: 'danger' });
    }
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (visible) {
      loadPos();
      setSelectedPo(null);
      setDraftItems([]);
      setErrorMsg(null);
      setSearchPo('');
      setActiveDatePickerIndex(null);
      setEvidenceImages([]);
    }
  }, [visible]);

  const loadPos = async () => {
    setLoadingPos(true);
    setErrorMsg(null);
    try {
      const list = await listPurchaseOrdersForReceiving();
      setPurchaseOrders(list);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn PO';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoadingPos(false);
    }
  };

  const handleSelectPo = (po: PurchaseOrderSummary) => {
    setSelectedPo(po);
    const today = todayInHoChiMinh();
    const initialItems: DraftItemState[] = (po.items || []).map((item, idx) => {
      const seq = normalizeLotSequence(idx + 1);
      const defaultLot = formatLotNumber(today, seq);
      const targetQty = item.remainingQty != null && item.remainingQty > 0 ? item.remainingQty : item.expectedQty;

      return {
        itemId: item.itemId,
        sku: item.sku,
        itemName: item.itemName,
        expectedQty: item.expectedQty,
        remainingQty: item.remainingQty ?? item.expectedQty,
        actualQty: String(targetQty),
        unit: item.unit || 'Cái',
        manufacturedDate: today,
        lotSequence: seq,
        lotNumber: defaultLot,
        expiryDate: '',
        note: '',
        isPerishable: Boolean(item.isPerishable),
        selected: true,
      };
    });
    setDraftItems(initialItems);
  };

  const handleItemChange = (index: number, key: keyof DraftItemState, value: any) => {
    setDraftItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [key]: value };

      if (key === 'manufacturedDate' || key === 'lotSequence') {
        const autoLot = formatLotNumber(current.manufacturedDate, current.lotSequence);
        if (autoLot) {
          current.lotNumber = autoLot;
        }
      }

      next[index] = current;
      return next;
    });
  };

  const toggleSelectItem = (index: number) => {
    setDraftItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedPo) return;

    const activeItems = draftItems.filter((i) => i.selected);
    if (activeItems.length === 0) {
      showAlert({
        title: 'Cảnh báo',
        message: 'Vui lòng chọn ít nhất 1 mặt hàng thực nhận để tạo phiếu nhập kho.',
        variant: 'warning',
      });
      return;
    }

    const today = todayInHoChiMinh();

    for (const item of activeItems) {
      const qtyNum = Number(item.actualQty);
      if (isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
        showAlert({
          title: 'Số lượng không hợp lệ',
          message: `Số thùng/mặt hàng thực nhận cho SKU "${item.sku}" phải là số nguyên lớn hơn 0.`,
          variant: 'warning',
        });
        return;
      }

      if (!item.manufacturedDate || !isCalendarDate(item.manufacturedDate)) {
        showAlert({
          title: 'Ngày sản xuất không hợp lệ',
          message: `Mặt hàng "${item.itemName || item.sku}" cần có ngày sản xuất đúng định dạng (YYYY-MM-DD).`,
          variant: 'warning',
        });
        return;
      }

      if (item.manufacturedDate > today) {
        showAlert({
          title: 'Ngày sản xuất không hợp lệ',
          message: `Ngày sản xuất cho "${item.itemName || item.sku}" không được sau ngày hiện tại.`,
          variant: 'warning',
        });
        return;
      }

      if (item.isPerishable && !item.expiryDate) {
        showAlert({
          title: 'Thiếu hạn sử dụng',
          message: `Mặt hàng "${item.itemName || item.sku}" có hạn sử dụng — cần nhập hạn sử dụng.`,
          variant: 'warning',
        });
        return;
      }

      if (item.expiryDate && !isCalendarDate(item.expiryDate)) {
        showAlert({
          title: 'Hạn sử dụng không hợp lệ',
          message: `Hạn sử dụng cho "${item.itemName || item.sku}" không đúng định dạng YYYY-MM-DD.`,
          variant: 'warning',
        });
        return;
      }

      if (item.expiryDate && item.manufacturedDate && item.expiryDate <= item.manufacturedDate) {
        showAlert({
          title: 'Hạn sử dụng không hợp lệ',
          message: `Hạn sử dụng cho "${item.itemName || item.sku}" phải sau ngày sản xuất.`,
          variant: 'warning',
        });
        return;
      }
    }

    const seenLots = new Set<string>();
    for (const item of activeItems) {
      if (item.lotNumber) {
        const key = `${item.itemId}:${item.lotNumber}`;
        if (seenLots.has(key)) {
          showAlert({
            title: 'Trùng số lô',
            message: `Mặt hàng "${item.itemName || item.sku}" bị trùng số lô (${item.lotNumber}) trong cùng phiếu nhập.`,
            variant: 'warning',
          });
          return;
        }
        seenLots.add(key);
      }
    }

    if (evidenceImages.length === 0) {
      showAlert({
        title: 'Bắt buộc có ảnh minh chứng',
        message: 'Hệ thống yêu cầu bắt buộc chụp hoặc chọn ít nhất 1 ảnh minh chứng khi tạo phiếu nhập kho.',
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const grn = await createGoodsReceiptNote({
        purchaseOrderId: selectedPo.id,
        items: activeItems.map((i) => ({
          itemId: i.itemId,
          actualQty: Number(i.actualQty),
          lotNumber: i.lotNumber,
          manufacturedDate: i.manufacturedDate,
          expiryDate: i.expiryDate || undefined,
          note: i.note || undefined,
        })),
        images: evidenceImages,
      });

      showAlert({
        title: 'Thành công',
        message: `Đã tạo phiếu nhập kho ${grn.grnNumber || grn.id} thành công!${
          evidenceImages.length > 0 ? ` (kèm ${evidenceImages.length} ảnh minh chứng)` : ''
        }`,
        variant: 'success',
        onConfirm: () => {
          setAlertState(null);
          onSuccess(grn);
          onClose();
        },
      });
    } catch (err: any) {
      setErrorMsg(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const query = searchPo.trim().toLowerCase();
  const filteredPos = purchaseOrders.filter((po) => {
    if (!query) return true;
    return (
      po.poNumber?.toLowerCase().includes(query) ||
      po.supplierName?.toLowerCase().includes(query)
    );
  });

  const totalActualQty = draftItems
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + (Number(i.actualQty) || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Modal Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            {selectedPo ? (
              <TouchableOpacity
                onPress={() => setSelectedPo(null)}
                className="p-1.5 bg-[#f5f6f8] rounded-full mr-1"
              >
                <ArrowLeft size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#101114]">Tạo Phiếu Nhập Kho</Text>
              <Text className="text-xs text-[#6c7078] mt-0.5">
                {selectedPo ? `Đơn mua: ${selectedPo.poNumber}` : 'Bước 1: Chọn Đơn hàng PO & Hàng thực nhận'}
              </Text>
            </View>
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
          {!selectedPo ? (
            /* STEP 1: Select PO */
            <View>
              {/* Header & Search */}
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-bold text-[#101114]">
                  Danh sách Đơn Mua Hàng (PO)
                </Text>
                <TouchableOpacity
                  onPress={loadPos}
                  disabled={loadingPos}
                  className="flex-row items-center gap-1 bg-[#eaf3ff] px-2.5 py-1 rounded-lg"
                >
                  <RefreshCw size={13} color={colors.primary} />
                  <Text className="text-xs font-bold text-[#0878f9]">Tải lại</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View className="bg-white flex-row items-center px-3 py-2 rounded-xl border border-[#e4e5e9] mb-3">
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  className="flex-1 ml-2 text-xs text-[#101114]"
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
                <View className="py-10 items-center justify-center gap-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-xs text-[#6c7078]">
                    Đang tải danh sách đơn PO...
                  </Text>
                </View>
              ) : filteredPos.length === 0 ? (
                <View className="py-10 items-center justify-center px-4 bg-white rounded-2xl border border-dashed border-[#e4e5e9]">
                  <Package size={36} color={colors.textMuted} />
                  <Text className="text-sm font-bold text-[#101114] mt-2">
                    Không tìm thấy đơn PO
                  </Text>
                  <Text className="text-xs text-[#6c7078] text-center mt-1">
                    Chưa có đơn đặt hàng PO nào chờ nhận hàng hoặc khớp với từ khóa tìm kiếm.
                  </Text>
                </View>
              ) : (
                filteredPos.map((po) => (
                  <TouchableOpacity
                    key={po.id}
                    onPress={() => handleSelectPo(po)}
                    className="bg-white p-3.5 rounded-2xl border border-[#e4e5e9] mb-2.5 flex-row items-center justify-between"
                    activeOpacity={0.8}
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-sm font-bold text-[#0878f9]">{po.poNumber}</Text>
                        <StatusBadge variant="neutral" label={po.status || 'CONFIRMED'} />
                      </View>
                      <Text className="text-xs font-semibold text-[#101114] mb-1">
                        NCC: {po.supplierName || 'Chưa cập nhật'}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <Text className="text-xs text-[#6c7078]">
                          Số SKU: <Text className="font-bold text-[#101114]">{po.items?.length || 0} mặt hàng</Text>
                        </Text>
                        {po.orderDate ? (
                          <Text className="text-xs text-[#6c7078]">
                            Ngày đặt: <Text className="font-medium text-[#101114]">{po.orderDate}</Text>
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="bg-[#0878f9] px-3 py-1.5 rounded-xl">
                      <Text className="text-xs font-bold text-white">Chọn PO</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            /* STEP 2: Enter Item Details */
            <View className="pb-10">
              {/* Selected PO Summary Header */}
              <View className="bg-[#eaf3ff] p-3.5 rounded-2xl border border-[#0878f9] mb-3 flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-[11px] font-bold text-[#0878f9] uppercase mb-0.5">
                    Đơn Đặt Hàng PO Được Chọn
                  </Text>
                  <Text className="text-base font-bold text-[#101114] mb-0.5">{selectedPo.poNumber}</Text>
                  <Text className="text-xs text-[#6c7078]">
                    Nhà cung cấp: <Text className="font-semibold text-[#101114]">{selectedPo.supplierName}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPo(null)}
                  className="bg-white border border-[#0878f9] px-3 py-1.5 rounded-xl"
                >
                  <Text className="text-xs font-bold text-[#0878f9]">Đổi PO</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-sm font-bold text-[#101114] mb-2">
                Danh sách Hàng Thực Nhập ({draftItems.filter((i) => i.selected).length}/{draftItems.length} mặt hàng)
              </Text>

              {draftItems.map((item, index) => (
                <View
                  key={item.itemId || index}
                  className={`bg-white p-3.5 rounded-2xl border mb-2.5 ${
                    item.selected ? 'border-[#0878f9]' : 'border-[#e4e5e9] opacity-70'
                  }`}
                >
                  {/* Item Header & Selection Checkbox */}
                  <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity
                      onPress={() => toggleSelectItem(index)}
                      className="flex-row items-center flex-1 mr-2"
                    >
                      {item.selected ? (
                        <CheckSquare size={20} color="#0878f9" />
                      ) : (
                        <Square size={20} color={colors.textMuted} />
                      )}
                      <View className="ml-2.5 flex-1">
                        <Text className="text-sm font-bold text-[#101114]">
                          {item.itemName || item.sku}
                        </Text>
                        <Text className="text-xs text-[#6c7078]">SKU: {item.sku}</Text>
                      </View>
                    </TouchableOpacity>

                    <View className="bg-[#f5f6f8] px-2 py-1 rounded-lg border border-[#e4e5e9]">
                      <Text className="text-xs font-bold text-[#6c7078]">
                        Còn lại: {item.remainingQty} {item.unit} (Đặt {item.expectedQty})
                      </Text>
                    </View>
                  </View>

                  {item.selected ? (
                    <View>
                      {/* Quantity & Manufactured Date */}
                      <View className="flex-row gap-2 mt-2">
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">
                            Thực nhập ({item.unit}) <Text className="text-[#ef4444]">*</Text>
                          </Text>
                          <TextInput
                            className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114] font-bold"
                            keyboardType="numeric"
                            value={item.actualQty}
                            onChangeText={(val) => handleItemChange(index, 'actualQty', val)}
                            placeholder="Số lượng thùng/cái"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">
                            Ngày Sản Xuất <Text className="text-[#ef4444]">*</Text>
                          </Text>
                          {Platform.OS === 'web' ? (
                            <TextInput
                              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                              // @ts-ignore
                              type="date"
                              value={item.manufacturedDate}
                              onChangeText={(val) => handleItemChange(index, 'manufacturedDate', val)}
                            />
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setActiveDatePickerIndex({ index, field: 'manufacturedDate' })}
                              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 flex-row items-center justify-between"
                            >
                              <View className="flex-row items-center flex-1">
                                <Calendar size={16} color="#6c7078" className="mr-1.5" />
                                <Text className="text-xs font-medium text-[#101114]">
                                  {item.manufacturedDate || 'YYYY-MM-DD'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Lot Sequence & Auto Lot Number */}
                      <View className="flex-row gap-2 mt-2">
                        <View className="w-1/3">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">SEQ (001-999)</Text>
                          <TextInput
                            className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                            keyboardType="numeric"
                            maxLength={3}
                            value={item.lotSequence}
                            onChangeText={(val) => handleItemChange(index, 'lotSequence', val)}
                            placeholder="001"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">Số Lô (LOT-YYMMDD-SEQ)</Text>
                          <TextInput
                            className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114] font-semibold"
                            value={item.lotNumber}
                            onChangeText={(val) => handleItemChange(index, 'lotNumber', val)}
                            placeholder="LOT-260728-001"
                          />
                        </View>
                      </View>

                      {/* Expiry Date & Note Inputs */}
                      <View className="flex-row gap-2 mt-2">
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">
                            Hạn Sử Dụng {item.isPerishable ? <Text className="text-[#ef4444]">*</Text> : null}
                          </Text>
                          {Platform.OS === 'web' ? (
                            <TextInput
                              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                              // @ts-ignore
                              type="date"
                              value={item.expiryDate}
                              onChangeText={(val) => handleItemChange(index, 'expiryDate', val)}
                            />
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setActiveDatePickerIndex({ index, field: 'expiryDate' })}
                              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 flex-row items-center justify-between"
                            >
                              <View className="flex-row items-center flex-1">
                                <Calendar size={16} color="#6c7078" className="mr-1.5" />
                                <Text
                                  className={`text-xs font-medium ${
                                    item.expiryDate ? 'text-[#101114]' : 'text-[#9ca3af]'
                                  }`}
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
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-[#6c7078] mb-1">Ghi Chú</Text>
                          <TextInput
                            className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                            value={item.note}
                            onChangeText={(val) => handleItemChange(index, 'note', val)}
                            placeholder="Ghi chú hàng hóa"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Text className="text-xs italic text-[#9ca3af] mt-1">
                      Bỏ chọn (không nhập mặt hàng này)
                    </Text>
                  )}
                </View>
              ))}

              {/* Evidence Images Section */}
              <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mt-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-[#6c7078] uppercase">
                    Ảnh minh chứng nhập kho ({evidenceImages.length})
                  </Text>
                </View>

                <View className="flex-row gap-2 my-2">
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    className="flex-row items-center gap-1.5 bg-[#0878f9] px-3 py-2 rounded-xl"
                  >
                    <Camera size={16} color="#ffffff" />
                    <Text className="text-[#ffffff] font-bold text-xs">Chụp ảnh trực tiếp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="flex-row items-center gap-1.5 bg-[#f5f6f8] border border-[#e4e5e9] px-3 py-2 rounded-xl"
                  >
                    <ImageIcon size={16} color="#0878f9" />
                    <Text className="text-[#101114] font-medium text-xs">Thư viện ảnh</Text>
                  </TouchableOpacity>
                </View>

                {evidenceImages.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pt-1.5">
                    {evidenceImages.map((uri, idx) => (
                      <View key={idx} className="relative mr-3 mt-1">
                        <Image source={{ uri }} className="w-[80px] h-[80px] rounded-xl" />
                        <TouchableOpacity
                          onPress={() => handleRemoveImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-[#ef4444] rounded-full p-1"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={12} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text className="text-xs color-[#9ca3af] italic mt-1">
                    Chưa chụp/chọn ảnh minh chứng nào. Bấm nút phía trên để chụp hoặc tải ảnh hàng hóa.
                  </Text>
                )}
              </View>

              {/* Submit Section */}
              <View className="mt-4 mb-8">
                <View className="flex-row justify-between items-center bg-white p-3.5 rounded-xl border border-[#e4e5e9] mb-3">
                  <Text className="text-xs text-[#6c7078]">Tổng số lượng thực nhận:</Text>
                  <Text className="text-base font-bold text-[#0878f9]">{totalActualQty} sản phẩm</Text>
                </View>
                <AppButton
                  label="Xác Nhận Tạo Phiếu Nhập (Nháp)"
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
        value={
          activeDatePickerIndex !== null
            ? draftItems[activeDatePickerIndex.index]?.[activeDatePickerIndex.field]
            : ''
        }
        onSelect={handleSelectDate}
        onClose={() => setActiveDatePickerIndex(null)}
      />

      {/* Custom Stock Mate App UI Alert / Confirm Modal */}
      <AppAlertModal {...(alertState || { title: '' })} visible={Boolean(alertState?.visible)} />
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
      <TouchableOpacity className="flex-1 bg-black/45 justify-center items-center p-4" activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} className="w-full max-w-[360px] bg-white rounded-2xl p-4 shadow-lg">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-[#101114]">Chọn Ngày</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-[#f5f6f8]">
              <X size={18} color="#6c7078" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <TouchableOpacity className="bg-[#eaf3ff] px-3 py-1.5 rounded-full mr-2" onPress={() => handlePreset(0)}>
              <Text className="text-xs font-semibold text-[#0878f9]">Hôm nay</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#eaf3ff] px-3 py-1.5 rounded-full mr-2" onPress={() => handlePreset(3)}>
              <Text className="text-xs font-semibold text-[#0878f9]">+3 Tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#eaf3ff] px-3 py-1.5 rounded-full mr-2" onPress={() => handlePreset(6)}>
              <Text className="text-xs font-semibold text-[#0878f9]">+6 Tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#eaf3ff] px-3 py-1.5 rounded-full mr-2" onPress={() => handlePreset(12)}>
              <Text className="text-xs font-semibold text-[#0878f9]">+1 Năm</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month / Year Navigator */}
          <View className="flex-row justify-between items-center mb-3 px-1">
            <TouchableOpacity onPress={handlePrevMonth} className="p-1.5 rounded-lg bg-[#f5f6f8]">
              <ChevronLeft size={20} color="#101114" />
            </TouchableOpacity>
            <Text className="text-sm font-bold text-[#101114]">
              {monthLabels[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} className="p-1.5 rounded-lg bg-[#f5f6f8]">
              <ChevronRight size={20} color="#101114" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View className="flex-row justify-around mb-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <Text key={idx} className="w-9 text-center text-xs font-bold text-[#6c7078]">{w}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View className="flex-row flex-wrap justify-start">
            {days.map((item, idx) => {
              if (!item) {
                return <View key={`empty-${idx}`} className="w-[14.28%] h-10 justify-center items-center my-0.5 rounded-lg" />;
              }
              const isSelected = value === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  className={`w-[14.28%] h-10 justify-center items-center my-0.5 rounded-lg ${
                    isSelected ? 'bg-[#0878f9]' : ''
                  }`}
                  onPress={() => onSelect(item.dateStr)}
                >
                  <Text className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-[#101114] font-medium'}`}>
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
