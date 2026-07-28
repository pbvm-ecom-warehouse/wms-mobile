import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Barcode,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Layers,
  MapPin,
  PackageCheck,
  ShieldAlert,
  Tag,
  X,
} from 'lucide-react-native';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && item?.id) {
      setDetailItem(item);
      setLoading(true);
      setErrorMsg(null);
      getProductDetail(item.id)
        .then((fresh) => {
          if (fresh) {
            setDetailItem((prev) => ({ ...prev, ...fresh }));
          }
        })
        .catch((err: any) => {
          console.warn('Lỗi tải chi tiết mặt hàng kho:', err);
          // Don't wipe item if fetch fails, keep list item data
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetailItem(null);
    }
  }, [visible, item?.id]);

  const activeItem = detailItem || item;
  if (!activeItem) return null;

  const onHand = activeItem.quantityOnHand ?? 0;
  const available = activeItem.availableQty ?? onHand;
  const allocated = activeItem.allocatedQty ?? 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.titleText} numberOfLines={1}>
                {activeItem.name || activeItem.sku}
              </Text>
            </View>
            <Text style={styles.subtitleText}>SKU: {activeItem.sku}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#0878f9" />
            <Text style={styles.loadingBannerText}>Đang cập nhật dữ liệu tồn kho...</Text>
          </View>
        ) : null}

        <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Main Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Thông tin sản phẩm</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Tên sản phẩm</Text>
              <Text style={styles.metaValueBold}>{activeItem.name || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.metaLabel}>Mã SKU</Text>
              <Text style={styles.skuValue}>{activeItem.sku}</Text>
            </View>

            {activeItem.barcode ? (
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Mã vạch (Barcode)</Text>
                <View style={styles.rowInline}>
                  <Barcode size={14} color="#6c7078" />
                  <Text style={styles.metaValueBold}>{activeItem.barcode}</Text>
                </View>
              </View>
            ) : null}

            {activeItem.type ? (
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Loại sản phẩm</Text>
                <Text style={styles.metaValueBold}>{activeItem.type}</Text>
              </View>
            ) : null}

            {activeItem.category || activeItem.categoryName ? (
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Danh mục</Text>
                <Text style={styles.metaValueBold}>
                  {activeItem.categoryName || activeItem.category}
                </Text>
              </View>
            ) : null}

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.metaLabel}>Đơn vị tính</Text>
              <Text style={styles.metaValueBold}>{activeItem.unit || 'Cái'}</Text>
            </View>
          </View>

          {/* Quantity Stock Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Số lượng tồn kho</Text>
            
            <View style={styles.stockGrid}>
              <View style={styles.stockBoxPrimary}>
                <Text style={styles.stockBoxLabel}>Tồn thực tế</Text>
                <Text style={styles.stockBoxNumberPrimary}>
                  {onHand.toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.stockBoxUnit}>{activeItem.unit || 'Cái'}</Text>
              </View>

              <View style={styles.stockBoxSuccess}>
                <Text style={styles.stockBoxLabelSuccess}>Khả dụng</Text>
                <Text style={styles.stockBoxNumberSuccess}>
                  {available.toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.stockBoxUnitSuccess}>{activeItem.unit || 'Cái'}</Text>
              </View>
            </View>

            {allocated > 0 ? (
              <View style={styles.allocatedBox}>
                <ShieldAlert size={16} color="#d97706" />
                <Text style={styles.allocatedText}>
                  Đã phân bổ/Tạm giữ:{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {allocated.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </Text>
              </View>
            ) : null}

            <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 8 }]}>
              <Text style={styles.metaLabel}>Vị trí lưu kho</Text>
              <View style={styles.rowInline}>
                <MapPin size={14} color="#0878f9" />
                <Text style={styles.locationValue}>
                  {activeItem.location || 'Kho chính (Khu vực mặc định)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Thresholds / Reorder Card */}
          {activeItem.minStock !== undefined ||
          activeItem.maxStock !== undefined ||
          activeItem.reorderPoint !== undefined ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Định mức tồn kho</Text>
              
              {activeItem.minStock !== undefined ? (
                <View style={styles.infoRow}>
                  <Text style={styles.metaLabel}>Tồn tối thiểu (Min)</Text>
                  <Text style={styles.metaValueBold}>
                    {activeItem.minStock.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}

              {activeItem.reorderPoint !== undefined ? (
                <View style={styles.infoRow}>
                  <Text style={styles.metaLabel}>Điểm đặt hàng lại (Reorder)</Text>
                  <Text style={styles.metaValueBold}>
                    {activeItem.reorderPoint.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}

              {activeItem.maxStock !== undefined ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.metaLabel}>Tồn tối đa (Max)</Text>
                  <Text style={styles.metaValueBold}>
                    {activeItem.maxStock.toLocaleString('vi-VN')} {activeItem.unit || 'Cái'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Lot & Expiry & Supplier Info Card */}
          {activeItem.lotNumber || activeItem.expiryDate || activeItem.supplierName ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Thông tin bổ sung</Text>

              {activeItem.lotNumber ? (
                <View style={styles.infoRow}>
                  <Text style={styles.metaLabel}>Số lô (Lot)</Text>
                  <Text style={styles.metaValueBold}>{activeItem.lotNumber}</Text>
                </View>
              ) : null}

              {activeItem.expiryDate ? (
                <View style={styles.infoRow}>
                  <Text style={styles.metaLabel}>Hạn sử dụng</Text>
                  <Text style={styles.metaValueBold}>{activeItem.expiryDate}</Text>
                </View>
              ) : null}

              {activeItem.supplierName ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.metaLabel}>Nhà cung cấp</Text>
                  <Text style={styles.metaValueBold}>{activeItem.supplierName}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Description Card */}
          {activeItem.description ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Mô tả sản phẩm</Text>
              <Text style={styles.descriptionText}>{activeItem.description}</Text>
            </View>
          ) : null}

          {/* Images Card */}
          {activeItem.images && activeItem.images.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>
                Hình ảnh sản phẩm ({activeItem.images.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row', paddingTop: 8 }}
              >
                {activeItem.images.map((img, index) => (
                  <View key={index} style={styles.imageThumbnail}>
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  loadingBanner: {
    backgroundColor: '#eaf3ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 12,
    color: '#0878f9',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  metaLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metaValueBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  skuValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0878f9',
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  stockBoxPrimary: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cce3ff',
  },
  stockBoxLabel: {
    fontSize: 12,
    color: '#0878f9',
    fontWeight: '600',
  },
  stockBoxNumberPrimary: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0878f9',
    marginVertical: 4,
  },
  stockBoxUnit: {
    fontSize: 11,
    color: '#0878f9',
  },
  stockBoxSuccess: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  stockBoxLabelSuccess: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  stockBoxNumberSuccess: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
    marginVertical: 4,
  },
  stockBoxUnitSuccess: {
    fontSize: 11,
    color: '#16a34a',
  },
  allocatedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 4,
  },
  allocatedText: {
    fontSize: 12,
    color: '#b45309',
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0878f9',
  },
  descriptionText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  imageThumbnail: {
    marginRight: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
