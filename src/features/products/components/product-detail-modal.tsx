import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MapPin, Package, ShieldAlert, X } from 'lucide-react-native';
import { ENV } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { getProductDetail, type WarehouseItem } from '../api/products-api';

interface ProductDetailModalProps {
  visible: boolean;
  item: WarehouseItem | null;
  onClose: () => void;
}

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

export function ProductDetailModal({ visible, item, onClose }: ProductDetailModalProps) {
  const [detailItem, setDetailItem] = useState<WarehouseItem | null>(item);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && item?.id) {
      setDetailItem(item);
      setLoading(true);
      getProductDetail(item.id)
        .then((fresh) => {
          if (fresh) {
            setDetailItem((prev) => {
              if (!prev) return fresh;
              const onHand =
                fresh.quantityOnHand && fresh.quantityOnHand > 0
                  ? fresh.quantityOnHand
                  : prev.quantityOnHand ?? fresh.quantityOnHand ?? 0;
              const available =
                fresh.availableQty && fresh.availableQty > 0
                  ? fresh.availableQty
                  : prev.availableQty ?? fresh.availableQty ?? 0;
              const location =
                fresh.location && fresh.location !== 'Kho chính'
                  ? fresh.location
                  : prev.location || fresh.location || 'Kho chính';

              return {
                ...prev,
                ...fresh,
                quantityOnHand: onHand,
                availableQty: available,
                location: location,
              };
            });
          }
        })
        .catch((err: any) => {
          console.warn('Lỗi tải chi tiết mặt hàng kho:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetailItem(null);
    }
  }, [visible, item]);

  const activeItem = detailItem || item;
  if (!activeItem) return null;

  const onHand = activeItem.quantityOnHand ?? 0;
  const available = activeItem.availableQty ?? onHand;
  const allocated = activeItem.allocatedQty ?? 0;
  const mainImage = activeItem.images && activeItem.images.length > 0 ? activeItem.images[0] : (activeItem as any).imageUrl || (activeItem as any).image;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#ececf1]">
        {/* Modal Header */}
        <View className="bg-white px-4 pt-12 pb-3 border-b border-[#e4e5e9] flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-[#101114]" numberOfLines={1}>
                {activeItem.name || activeItem.sku}
              </Text>
            </View>
            <Text className="text-xs text-[#6c7078] mt-0.5">SKU: {activeItem.sku}</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-[#f5f6f8] rounded-full">
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="bg-[#eaf3ff] py-2 px-4 flex-row items-center justify-center gap-2">
            <ActivityIndicator size="small" color="#0878f9" />
            <Text className="text-xs font-semibold text-[#0878f9]">
              Đang cập nhật dữ liệu tồn kho...
            </Text>
          </View>
        ) : null}

        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {/* Product Main Image / Placeholder Banner */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3 items-center justify-center">
            {mainImage ? (
              <Image
                source={{ uri: resolveImageUrl(mainImage) }}
                className="w-32 h-32 rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-32 h-32 rounded-2xl bg-[#f1f5f9] items-center justify-center border border-[#e2e8f0]">
                <Package size={40} color="#94a3b8" />
                <Text className="text-[11px] text-[#94a3b8] mt-2 font-semibold">Chưa có hình ảnh</Text>
              </View>
            )}
          </View>

          {/* Main Info Card */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Thông tin sản phẩm
            </Text>

            <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
              <Text className="text-xs text-[#6c7078]">Tên sản phẩm</Text>
              <Text className="text-xs font-bold text-[#101114] text-right">{activeItem.name || 'N/A'}</Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
              <Text className="text-xs text-[#6c7078]">Mã SKU</Text>
              <Text className="text-xs font-bold text-[#0878f9]">{activeItem.sku}</Text>
            </View>

            {activeItem.barcode ? (
              <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                <Text className="text-xs text-[#6c7078]">Mã vạch (Barcode)</Text>
                <Text className="text-xs font-bold text-[#101114]">{activeItem.barcode}</Text>
              </View>
            ) : null}

            {activeItem.type ? (
              <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                <Text className="text-xs text-[#6c7078]">Loại sản phẩm</Text>
                <Text className="text-xs font-bold text-[#101114]">{activeItem.type}</Text>
              </View>
            ) : null}

            {activeItem.category || activeItem.categoryName ? (
              <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                <Text className="text-xs text-[#6c7078]">Danh mục</Text>
                <Text className="text-xs font-bold text-[#101114]">
                  {activeItem.categoryName || activeItem.category}
                </Text>
              </View>
            ) : null}

            <View className="flex-row justify-between items-center py-2">
              <Text className="text-xs text-[#6c7078]">Đơn vị tính</Text>
              <Text className="text-xs font-bold text-[#101114]">{activeItem.unit || 'Cái'}</Text>
            </View>
          </View>

          {/* Quantity Stock Card */}
          <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Số lượng tồn kho
            </Text>

            <View className="flex-row gap-3 mb-2">
              <View className="flex-1 bg-[#f0f7ff] rounded-xl p-3 items-center border border-[#cce3ff]">
                <Text className="text-xs font-semibold text-[#0878f9]">Tồn thực tế</Text>
                <Text className="text-2xl font-bold text-[#0878f9] my-1">
                  {onHand.toLocaleString('vi-VN')}
                </Text>
                <Text className="text-[11px] text-[#0878f9]">{activeItem.unit || 'Cái'}</Text>
              </View>

              <View className="flex-1 bg-[#f0fdf4] rounded-xl p-3 items-center border border-[#bbf7d0]">
                <Text className="text-xs font-semibold text-[#16a34a]">Khả dụng</Text>
                <Text className="text-2xl font-bold text-[#16a34a] my-1">
                  {available.toLocaleString('vi-VN')}
                </Text>
                <Text className="text-[11px] text-[#16a34a]">{activeItem.unit || 'Cái'}</Text>
              </View>
            </View>

            {allocated > 0 ? (
              <View className="flex-row items-center gap-2 bg-[#fffbeb] p-2.5 rounded-xl border border-[#fde68a] mt-1">
                <ShieldAlert size={16} color="#d97706" />
                <Text className="text-xs text-[#b45309]">
                  Đã phân bổ/Tạm giữ:{' '}
                  <Text className="font-bold">
                    {allocated.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </Text>
              </View>
            ) : null}

            <View className="flex-row justify-between items-center py-2 mt-2">
              <Text className="text-xs text-[#6c7078]">Vị trí lưu kho</Text>
              <View className="flex-row items-center gap-1.5">
                <MapPin size={14} color="#0878f9" />
                <Text className="text-xs font-semibold text-[#0878f9]">
                  {activeItem.location || 'Kho chính (Khu vực mặc định)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Thresholds / Reorder Card */}
          {activeItem.minStock !== undefined ||
          activeItem.maxStock !== undefined ||
          activeItem.reorderPoint !== undefined ? (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
                Định mức tồn kho
              </Text>

              {activeItem.minStock !== undefined ? (
                <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                  <Text className="text-xs text-[#6c7078]">Tồn tối thiểu (Min)</Text>
                  <Text className="text-xs font-bold text-[#101114]">
                    {activeItem.minStock.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}

              {activeItem.reorderPoint !== undefined ? (
                <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                  <Text className="text-xs text-[#6c7078]">Điểm đặt hàng lại (Reorder)</Text>
                  <Text className="text-xs font-bold text-[#101114]">
                    {activeItem.reorderPoint.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}

              {activeItem.maxStock !== undefined ? (
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-xs text-[#6c7078]">Tồn tối đa (Max)</Text>
                  <Text className="text-xs font-bold text-[#101114]">
                    {activeItem.maxStock.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Lot & Expiry & Supplier Info Card */}
          {activeItem.lotNumber || activeItem.expiryDate || activeItem.supplierName ? (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
                Thông tin bổ sung
              </Text>

              {activeItem.lotNumber ? (
                <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                  <Text className="text-xs text-[#6c7078]">Số lô (Lot)</Text>
                  <Text className="text-xs font-bold text-[#101114]">{activeItem.lotNumber}</Text>
                </View>
              ) : null}

              {activeItem.expiryDate ? (
                <View className="flex-row justify-between items-center py-2 border-b border-[#f5f6f8]">
                  <Text className="text-xs text-[#6c7078]">Hạn sử dụng</Text>
                  <Text className="text-xs font-bold text-[#101114]">{activeItem.expiryDate}</Text>
                </View>
              ) : null}

              {activeItem.supplierName ? (
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-xs text-[#6c7078]">Nhà cung cấp</Text>
                  <Text className="text-xs font-bold text-[#101114]">{activeItem.supplierName}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Description Card */}
          {activeItem.description ? (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
                Mô tả sản phẩm
              </Text>
              <Text className="text-xs text-[#101114] leading-5">{activeItem.description}</Text>
            </View>
          ) : null}

          {/* Images Card */}
          {activeItem.images && activeItem.images.length > 0 ? (
            <View className="bg-white p-4 rounded-2xl border border-[#e4e5e9] mb-3">
              <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
                Hình ảnh sản phẩm ({activeItem.images.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row pt-2"
              >
                {activeItem.images.map((img, index) => (
                  <View key={index} className="mr-2 rounded-xl overflow-hidden border border-[#e4e5e9]">
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      className="w-[100px] h-[100px]"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}
