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
import { Camera, CheckCircle2, ImageIcon, X } from 'lucide-react-native';
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
      <View className="flex-1 bg-[#ececf1]">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <Text className="text-lg font-bold text-[#101114]">Tạo Phiếu Đề Xuất Hủy Hàng</Text>
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
          {/* Card: Product Selection */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Sản phẩm cần hủy</Text>

            <TouchableOpacity
              onPress={() => setShowProductDropdown(!showProductDropdown)}
              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2.5"
            >
              <Text className="text-xs font-semibold text-[#101114]">
                {selectedProduct
                  ? `${selectedProduct.name} (SKU: ${selectedProduct.sku})`
                  : 'Bấm chọn sản phẩm'}
              </Text>
            </TouchableOpacity>

            {showProductDropdown ? (
              <View className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl p-2.5 mt-2">
                <TextInput
                  className="bg-white border border-[#e4e5e9] rounded-lg px-3 py-1.5 text-xs text-[#101114] mb-2"
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  value={searchProduct}
                  onChangeText={setSearchProduct}
                />
                {loadingProducts ? (
                  <ActivityIndicator size="small" color="#0878f9" className="my-3" />
                ) : filteredProducts.length > 0 ? (
                  <ScrollView className="max-h-[180px]">
                    {filteredProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setSelectedProduct(p);
                          setShowProductDropdown(false);
                        }}
                        className="py-2 px-1 border-b border-[#e4e5e9]/50"
                      >
                        <Text className="text-xs font-bold text-[#101114]">{p.name}</Text>
                        <Text className="text-[11px] text-[#6c7078]">
                          SKU: {p.sku} · Tồn: {p.quantityOnHand ?? 0} {p.unit || 'cái'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text className="text-xs text-[#6c7078] italic my-2">Không tìm thấy sản phẩm nào</Text>
                )}
              </View>
            ) : null}

            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-[#6c7078] mb-1">Số lượng hủy *</Text>
                <TextInput
                  className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-[#6c7078] mb-1">Vị trí / Kệ hàng (Shelf) *</Text>
                <TextInput
                  className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                  value={shelfId}
                  onChangeText={setShelfId}
                  placeholder="SHELF-01"
                />
              </View>
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-[#6c7078] mb-1">Lý do hủy hàng *</Text>
              <TextInput
                className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114]"
                value={reason}
                onChangeText={setReason}
                placeholder="Hàng bị hỏng, bể vỡ hoặc hết hạn..."
              />
            </View>
          </View>

          {/* Card: General Note */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Ghi chú chung</Text>
            <TextInput
              className="bg-[#f5f6f8] border border-[#e4e5e9] rounded-xl px-3 py-2 text-xs text-[#101114] h-[70px]"
              multiline
              textAlignVertical="top"
              value={generalNote}
              onChangeText={setGeneralNote}
              placeholder="Nhập ghi chú đề xuất (nếu có)..."
            />
          </View>

          {/* Card: Evidence Images */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Ảnh minh chứng hủy ({evidenceImages.length})
            </Text>

            <View className="flex-row gap-2 my-2">
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="flex-row items-center gap-1.5 bg-[#0878f9] px-3 py-2 rounded-xl"
              >
                <Camera size={16} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Chụp ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickImage}
                className="flex-row items-center gap-1.5 bg-[#f5f6f8] border border-[#e4e5e9] px-3 py-2 rounded-xl"
              >
                <ImageIcon size={16} color="#0878f9" />
                <Text className="text-[#101114] font-medium text-xs">Thư viện</Text>
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
              <Text className="text-xs text-[#9ca3af] italic mt-1">
                Chưa có ảnh minh chứng. Bấm nút phía trên để chụp/chọn ảnh hàng lỗi.
              </Text>
            )}
          </View>

          {/* Submit Section */}
          <View className="mt-3 mb-8">
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
