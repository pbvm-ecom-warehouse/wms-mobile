import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  CheckCircle,
  CheckCircle2,
  ImageIcon,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { ENV } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { AppButton, StatusBadge } from '@/shared/ui';
import {
  approveGoodsReceiptNote,
  confirmGoodsReceiptNote,
  deleteGoodsReceiptNote,
  deleteGrnImage,
  getGoodsReceiptNote,
  uploadGrnImage,
} from '../api/grn-api';
import type { GoodsReceiptNote } from '../types/grn';

function resolveImageUrl(uri?: string): string {
  if (!uri) return '';
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('data:')
  ) {
    return uri;
  }
  const baseUrl = ENV.API_URL.replace(/\/api.*$/, '');
  const cleanPath = uri.startsWith('/') ? uri : `/${uri}`;
  return `${baseUrl}${cleanPath}`;
}

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' }
> = {
  DRAFT: { label: 'Nháp', variant: 'neutral' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt (Audit)', variant: 'success' },
};

interface GrnDetailModalProps {
  visible: boolean;
  grn: GoodsReceiptNote | null;
  onClose: () => void;
  onUpdate: (updatedGrn: GoodsReceiptNote) => void;
  onDelete?: (grnId: string) => void;
}

const deletedImagesMap: Record<string, Set<string>> = {};

export function GrnDetailModal({ visible, grn, onClose, onUpdate, onDelete }: GrnDetailModalProps) {
  const { user } = useAuth();
  const [detailGrn, setDetailGrn] = useState<GoodsReceiptNote | null>(grn);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && grn?.id) {
      setErrorMsg(null);
      let initialGrn = grn;
      const deletedSet = deletedImagesMap[grn.id];
      if (deletedSet && initialGrn.images) {
        initialGrn = {
          ...initialGrn,
          images: initialGrn.images.filter((img) => !deletedSet.has(img)),
        };
      }
      setDetailGrn(initialGrn);
      setLoadingDetail(true);
      getGoodsReceiptNote(grn.id)
        .then((fresh) => {
          if (fresh) {
            let filteredFresh = fresh;
            if (deletedSet && fresh.images) {
              filteredFresh = {
                ...fresh,
                images: fresh.images.filter((img) => !deletedSet.has(img)),
              };
            }
            setDetailGrn(filteredFresh);
          }
        })
        .catch((err) => {
          console.warn('Lỗi tải chi tiết GRN:', err);
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    } else {
      setDetailGrn(null);
    }
  }, [visible, grn?.id]);

  const activeGrn = detailGrn || grn;
  if (!activeGrn) return null;

  const userRole = user?.role?.toUpperCase();
  const canConfirm =
    activeGrn.status === 'DRAFT' &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN || userRole === WmsRole.MANAGER);

  const canApprove =
    activeGrn.status === 'CONFIRMED' &&
    (userRole === WmsRole.MANAGER || userRole === WmsRole.ADMIN);

  const canDelete =
    activeGrn.status === 'DRAFT' &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const hasImages = Boolean(activeGrn.images && activeGrn.images.length > 0);
  const isApprovedOrConfirmedWithImages =
    (activeGrn.status === 'APPROVED' || activeGrn.status === 'CONFIRMED') && hasImages;

  const canUploadImage =
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN || userRole === WmsRole.MANAGER) &&
    !isApprovedOrConfirmedWithImages;

  const canDeleteImage =
    activeGrn.status === 'DRAFT' &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN || userRole === WmsRole.MANAGER);

  const handleDeleteImage = (index: number) => {
    const targetImage = activeGrn.images?.[index];
    Alert.alert(
      'Xóa ảnh minh chứng',
      'Bạn có chắc chắn muốn xóa ảnh minh chứng này khỏi phiếu nháp?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ảnh',
          style: 'destructive',
          onPress: async () => {
            setErrorMsg(null);
            if (targetImage) {
              if (!deletedImagesMap[activeGrn.id]) {
                deletedImagesMap[activeGrn.id] = new Set();
              }
              deletedImagesMap[activeGrn.id].add(targetImage);
            }
            const updatedImages = (activeGrn.images || []).filter((_, i) => i !== index);
            const updatedGrn = { ...activeGrn, images: updatedImages };
            setDetailGrn(updatedGrn);
            onUpdate(updatedGrn);
            try {
              const res = await deleteGrnImage(activeGrn.id, index, targetImage, updatedImages);
              if (res && res.images) {
                const deletedSet = deletedImagesMap[activeGrn.id];
                const cleanImages = res.images.filter((img) => !deletedSet?.has(img));
                const freshGrn = { ...activeGrn, ...res, images: cleanImages };
                setDetailGrn(freshGrn);
                onUpdate(freshGrn);
              }
            } catch (err: any) {
              console.warn('Lỗi xóa ảnh GRN:', err);
            }
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Xác nhận xóa phiếu',
      `Bạn có chắc chắn muốn xóa vĩnh viễn phiếu nhập kho ${activeGrn.grnNumber || activeGrn.id} không? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa phiếu',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setErrorMsg(null);
            try {
              await deleteGoodsReceiptNote(activeGrn.id);
              Alert.alert('Thành công', 'Đã xóa phiếu nhập kho thành công');
              if (onDelete) onDelete(activeGrn.id);
              onClose();
            } catch (err: any) {
              const msg =
                err?.response?.data?.message || err?.message || 'Xóa phiếu nhập kho thất bại';
              setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setErrorMsg(null);
    try {
      const updated = await confirmGoodsReceiptNote(activeGrn.id);
      Alert.alert('Thành công', 'Đã xác nhận phiếu nhập kho');
      setDetailGrn(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Xác nhận phiếu nhập kho thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setErrorMsg(null);
    try {
      const updated = await approveGoodsReceiptNote(activeGrn.id);
      Alert.alert('Thành công', 'Đã duyệt phiếu nhập kho (Audit)');
      setDetailGrn(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Duyệt phiếu nhập kho thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setApproving(false);
    }
  };

  const handleUploadImageUri = async (uri: string) => {
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const updated = await uploadGrnImage(activeGrn.id, uri);
      Alert.alert('Thành công', 'Đã tải ảnh minh chứng nhập kho lên hệ thống');
      setDetailGrn(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Tải ảnh minh chứng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần cấp quyền',
          'Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh minh chứng nhập kho.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở máy ảnh');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần cấp quyền',
          'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh minh chứng nhập kho.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở thư viện ảnh');
    }
  };

  const badgeConfig = statusBadgeMap[activeGrn.status] || {
    label: activeGrn.status,
    variant: 'neutral',
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Modal Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-[#101114]">
                {activeGrn.grnNumber || `GRN #${activeGrn.id.substring(0, 8)}`}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text className="text-xs text-[#6c7078] mt-0.5">
              Tạo lúc: {activeGrn.createdAt ? new Date(activeGrn.createdAt).toLocaleString('vi-VN') : ''}
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
          {/* General Information Card */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-4">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Thông tin chung
            </Text>
            <View className="flex-row justify-between py-1.5 border-b border-[#f5f6f8]">
              <Text className="text-xs text-[#6c7078]">Mã PO liên quan</Text>
              <Text className="text-xs font-bold text-[#0878f9]">
                {activeGrn.purchaseOrderNumber || activeGrn.purchaseOrderId || 'N/A'}
              </Text>
            </View>
            <View className="flex-row justify-between py-1.5 border-b border-[#f5f6f8]">
              <Text className="text-xs text-[#6c7078]">Nhà cung cấp</Text>
              <Text className="text-xs font-bold text-[#101114]">
                {activeGrn.supplierName || 'Chưa thông tin'}
              </Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-[#6c7078]">Tổng số mặt hàng</Text>
              <Text className="text-xs font-bold text-[#101114]">
                {activeGrn.items?.length || 0} mặt hàng
              </Text>
            </View>
          </View>

          {/* Items Detail */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-4">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Danh sách sản phẩm nhập kho
            </Text>

            {activeGrn.items && activeGrn.items.length > 0 ? (
              activeGrn.items.map((item, idx) => (
                <View
                  key={item.itemId || idx}
                  className="bg-[#f5f6f8] p-3 rounded-xl mb-2 border border-[#e4e5e9]"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-bold text-[#101114] flex-1 mr-2">
                      {item.itemName || item.sku}
                    </Text>
                    <View className="bg-[#eaf3ff] px-2 py-0.5 rounded-lg">
                      <Text className="text-xs font-bold text-[#0878f9]">
                        {item.actualQty} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-[#6c7078]">SKU: {item.sku}</Text>
                  
                  {item.lotNumber || item.expiryDate ? (
                    <View className="flex-row gap-3 mt-1.5 pt-1.5 border-t border-[#e4e5e9]/50">
                      {item.lotNumber ? (
                        <Text className="text-xs text-[#6c7078]">
                          Số lô: <Text className="text-xs font-bold text-[#101114]">{item.lotNumber}</Text>
                        </Text>
                      ) : null}
                      {item.expiryDate ? (
                        <Text className="text-xs text-[#6c7078]">
                          Hạn dùng: <Text className="text-xs font-bold text-[#101114]">{item.expiryDate}</Text>
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {item.note ? (
                    <Text className="text-xs italic text-[#6c7078] mt-1">
                      Ghi chú: {item.note}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text className="text-xs italic text-[#6c7078]">Không có dòng hàng nào.</Text>
            )}
          </View>

          {/* Evidence Images */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-bold text-[#6c7078] uppercase">
                Ảnh minh chứng nhập kho ({activeGrn.images?.length || 0})
              </Text>
            </View>

            {canUploadImage ? (
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  disabled={uploadingImage}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#0878f9] py-2 px-3 rounded-xl"
                >
                  <Camera size={15} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#eaf3ff] py-2 px-3 rounded-xl border border-[#0878f9]"
                >
                  <ImageIcon size={15} color="#0878f9" />
                  <Text className="text-xs font-bold text-[#0878f9]">Thư viện</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {uploadingImage ? (
              <View className="bg-[#eaf3ff] p-2.5 rounded-xl mb-3 flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#0878f9" />
                <Text className="text-xs font-semibold text-[#0878f9]">Đang tải ảnh minh chứng lên...</Text>
              </View>
            ) : null}

            {activeGrn.images && activeGrn.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pt-2">
                {activeGrn.images.map((img, index) => (
                  <View key={index} className="relative mr-3 mt-1">
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      className="w-[100px] h-[100px] rounded-xl"
                      resizeMode="cover"
                    />
                    {canDeleteImage ? (
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(index)}
                        className="absolute -top-1.5 -right-1.5 bg-[#ef4444] rounded-full p-1 shadow-sm"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={12} color="#ffffff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="items-center py-4 bg-[#f5f6f8] rounded-xl border border-dashed border-[#e4e5e9]">
                <ImageIcon size={24} color={colors.textMuted} />
                <Text className="text-xs text-[#6c7078] mt-1">Chưa có ảnh chứng từ nào</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-8 gap-2.5">
            {canConfirm ? (
              <AppButton
                label="Xác Nhận Nhận Hàng (CONFIRM)"
                loading={confirming}
                onPress={handleConfirm}
                icon={<CheckCircle2 size={18} color="#ffffff" />}
              />
            ) : null}

            {canApprove ? (
              <AppButton
                label="Duyệt Phiếu Nhập Kho (APPROVE)"
                loading={approving}
                onPress={handleApprove}
                icon={<CheckCircle size={18} color="#ffffff" />}
              />
            ) : null}

            {canDelete ? (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting || confirming}
                className="flex-row items-center justify-center gap-1.5 bg-[#ffebeb] border border-[#f8c4c4] py-3 rounded-xl mt-1"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Trash2 size={16} color="#dc2626" />
                    <Text className="text-sm font-bold text-[#dc2626]">
                      Xóa Phiếu Nhập (Nháp)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
