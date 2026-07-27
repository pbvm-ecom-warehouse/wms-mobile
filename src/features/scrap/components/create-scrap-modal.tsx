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
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2, ImageIcon, Plus, Trash2, X } from 'lucide-react-native';
import { listProducts, type WarehouseItem } from '@/features/products/api/products-api';
import { colors } from '@/shared/theme/tokens';
import { AppButton } from '@/shared/ui';
import { createScrapNote } from '../api/scrap-api';
import type { ScrapNote } from '../types/scrap';

interface CreateScrapModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (created: ScrapNote) => void;
}

interface DraftScrapItem {
  itemId: string;
  itemName: string;
  sku: string;
  shelfId: string;
  lotId?: string;
  quantity: string;
  reason: string;
}

export function CreateScrapModal({ visible, onClose, onSuccess }: CreateScrapModalProps) {
  const [products, setProducts] = useState<WarehouseItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WarehouseItem | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  const [shelfId, setShelfId] = useState('SHELF-01');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Hàng bị hư hỏng / hết hạn');
  const [generalNote, setGeneralNote] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoadingProducts(true);
      listProducts()
        .then((items) => {
          setProducts(items);
          if (items.length > 0) {
            setSelectedProduct(items[0]);
          }
        })
        .catch((err) => console.warn('Lỗi tải sản phẩm:', err))
        .finally(() => setLoadingProducts(false));
    }
  }, [visible]);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần cấp quyền', 'Ứng dụng cần quyền camera để chụp ảnh minh chứng hủy hàng.');
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
      Alert.alert('Lỗi', err?.message || 'Không thể mở camera');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần cấp quyền', 'Ứng dụng cần quyền thư viện ảnh để chọn ảnh minh chứng.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        setEvidenceImages((prev) => [...prev, ...uris]);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      Alert.alert('Thông báo', 'Vui lòng chọn sản phẩm cần đề xuất hủy');
      return;
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Thông báo', 'Số lượng hủy phải lớn hơn 0');
      return;
    }

    if (!shelfId.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập vị trí/kệ hàng (Shelf ID)');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do hủy hàng');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createScrapNote({
        note: generalNote.trim() || undefined,
        items: [
          {
            itemId: selectedProduct.id,
            shelfId: shelfId.trim(),
            quantity: qtyNum,
            reason: reason.trim(),
          },
        ],
        imageUris: evidenceImages,
      });

      Alert.alert(
        'Thành công',
        `Đã tạo phiếu đề xuất hủy hàng ${created.id.substring(0, 8).toUpperCase()}${
          evidenceImages.length > 0 ? ` (kèm ${evidenceImages.length} ảnh)` : ''
        }`,
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Tạo phiếu hủy hàng thất bại';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tạo Phiếu Đề Xuất Hủy Hàng</Text>
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
          {/* Card: Product Selection */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Sản phẩm cần hủy</Text>

            <TouchableOpacity
              onPress={() => setShowProductDropdown(!showProductDropdown)}
              style={styles.selectBtn}
            >
              <Text style={styles.selectBtnText}>
                {selectedProduct
                  ? `${selectedProduct.name} (SKU: ${selectedProduct.sku})`
                  : 'Bấm chọn sản phẩm'}
              </Text>
            </TouchableOpacity>

            {showProductDropdown ? (
              <View style={styles.dropdownBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  value={searchProduct}
                  onChangeText={setSearchProduct}
                />
                {loadingProducts ? (
                  <ActivityIndicator size="small" color="#0878f9" style={{ marginVertical: 12 }} />
                ) : filteredProducts.length > 0 ? (
                  <ScrollView style={{ maxHeight: 180 }}>
                    {filteredProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setSelectedProduct(p);
                          setShowProductDropdown(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownItemTitle}>{p.name}</Text>
                        <Text style={styles.dropdownItemSub}>
                          SKU: {p.sku} · Tồn: {p.quantityOnHand ?? 0} {p.unit || 'cái'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
                )}
              </View>
            ) : null}

            <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Số lượng hủy *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Vị trí / Kệ hàng (Shelf) *</Text>
                <TextInput
                  style={styles.input}
                  value={shelfId}
                  onChangeText={setShelfId}
                  placeholder="SHELF-01"
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>Lý do hủy hàng *</Text>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Hàng bị hỏng, bể vỡ hoặc hết hạn..."
              />
            </View>
          </View>

          {/* Card: General Note */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Ghi chú chung</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 8 }]}
              multiline
              value={generalNote}
              onChangeText={setGeneralNote}
              placeholder="Nhập ghi chú đề xuất (nếu có)..."
            />
          </View>

          {/* Card: Evidence Images */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>
              Ảnh minh chứng hủy ({evidenceImages.length})
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 }}>
              <TouchableOpacity onPress={handleTakePhoto} style={styles.camBtn}>
                <Camera size={16} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Chụp ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickImage} style={styles.libBtn}>
                <ImageIcon size={16} color="#0878f9" />
                <Text style={{ color: '#101114', fontWeight: '500', fontSize: 13 }}>Thư viện</Text>
              </TouchableOpacity>
            </View>

            {evidenceImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingTop: 6 }}>
                {evidenceImages.map((uri, idx) => (
                  <View key={idx} style={{ position: 'relative', marginRight: 12, marginTop: 4 }}>
                    <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#ef4444',
                        borderRadius: 12,
                        padding: 3,
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 }}>
                Chưa có ảnh minh chứng. Bấm nút phía trên để chụp/chọn ảnh hàng lỗi.
              </Text>
            )}
          </View>

          {/* Submit Section */}
          <View style={{ marginTop: 12, marginBottom: 32 }}>
            <AppButton
              label="Tạo Phiếu Đề Xuất Hủy Hàng"
              loading={submitting}
              onPress={handleSubmit}
              icon={<CheckCircle2 size={18} color="#ffffff" />}
            />
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#101114' },
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
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6c7078', marginBottom: 4 },
  selectBtn: {
    backgroundColor: '#f5f6f8',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  selectBtnText: { fontSize: 13, fontWeight: '600', color: '#0878f9' },
  dropdownBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0878f9',
    borderRadius: 12,
    padding: 8,
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: '#f5f6f8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  dropdownItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#101114' },
  dropdownItemSub: { fontSize: 11, color: '#6c7078', marginTop: 2 },
  emptyText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  input: {
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#101114',
    borderWidth: 1,
    borderColor: '#e4e5e9',
  },
  camBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0878f9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  libBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f6f8',
    borderWidth: 1,
    borderColor: '#e4e5e9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
});
