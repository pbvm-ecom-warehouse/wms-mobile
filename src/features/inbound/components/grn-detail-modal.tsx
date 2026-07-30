import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
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
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { ENV } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { AppAlertModal, AppAlertModalProps, AppButton, StatusBadge } from '@/shared/ui';
import {
  approveGoodsReceiptNote,
  deleteGoodsReceiptNote,
  deleteGrnImage,
  getGoodsReceiptNote,
  rejectGoodsReceiptNote,
  submitGoodsReceiptNote,
  updateGoodsReceiptNoteItems,
  uploadGrnImage,
} from '../api/grn-api';
import type { CreateGoodsReceiptNoteItemInput, GoodsReceiptNote } from '../types/grn';

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

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  DRAFT: { label: 'Nháp', variant: 'neutral' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
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
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // Edit items mode state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState<CreateGoodsReceiptNoteItemInput[]>([]);
  const [savingItems, setSavingItems] = useState(false);

  useEffect(() => {
    if (visible && grn?.id) {
      setErrorMsg(null);
      setDetailGrn(grn);
      setLoadingDetail(true);
      getGoodsReceiptNote(grn.id)
        .then((fresh) => {
          if (fresh) {
            setDetailGrn(fresh);
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
    setIsEditingItems(false);
    setEditableItems([]);
  }, [visible, grn?.id]);

  const activeGrn = detailGrn || grn;
  if (!activeGrn) return null;

  const userRole = user?.role?.toUpperCase();
  const isManager = userRole === WmsRole.MANAGER;
  const isDraftOrRejected = activeGrn.status === 'DRAFT' || activeGrn.status === 'REJECTED';

  const canSubmit =
    !isManager &&
    isDraftOrRejected &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const canApproveOrReject =
    !isManager &&
    activeGrn.status === 'PENDING_APPROVAL' &&
    userRole === WmsRole.ADMIN;

  const canDelete =
    !isManager &&
    isDraftOrRejected &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const hasImages = Boolean(activeGrn.images && activeGrn.images.length > 0);

  const canUploadImage =
    !isManager &&
    isDraftOrRejected &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const canDeleteImage =
    !isManager &&
    isDraftOrRejected &&
    (userRole === WmsRole.RECEIVER || userRole === WmsRole.ADMIN);

  const handleDeleteImage = (index: number) => {
    const targetImage = activeGrn.images?.[index];
    showAlert({
      title: 'Xóa ảnh minh chứng',
      message: 'Bạn có chắc chắn muốn xóa ảnh minh chứng này khỏi phiếu nháp?',
      variant: 'danger',
      confirmText: 'Xóa ảnh',
      cancelText: 'Hủy',
      onConfirm: async () => {
        setAlertState(null);
        setErrorMsg(null);
        const updatedImages = (activeGrn.images || []).filter((_, i) => i !== index);
        const updatedGrn = { ...activeGrn, images: updatedImages };
        setDetailGrn(updatedGrn);
        onUpdate(updatedGrn);
        try {
          const res = await deleteGrnImage(activeGrn.id, index, targetImage, updatedImages);
          if (res && res.images) {
            const freshGrn = { ...activeGrn, ...res };
            setDetailGrn(freshGrn);
            onUpdate(freshGrn);
          }
        } catch (err: any) {
          console.warn('Lỗi xóa ảnh GRN:', err);
        }
      },
    });
  };

  const handleDelete = () => {
    showAlert({
      title: 'Xác nhận xóa phiếu',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn phiếu nhập kho ${activeGrn.grnNumber || activeGrn.id} không? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      confirmText: 'Xóa phiếu',
      cancelText: 'Hủy',
      onConfirm: async () => {
        setAlertState(null);
        setDeleting(true);
        setErrorMsg(null);
        try {
          await deleteGoodsReceiptNote(activeGrn.id);
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
    });
  };

  const startEditItems = () => {
    if (!activeGrn.items) return;
    const initial: CreateGoodsReceiptNoteItemInput[] = activeGrn.items.map((item) => ({
      itemId: item.itemId,
      actualQty: item.actualQty ?? 1,
      lotNumber: item.lotNumber || '',
      manufacturedDate: item.manufacturedDate ? item.manufacturedDate.split('T')[0] : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      note: item.note || '',
    }));
    setEditableItems(initial);
    setIsEditingItems(true);
  };

  const updateEditableItemField = (index: number, field: keyof CreateGoodsReceiptNoteItemInput, value: any) => {
    setEditableItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveItems = async (): Promise<GoodsReceiptNote | null> => {
    setSavingItems(true);
    setErrorMsg(null);
    try {
      const updated = await updateGoodsReceiptNoteItems(activeGrn.id, editableItems);
      showAlert({
        title: 'Thành công',
        message: 'Đã lưu thay đổi các sản phẩm nhập kho',
        variant: 'success',
      });
      setDetailGrn(updated);
      onUpdate(updated);
      setIsEditingItems(false);
      return updated;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Cập nhật thông tin dòng hàng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
      return null;
    } finally {
      setSavingItems(false);
    }
  };

  const handleSubmitGrn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let targetId = activeGrn.id;
      if (isEditingItems) {
        const saved = await handleSaveItems();
        if (!saved) {
          setSubmitting(false);
          return;
        }
      }
      const updated = await submitGoodsReceiptNote(targetId);
      const fresh = { ...activeGrn, ...updated, status: 'PENDING_APPROVAL' as const };
      const successMsg = activeGrn.status === 'REJECTED' ? 'Đã gửi duyệt lại phiếu nhập kho thành công' : 'Đã gửi duyệt phiếu nhập kho thành công';
      showAlert({
        title: 'Thành công',
        message: successMsg,
        variant: 'success',
      });
      setDetailGrn(fresh);
      onUpdate(fresh);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Gửi duyệt phiếu nhập kho thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setErrorMsg(null);
    try {
      const updated = await approveGoodsReceiptNote(activeGrn.id);
      const fresh = { ...activeGrn, ...updated, status: 'APPROVED' as const };
      showAlert({
        title: 'Thành công',
        message: 'Đã duyệt phiếu nhập kho',
        variant: 'success',
      });
      setDetailGrn(fresh);
      onUpdate(fresh);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Duyệt phiếu nhập kho thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showAlert({
        title: 'Cảnh báo',
        message: 'Vui lòng nhập lý do từ chối phiếu nhập.',
        variant: 'warning',
      });
      return;
    }

    setRejecting(true);
    setErrorMsg(null);
    try {
      const updated = await rejectGoodsReceiptNote(activeGrn.id, rejectReason.trim());
      const fresh = { ...activeGrn, ...updated, status: 'REJECTED' as const, rejectionReason: rejectReason.trim() };
      showAlert({
        title: 'Thành công',
        message: 'Đã từ chối phiếu nhập kho và gửi lý do phản hồi',
        variant: 'success',
      });
      setShowRejectModal(false);
      setRejectReason('');
      setDetailGrn(fresh);
      onUpdate(fresh);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Từ chối phiếu nhập kho thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setRejecting(false);
    }
  };

  const handleUploadImageUri = async (uri: string) => {
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const updated = await uploadGrnImage(activeGrn.id, uri);
      showAlert({
        title: 'Thành công',
        message: 'Đã tải ảnh minh chứng nhập kho lên hệ thống',
        variant: 'success',
      });
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
        showAlert({
          title: 'Cần cấp quyền',
          message: 'Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh minh chứng nhập kho.',
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
        await handleUploadImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err?.message || 'Không thể mở máy ảnh',
        variant: 'danger',
      });
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Cần cấp quyền',
          message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh minh chứng nhập kho.',
          variant: 'warning',
        });
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
      showAlert({
        title: 'Lỗi',
        message: err?.message || 'Không thể mở thư viện ảnh',
        variant: 'danger',
      });
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
          {/* Rejection Reason Alert if REJECTED */}
          {activeGrn.status === 'REJECTED' && activeGrn.rejectionReason ? (
            <View className="bg-[#ffebeb] p-3.5 rounded-2xl border border-[#f8c4c4] mb-4">
              <Text className="text-xs font-bold text-[#c83a3a] uppercase mb-1">
                Lý do bị từ chối
              </Text>
              <Text className="text-xs font-medium text-[#101114]">
                {activeGrn.rejectionReason}
              </Text>
            </View>
          ) : null}

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
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-bold text-[#6c7078] uppercase">
                Danh sách sản phẩm nhập kho
              </Text>
              {canSubmit ? (
                <TouchableOpacity
                  onPress={isEditingItems ? () => setIsEditingItems(false) : startEditItems}
                  className="px-2.5 py-1 rounded-lg bg-[#eaf3ff] border border-[#0878f9]"
                >
                  <Text className="text-xs font-bold text-[#0878f9]">
                    {isEditingItems ? 'Hủy sửa' : 'Chỉnh sửa'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {activeGrn.items && activeGrn.items.length > 0 ? (
              activeGrn.items.map((item, idx) => {
                const editState = editableItems[idx];
                return (
                  <View
                    key={item.itemId || idx}
                    className="bg-[#f5f6f8] p-3 rounded-xl mb-2.5 border border-[#e4e5e9]"
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm font-bold text-[#101114] flex-1 mr-2">
                        {item.itemName || item.sku}
                      </Text>
                      {!isEditingItems ? (
                        <View className="bg-[#eaf3ff] px-2 py-0.5 rounded-lg">
                          <Text className="text-xs font-bold text-[#0878f9]">
                            {item.actualQty} {item.unit || 'thùng'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xs text-[#6c7078] mb-1.5">SKU: {item.sku}</Text>

                    {isEditingItems ? (
                      <View className="mt-2 pt-2 border-t border-[#e4e5e9]/70 gap-2">
                        <View className="flex-row gap-2">
                          <View className="flex-1">
                            <Text className="text-[11px] font-semibold text-[#475569] mb-1">
                              Số lượng ({item.unit || 'thùng'})
                            </Text>
                            <TextInput
                              keyboardType="numeric"
                              className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs font-bold text-[#101114]"
                              value={String(editState?.actualQty ?? '')}
                              onChangeText={(val) => {
                                const num = parseInt(val, 10);
                                updateEditableItemField(idx, 'actualQty', isNaN(num) ? 0 : num);
                              }}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[11px] font-semibold text-[#475569] mb-1">Số lô (Lot)</Text>
                            <TextInput
                              className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#101114]"
                              value={editState?.lotNumber || ''}
                              onChangeText={(val) => updateEditableItemField(idx, 'lotNumber', val)}
                              placeholder="LOT-XXX"
                            />
                          </View>
                        </View>

                        <View className="flex-row gap-2">
                          <View className="flex-1">
                            <Text className="text-[11px] font-semibold text-[#475569] mb-1">Ngày SX (YYYY-MM-DD)</Text>
                            <TextInput
                              className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#101114]"
                              value={editState?.manufacturedDate || ''}
                              onChangeText={(val) => updateEditableItemField(idx, 'manufacturedDate', val)}
                              placeholder="2026-07-29"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[11px] font-semibold text-[#475569] mb-1">Hạn dùng (YYYY-MM-DD)</Text>
                            <TextInput
                              className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#101114]"
                              value={editState?.expiryDate || ''}
                              onChangeText={(val) => updateEditableItemField(idx, 'expiryDate', val)}
                              placeholder="2027-07-29"
                            />
                          </View>
                        </View>

                        <View>
                          <Text className="text-[11px] font-semibold text-[#475569] mb-1">Ghi chú</Text>
                          <TextInput
                            className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#101114]"
                            value={editState?.note || ''}
                            onChangeText={(val) => updateEditableItemField(idx, 'note', val)}
                            placeholder="Ghi chú thêm..."
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        {item.manufacturedDate || item.lotNumber || item.expiryDate ? (
                          <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-1.5 pt-1.5 border-t border-[#e4e5e9]/50">
                            {item.manufacturedDate ? (
                              <Text className="text-xs text-[#6c7078]">
                                NSX: <Text className="text-xs font-bold text-[#101114]">{formatDateOnly(item.manufacturedDate)}</Text>
                              </Text>
                            ) : null}
                            {item.lotNumber ? (
                              <Text className="text-xs text-[#6c7078]">
                                Số lô: <Text className="text-xs font-bold text-[#101114]">{item.lotNumber}</Text>
                              </Text>
                            ) : null}
                            {item.expiryDate ? (
                              <Text className="text-xs text-[#6c7078]">
                                Hạn dùng: <Text className="text-xs font-bold text-[#101114]">{formatDateOnly(item.expiryDate)}</Text>
                              </Text>
                            ) : null}
                          </View>
                        ) : null}

                        {item.note ? (
                          <Text className="text-xs italic text-[#6c7078] mt-1">
                            Ghi chú: {item.note}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })
            ) : (
              <Text className="text-xs italic text-[#6c7078]">Không có dòng hàng nào.</Text>
            )}

            {isEditingItems ? (
              <TouchableOpacity
                onPress={handleSaveItems}
                disabled={savingItems}
                className="bg-[#0878f9] py-2.5 px-4 rounded-xl flex-row justify-center items-center mt-2 shadow-sm"
              >
                {savingItems ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-xs font-extrabold text-white">Lưu thay đổi sản phẩm</Text>
                )}
              </TouchableOpacity>
            ) : null}
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
            {canSubmit ? (
              <AppButton
                label={activeGrn.status === 'REJECTED' ? 'Gửi Duyệt Lại Phiếu Nhập Kho' : 'Gửi Duyệt Phiếu Nhập Kho'}
                loading={submitting}
                onPress={handleSubmitGrn}
                icon={<CheckCircle2 size={18} color="#ffffff" />}
              />
            ) : null}

            {canApproveOrReject ? (
              <View className="gap-2">
                <AppButton
                  label="Duyệt Phiếu Nhập Kho"
                  loading={approving}
                  onPress={handleApprove}
                  icon={<CheckCircle size={18} color="#ffffff" />}
                />
                <TouchableOpacity
                  onPress={() => setShowRejectModal(true)}
                  disabled={approving || rejecting}
                  className="flex-row items-center justify-center gap-1.5 bg-[#ffebeb] border border-[#f8c4c4] py-3 rounded-xl"
                >
                  <XCircle size={16} color="#dc2626" />
                  <Text className="text-sm font-bold text-[#dc2626]">
                    Từ Chối Phiếu Nhập Kho
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {canDelete ? (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting || submitting}
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

      {/* Reject Reason Modal Dialog */}
      <Modal transparent animationType="fade" visible={showRejectModal} onRequestClose={() => setShowRejectModal(false)}>
        <TouchableOpacity className="flex-1 bg-black/45 justify-center items-center p-4" activeOpacity={1} onPress={() => setShowRejectModal(false)}>
          <TouchableOpacity activeOpacity={1} className="w-full max-w-[360px] bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-[#101114]">Từ Chối Phiếu Nhập Kho</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)} className="p-1.5 rounded-full bg-[#f5f6f8]">
                <X size={18} color="#6c7078" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-[#6c7078] mb-2">
              Vui lòng nhập lý do từ chối phiếu nhập kho này để phản hồi lại cho Receiver:
            </Text>
            <TextInput
              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl p-3 text-xs text-[#101114] min-h-[80px] mb-3"
              multiline
              textAlignVertical="top"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="VD: Sai lệch số lượng thực nhận so với thực tế..."
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                className="flex-1 bg-[#f5f6f8] py-2.5 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-[#6c7078]">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                disabled={rejecting}
                className="flex-1 bg-[#dc2626] py-2.5 rounded-xl items-center"
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-xs font-bold text-white">Xác nhận Từ Chối</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Stock Mate App UI Alert / Confirm Modal */}
      <AppAlertModal {...(alertState || { title: '' })} visible={Boolean(alertState?.visible)} />
    </Modal>
  );
}
