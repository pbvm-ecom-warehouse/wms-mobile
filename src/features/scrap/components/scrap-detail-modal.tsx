import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
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
import { AppButton, StatusBadge } from '@/shared/ui';
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
      Alert.alert('Thành công', 'Đã duyệt phiếu hủy hàng và trừ tồn thực tế.');
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
      Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối phiếu hủy');
      return;
    }
    setRejecting(true);
    setErrorMsg(null);
    try {
      const updated = await rejectScrapNote(activeNote.id, {
        rejectReason: rejectReason.trim(),
      });
      Alert.alert('Thành công', 'Đã từ chối phiếu hủy hàng.');
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.titleText}>
                Phiếu Hủy #{activeNote.id.substring(0, 8).toUpperCase()}
              </Text>
              <StatusBadge {...badgeConfig} />
            </View>
            <Text style={styles.subtitleText}>
              Tạo bởi: {activeNote.createdBy || 'N/A'} ·{' '}
              {new Date(activeNote.createdAt).toLocaleString('vi-VN')}
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
          {/* Reject Reason Box if Rejected */}
          {activeNote.status === 'REJECTED' && activeNote.rejectReason ? (
            <View style={[styles.card, { backgroundColor: '#ffebeb', borderColor: '#f8c4c4' }]}>
              <Text style={[styles.cardHeader, { color: '#dc2626' }]}>Lý do từ chối:</Text>
              <Text style={{ fontSize: 13, color: '#991b1b', fontWeight: '500' }}>
                {activeNote.rejectReason}
              </Text>
            </View>
          ) : null}

          {/* General Note */}
          {activeNote.note ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Ghi chú chung</Text>
              <Text style={{ fontSize: 13, color: '#101114' }}>{activeNote.note}</Text>
            </View>
          ) : null}

          {/* Items List */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Danh sách mặt hàng hủy</Text>
            {activeNote.items && activeNote.items.length > 0 ? (
              activeNote.items.map((item, idx) => (
                <View key={idx} style={styles.itemBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemName}>
                      {item.itemName || item.sku || `Mặt hàng #${idx + 1}`}
                    </Text>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>Hủy {item.quantity}</Text>
                    </View>
                  </View>

                  <Text style={styles.subText}>
                    Kệ / Shelf: <Text style={styles.boldText}>{item.shelfId || item.shelfCode || 'N/A'}</Text>
                  </Text>
                  {item.lotId || item.lotNumber ? (
                    <Text style={styles.subText}>
                      Lô / Lot: <Text style={styles.boldText}>{item.lotNumber || item.lotId}</Text>
                    </Text>
                  ) : null}

                  <Text style={[styles.subText, { marginTop: 4 }]}>
                    Lý do hủy: <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>{item.reason}</Text>
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Không có thông tin dòng hàng</Text>
            )}
          </View>

          {/* Evidence Images */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Ảnh minh chứng ({allImages.length})</Text>
            {allImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingTop: 6 }}>
                {allImages.map((img, idx) => (
                  <View key={idx} style={{ marginRight: 12 }}>
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      style={{ width: 100, height: 100, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyImageBox}>
                <ImageIcon size={24} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Chưa có ảnh chứng từ hủy</Text>
              </View>
            )}
          </View>

          {/* Manager / Admin Action Buttons */}
          {canApproveOrReject ? (
            <View style={{ marginBottom: 32, gap: 10 }}>
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
                  style={styles.rejectBtn}
                >
                  <XCircle size={16} color="#dc2626" />
                  <Text style={styles.rejectBtnText}>Từ Chối Phiếu Hủy</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.rejectFormCard}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#dc2626', marginBottom: 6 }}>
                    Nhập lý do từ chối:
                  </Text>
                  <TextInput
                    style={styles.rejectInput}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder="VD: Không đúng quy trình, hàng chưa kiểm tra..."
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowRejectInput(false)}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirmReject}
                      disabled={rejecting}
                      style={styles.submitRejectBtn}
                    >
                      <Text style={styles.submitRejectText}>
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
  titleText: { fontSize: 17, fontWeight: 'bold', color: '#101114' },
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
  itemBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 13, fontWeight: 'bold', color: '#101114', flex: 1, marginRight: 8 },
  qtyBadge: { backgroundColor: '#ffebeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  qtyText: { fontSize: 12, fontWeight: 'bold', color: '#dc2626' },
  subText: { fontSize: 12, color: '#6c7078', marginTop: 2 },
  boldText: { color: '#101114', fontWeight: '600' },
  emptyImageBox: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffebeb',
    borderWidth: 1,
    borderColor: '#f8c4c4',
    paddingVertical: 12,
    borderRadius: 12,
  },
  rejectBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
  rejectFormCard: {
    backgroundColor: '#ffebeb',
    borderWidth: 1,
    borderColor: '#f8c4c4',
    padding: 12,
    borderRadius: 12,
  },
  rejectInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#101114',
    borderWidth: 1,
    borderColor: '#f8c4c4',
  },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#ffffff' },
  cancelText: { fontSize: 12, color: '#6c7078', fontWeight: '600' },
  submitRejectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#dc2626' },
  submitRejectText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold' },
});
