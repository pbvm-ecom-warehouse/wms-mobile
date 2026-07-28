import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
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
      setDetailGrn(grn);
      setLoadingDetail(true);
      getGoodsReceiptNote(grn.id)
        .then((fresh) => {
          if (fresh) setDetailGrn(fresh);
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
            const updatedImages = (activeGrn.images || []).filter((_, i) => i !== index);
            const updatedGrn = { ...activeGrn, images: updatedImages };
            setDetailGrn(updatedGrn);
            onUpdate(updatedGrn);
            try {
              const res = await deleteGrnImage(activeGrn.id, index, targetImage, updatedImages);
              if (res && res.images) {
                const freshGrn = { ...activeGrn, ...res, images: res.images };
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
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.titleText}>
                {activeGrn.grnNumber || `GRN #${activeGrn.id.substring(0, 8)}`}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text style={styles.subtitleText}>
              Tạo lúc: {activeGrn.createdAt ? new Date(activeGrn.createdAt).toLocaleString('vi-VN') : ''}
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
          {/* General Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>
              Thông tin chung
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Mã PO liên quan</Text>
              <Text style={styles.poNumberValue}>
                {activeGrn.purchaseOrderNumber || activeGrn.purchaseOrderId || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Nhà cung cấp</Text>
              <Text style={styles.metaValueBold}>
                {activeGrn.supplierName || 'Chưa thông tin'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.metaLabel}>Tổng số mặt hàng</Text>
              <Text style={styles.metaValueBold}>
                {activeGrn.items?.length || 0} mặt hàng
              </Text>
            </View>
          </View>

          {/* Items Detail */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>
              Danh sách sản phẩm nhập kho
            </Text>

            {activeGrn.items && activeGrn.items.length > 0 ? (
              activeGrn.items.map((item, idx) => (
                <View
                  key={item.itemId || idx}
                  style={styles.itemRowCard}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemNameText}>
                      {item.itemName || item.sku}
                    </Text>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>
                        {item.actualQty} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.skuText}>SKU: {item.sku}</Text>
                  
                  {item.lotNumber || item.expiryDate ? (
                    <View style={styles.lotExpiryRow}>
                      {item.lotNumber ? (
                        <Text style={styles.metaLabel}>
                          Số lô: <Text style={styles.metaValueBold}>{item.lotNumber}</Text>
                        </Text>
                      ) : null}
                      {item.expiryDate ? (
                        <Text style={styles.metaLabel}>
                          Hạn dùng: <Text style={styles.metaValueBold}>{item.expiryDate}</Text>
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {item.note ? (
                    <Text style={styles.noteText}>
                      Ghi chú: {item.note}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Không có dòng hàng nào.</Text>
            )}
          </View>

          {/* Evidence Images */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardHeader}>
                Ảnh minh chứng nhập kho ({activeGrn.images?.length || 0})
              </Text>
            </View>

            {canUploadImage ? (
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  disabled={uploadingImage}
                  style={styles.primaryActionBtn}
                >
                  <Camera size={15} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  style={styles.secondaryActionBtn}
                >
                  <ImageIcon size={15} color="#0878f9" />
                  <Text style={styles.secondaryActionText}>Thư viện</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {uploadingImage ? (
              <View style={styles.loadingImageBox}>
                <ActivityIndicator size="small" color="#0878f9" />
                <Text style={styles.loadingImageText}>Đang tải ảnh minh chứng lên...</Text>
              </View>
            ) : null}

            {activeGrn.images && activeGrn.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingTop: 8 }}>
                {activeGrn.images.map((img, index) => (
                  <View key={index} style={{ position: 'relative', marginRight: 12, marginTop: 4 }}>
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      style={{ width: 100, height: 100, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                    {canDeleteImage ? (
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(index)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          backgroundColor: '#ef4444',
                          borderRadius: 12,
                          padding: 4,
                          elevation: 3,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.25,
                          shadowRadius: 1.5,
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={12} color="#ffffff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyImageBox}>
                <ImageIcon size={24} color={colors.textMuted} />
                <Text style={styles.mutedText}>Chưa có ảnh chứng từ nào</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ marginBottom: 32, gap: 10 }}>
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#ffebeb',
                  borderWidth: 1,
                  borderColor: '#f8c4c4',
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 4,
                }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Trash2 size={16} color="#dc2626" />
                    <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 14 }}>
                      Xóa Phiếu Nhập (DRAFT)
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
    gap: 8,
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
  closeBtn: {
    padding: 8,
    backgroundColor: '#f5f6f8',
    borderRadius: 20,
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
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6c7078',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f6f8',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6c7078',
  },
  poNumberValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  metaValueBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#101114',
  },
  itemRowCard: {
    backgroundColor: '#f5f6f8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#101114',
    flex: 1,
    marginRight: 8,
  },
  qtyBadge: {
    backgroundColor: '#eaf3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  skuText: {
    fontSize: 12,
    color: '#6c7078',
  },
  lotExpiryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(228, 229, 233, 0.5)',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6c7078',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#6c7078',
    fontStyle: 'italic',
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0878f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eaf3ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0878f9',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  urlActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f5f6f8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  urlActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c7078',
  },
  loadingImageBox: {
    backgroundColor: '#eaf3ff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0878f9',
  },
  urlInputCard: {
    backgroundColor: '#f5f6f8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    marginBottom: 12,
  },
  urlInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#101114',
    marginVertical: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#6c7078',
  },
  uploadSubmitBtn: {
    backgroundColor: '#0878f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadSubmitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  imageThumbnail: {
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  emptyImageBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f5f6f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e5e9',
    borderStyle: 'dashed',
  },
  mutedText: {
    fontSize: 12,
    color: '#6c7078',
    marginTop: 4,
  },
});
