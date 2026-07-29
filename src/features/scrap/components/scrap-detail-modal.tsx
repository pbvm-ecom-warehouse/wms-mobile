import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle, ImageIcon, XCircle, X } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { ENV } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { AppAlertModal, AppAlertModalProps, AppButton, StatusBadge } from '@/shared/ui';
import { approveScrapNote, getScrapNote, rejectScrapNote } from '../api/scrap-api';
import type { ScrapNote } from '../types/scrap';

interface ScrapDetailModalProps {
  visible: boolean;
  scrapNote: ScrapNote | null;
  onClose: () => void;
  onUpdate: (updated: ScrapNote) => void;
}

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  DRAFT: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt (Trừ tồn)', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
};

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

export function ScrapDetailModal({
  visible,
  scrapNote,
  onClose,
  onUpdate,
}: ScrapDetailModalProps) {
  const { user } = useAuth();
  const [detailNote, setDetailNote] = useState<ScrapNote | null>(scrapNote);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom App UI Alert state
  const [alertState, setAlertState] = useState<AppAlertModalProps | null>(null);
  const showAlert = (config: Omit<AppAlertModalProps, 'visible'>) => {
    setAlertState({ ...config, visible: true, onClose: () => setAlertState(null) });
  };

  useEffect(() => {
    if (visible && scrapNote?.id) {
      setDetailNote(scrapNote);
      setLoading(true);
      getScrapNote(scrapNote.id)
        .then((fresh) => {
          if (fresh) setDetailNote(fresh);
        })
        .catch((err) => console.warn('Lỗi tải chi tiết phiếu hủy:', err))
        .finally(() => setLoading(false));
    } else {
      setDetailNote(null);
    }
  }, [visible, scrapNote?.id]);

  const activeNote = detailNote || scrapNote;
  if (!activeNote) return null;

  const userRole = user?.role?.toUpperCase();
  const canApproveOrReject =
    activeNote.status === 'DRAFT' &&
    (userRole === WmsRole.MANAGER || userRole === WmsRole.ADMIN);

  const handleApprove = async () => {
    setApproving(true);
    setErrorMsg(null);
    try {
      const updated = await approveScrapNote(activeNote.id);
      showAlert({
        title: 'Thành công',
        message: 'Đã duyệt phiếu hủy hàng và trừ tồn thực tế.',
        variant: 'success',
        onConfirm: () => setAlertState(null),
      });
      setDetailNote(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Duyệt phiếu hủy hàng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showAlert({
        title: 'Thông báo',
        message: 'Vui lòng nhập lý do từ chối phiếu hủy',
        variant: 'warning',
      });
      return;
    }
    setRejecting(true);
    setErrorMsg(null);
    try {
      const updated = await rejectScrapNote(activeNote.id, {
        rejectReason: rejectReason.trim(),
      });
      showAlert({
        title: 'Thành công',
        message: 'Đã từ chối phiếu hủy hàng.',
        variant: 'success',
        onConfirm: () => setAlertState(null),
      });
      setShowRejectInput(false);
      setRejectReason('');
      setDetailNote(updated);
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Từ chối phiếu hủy hàng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setRejecting(false);
    }
  };

  const badgeConfig = statusBadgeMap[activeNote.status] || {
    label: activeNote.status,
    variant: 'neutral',
  };

  // Collect images from items
  const allImages: string[] = [];
  activeNote.items?.forEach((item) => {
    if (item.images && item.images.length > 0) {
      allImages.push(...item.images);
    }
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-[#101114]">
                Phiếu Hủy #{activeNote.id.substring(0, 8).toUpperCase()}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text className="text-xs text-[#6c7078] mt-0.5">
              Tạo bởi: {activeNote.createdBy || 'N/A'} ·{' '}
              {new Date(activeNote.createdAt).toLocaleString('vi-VN')}
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
          {/* Reject Reason Box if Rejected */}
          {activeNote.status === 'REJECTED' && activeNote.rejectReason ? (
            <View className="bg-[#ffebeb] border border-[#f8c4c4] p-4 rounded-2xl mb-3">
              <Text className="text-xs font-bold text-[#dc2626] uppercase mb-1">Lý do từ chối:</Text>
              <Text className="text-xs text-[#991b1b] font-semibold">
                {activeNote.rejectReason}
              </Text>
            </View>
          ) : null}

          {/* General Note */}
          {activeNote.note ? (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Ghi chú chung</Text>
              <Text className="text-xs text-[#101114]">{activeNote.note}</Text>
            </View>
          ) : null}

          {/* Items List */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Danh sách mặt hàng hủy</Text>
            {activeNote.items && activeNote.items.length > 0 ? (
              activeNote.items.map((item, idx) => (
                <View key={idx} className="bg-[#f5f6f8] p-3 rounded-xl mb-2 border border-[#e4e5e9]">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-bold text-[#101114]">
                      {item.itemName || item.sku || `Mặt hàng #${idx + 1}`}
                    </Text>
                    <View className="bg-[#ffebeb] px-2 py-0.5 rounded-lg border border-[#f8c4c4]">
                      <Text className="text-xs font-bold text-[#dc2626]">Hủy {item.quantity}</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-[#6c7078] mt-1">
                    Kệ / Shelf: <Text className="font-bold text-[#101114]">{item.shelfId || item.shelfCode || 'N/A'}</Text>
                  </Text>
                  {item.lotId || item.lotNumber ? (
                    <Text className="text-xs text-[#6c7078]">
                      Lô / Lot: <Text className="font-bold text-[#101114]">{item.lotNumber || item.lotId}</Text>
                    </Text>
                  ) : null}

                  <Text className="text-xs text-[#6c7078] mt-1">
                    Lý do hủy: <Text className="text-[#dc2626] font-bold">{item.reason}</Text>
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-xs text-[#9ca3af] italic">Không có thông tin dòng hàng</Text>
            )}
          </View>

          {/* Evidence Images */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Ảnh minh chứng ({allImages.length})</Text>
            {allImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pt-1.5">
                {allImages.map((img, idx) => (
                  <View key={idx} className="mr-3">
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      className="w-[100px] h-[100px] rounded-xl"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="items-center py-4 bg-[#f5f6f8] rounded-xl border border-dashed border-[#e4e5e9]">
                <ImageIcon size={24} color={colors.textMuted} />
                <Text className="text-xs text-[#9ca3af] mt-1">Chưa có ảnh chứng từ hủy</Text>
              </View>
            )}
          </View>

          {/* Manager / Admin Action Buttons */}
          {canApproveOrReject ? (
            <View className="mb-8 gap-2.5">
              <AppButton
                label="Duyệt Phiếu Hủy (Trừ Tồn Thật)"
                loading={approving}
                onPress={handleApprove}
                icon={<CheckCircle size={18} color="#ffffff" />}
              />

              {!showRejectInput ? (
                <TouchableOpacity
                  onPress={() => setShowRejectInput(true)}
                  disabled={approving || rejecting}
                  className="flex-row items-center justify-center gap-1.5 bg-[#ffebeb] border border-[#f8c4c4] py-3 rounded-xl"
                >
                  <XCircle size={16} color="#dc2626" />
                  <Text className="text-sm font-bold text-[#dc2626]">Từ Chối Phiếu Hủy</Text>
                </TouchableOpacity>
              ) : (
                <View className="bg-[#ffebeb] border border-[#f8c4c4] p-3 rounded-xl">
                  <Text className="text-xs font-bold text-[#dc2626] mb-1.5">
                    Nhập lý do từ chối:
                  </Text>
                  <TextInput
                    className="bg-white border border-[#f8c4c4] rounded-xl px-3 py-2 text-xs text-[#101114]"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder="VD: Không đúng quy trình, hàng chưa kiểm tra..."
                  />
                  <View className="flex-row justify-end gap-2 mt-2">
                    <TouchableOpacity
                      onPress={() => setShowRejectInput(false)}
                      className="bg-white border border-[#e4e5e9] px-3 py-1.5 rounded-xl"
                    >
                      <Text className="text-xs font-bold text-[#6c7078]">Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirmReject}
                      disabled={rejecting}
                      className="bg-[#dc2626] px-3 py-1.5 rounded-xl"
                    >
                      <Text className="text-xs font-bold text-white">
                        {rejecting ? 'Đang từ chối...' : 'Xác nhận Từ Chối'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* App UI Alert Modal */}
      <AppAlertModal {...(alertState || { title: '' })} visible={Boolean(alertState?.visible)} />
    </Modal>
  );
}
