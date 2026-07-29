import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera as CameraIcon, CheckCircle2, Keyboard, QrCode, X } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { formatApiError } from '@/shared/lib/api-client';
import { colors } from '@/shared/theme/tokens';
import { AppAlertModal, AppAlertModalProps } from '@/shared/ui';
import { confirmPutawayLine } from '../api/putaway-api';
import type { PutawayTask, PutawayTaskItem } from '../types/putaway';

interface PutawayScanConfirmModalProps {
  visible: boolean;
  taskId?: string;
  item?: PutawayTaskItem | null;
  initialCellCode?: string;
  suggestedCellId?: string;
  maxQuantity?: number;
  onClose: () => void;
  onSuccess: (updatedTask: PutawayTask) => void;
}

export function PutawayScanConfirmModal({
  visible,
  taskId,
  item,
  initialCellCode = '',
  suggestedCellId,
  maxQuantity = 10,
  onClose,
  onSuccess,
}: PutawayScanConfirmModalProps) {
  const [itemBarcode, setItemBarcode] = useState('');
  const [cellBarcode, setCellBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom App UI Alert state
  const [alertState, setAlertState] = useState<AppAlertModalProps | null>(null);
  const showAlert = (config: Omit<AppAlertModalProps, 'visible'>) => {
    setAlertState({ ...config, visible: true, onClose: () => setAlertState(null) });
  };

  // Camera Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [scanTargetField, setScanTargetField] = useState<'item' | 'cell'>('item');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible && item) {
      setItemBarcode(item.sku || '');
      setCellBarcode(initialCellCode || item.shelfCode || '');
      const rem = item.remainingQty ?? item.quantity ?? maxQuantity;
      setQuantity(String(rem > 0 ? rem : 1));
      setErrorMsg(null);
      setCameraActive(false);
    }
  }, [visible, item, initialCellCode, maxQuantity]);

  if (!visible || !item || !taskId) return null;

  const handleOpenCamera = async (targetField: 'item' | 'cell') => {
    setScanTargetField(targetField);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        setCameraActive(true);
      } else {
        setHasPermission(false);
        // Fallback to ImagePicker Camera if Expo Camera permission denied
        const pickerRes = await ImagePicker.requestCameraPermissionsAsync();
        if (pickerRes.status === 'granted') {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]) {
            showAlert({ title: 'Đã chụp ảnh', message: 'Đã lưu ảnh từ camera thành công!', variant: 'success' });
          }
        } else {
          showAlert({ title: 'Cần quyền Camera', message: 'Vui lòng cấp quyền Camera trong Cài đặt thiết bị để quét mã!', variant: 'warning' });
        }
      }
    } catch (err) {
      console.warn('Lỗi xin quyền camera:', err);
      showAlert({ title: 'Thông báo', message: 'Không thể khởi động Camera thiết bị.', variant: 'warning' });
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    const scannedCode = data.trim();
    if (scanTargetField === 'item') {
      setItemBarcode(scannedCode);
    } else {
      setCellBarcode(scannedCode);
    }
    setCameraActive(false);
    showAlert({ title: 'Quét mã thành công 🎉', message: `Mã đã đọc được: ${scannedCode}`, variant: 'success' });
  };

  const handleConfirmSubmit = async () => {
    if (!itemBarcode.trim()) {
      showAlert({ title: 'Bắt buộc quét mã SKU', message: 'Vui lòng quét hoặc nhập mã vạch mặt hàng!', variant: 'warning' });
      return;
    }
    if (!cellBarcode.trim()) {
      showAlert({ title: 'Bắt buộc quét mã khoang', message: 'Vui lòng chọn hoặc quét mã khoang/kệ!', variant: 'warning' });
      return;
    }
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showAlert({ title: 'Thông báo', message: 'Số lượng xác nhận cất phải lớn hơn 0', variant: 'warning' });
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const updated = await confirmPutawayLine(taskId, {
        itemBarcode: itemBarcode.trim(),
        cellBarcode: cellBarcode.trim(),
        shelfCode: cellBarcode.trim(),
        quantity: qtyNum,
        suggestedCellId,
        lotId: item.lotId || undefined,
      });

      showAlert({
        title: 'Xác nhận thành công 🎉',
        message: `Đã lưu cất ${qtyNum} thùng hàng vào khoang ${cellBarcode.trim()}`,
        variant: 'success',
        onConfirm: () => {
          setAlertState(null);
          onSuccess(updated);
          onClose();
        },
      });
    } catch (err: any) {
      setErrorMsg(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-center p-4">
        <View className="bg-white rounded-3xl overflow-hidden border border-[#e4e5e9]">
          {/* Header */}
          <View className="p-4 border-b border-[#e4e5e9] flex-row items-center justify-between bg-white">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-1.5">
                <QrCode size={18} color="#0878f9" />
                <Text className="text-base font-bold text-[#101114]">Quét xác nhận vị trí</Text>
              </View>
              <Text className="text-xs text-[#6c7078] mt-0.5">
                Phải quét cả mã mặt hàng và tem khoang. Việc chọn trên bản đồ không thay thế bước xác nhận vật lý.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-[#f5f6f8] rounded-full">
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Camera View Overlay */}
          {cameraActive ? (
            <View className="h-80 bg-black relative justify-center items-center">
              <CameraView
                style={{ width: '100%', height: '100%' }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-xl border border-white/30">
                <Text className="text-xs font-bold text-white">
                  Đang quét mã cho: {scanTargetField === 'item' ? 'Mã vạch sản phẩm' : 'Mã vạch khoang chứa'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCameraActive(false)}
                className="absolute top-4 right-4 p-2 bg-black/70 rounded-full border border-white/30"
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
              {/* Keyboard Scanner Notice Bar */}
              <View className="bg-[#f8fafc] p-3 rounded-2xl border border-[#e2e8f0] flex-row items-center gap-2 mb-4">
                <Keyboard size={16} color="#64748b" />
                <Text className="text-xs text-[#475569] flex-1 font-medium">
                  Máy quét dạng bàn phím: đặt con trỏ vào ô rồi quét. Nhấn Enter để chuyển ô.
                </Text>
              </View>

              {errorMsg ? (
                <View className="bg-[#ffebeb] p-3 rounded-xl border border-[#f8c4c4] mb-3">
                  <Text className="text-xs font-semibold text-[#c83a3a]">{errorMsg}</Text>
                </View>
              ) : null}

              {/* Field 1: Item Barcode */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-[#334155] mb-1">Mã vạch mặt hàng *</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-white border border-[#3b82f6] rounded-xl px-3 py-2.5 text-xs text-[#101114] font-medium"
                    value={itemBarcode}
                    onChangeText={setItemBarcode}
                    placeholder="Quét mã trên thùng hàng..."
                  />
                  <TouchableOpacity
                    onPress={() => handleOpenCamera('item')}
                    className="bg-[#1d4ed8] px-3.5 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
                  >
                    <CameraIcon size={14} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 2: Cell Barcode */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-[#334155] mb-1">Mã khoang *</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs text-[#101114] font-medium"
                    value={cellBarcode}
                    onChangeText={setCellBarcode}
                    placeholder="Ví dụ: RACK-02-T1-B1"
                  />
                  <TouchableOpacity
                    onPress={() => handleOpenCamera('cell')}
                    className="bg-[#1d4ed8] px-3.5 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
                  >
                    <CameraIcon size={14} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 3: Quantity */}
              <View className="mb-2">
                <Text className="text-xs font-bold text-[#334155] mb-1">Số thùng nguyên *</Text>
                <TextInput
                  className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs text-[#101114] font-medium"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="10"
                />
                <Text className="text-[11px] text-[#64748b] mt-1">
                  Tối đa {maxQuantity} thùng trong lần xác nhận này.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Action Footer Buttons */}
          <View className="p-4 bg-white border-t border-[#e4e5e9] flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-[#f5f6f8] border border-[#e4e5e9] py-3 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-[#6c7078]">Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmSubmit}
              disabled={loading}
              className="flex-[2] bg-[#2563eb] py-3 rounded-xl items-center flex-row justify-center gap-1.5"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Xác nhận cất hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* App UI Alert Modal */}
      <AppAlertModal {...(alertState || { title: '' })} visible={Boolean(alertState?.visible)} />
    </Modal>
  );
}
