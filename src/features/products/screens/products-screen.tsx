import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { ENV } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, SearchField, Surface } from '@/shared/ui';
import { listProducts, type WarehouseItem } from '../api/products-api';
import { ProductDetailModal } from '../components/product-detail-modal';

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

function ProductAvatar({ item }: { item: WarehouseItem }) {
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : (item as any).imageUrl || (item as any).image;
  const imageUri = resolveImageUrl(firstImage);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        className="w-11 h-11 rounded-xl"
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="w-11 h-11 rounded-xl bg-[#f1f5f9] items-center justify-center border border-[#e2e8f0]">
      <Package size={20} color="#94a3b8" />
    </View>
  );
}

export function ProductsScreen() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<WarehouseItem | null>(null);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listProducts();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const query = search.trim().toLowerCase();
  const filtered = items.filter(
    (item) => item.name?.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query),
  );

  return (
    <Screen withTabBar>
      <AppHeader
        title="Sản phẩm"
        subtitle={loading ? 'Đang tải dữ liệu...' : `${items.length} mặt hàng kho`}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder="Tên hoặc SKU" />
      <ScrollView
        className="flex-1 mt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchItems(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Đang tải danh sách sản phẩm...</Text>
          </View>
        ) : filtered.length ? (
          <Surface>
            {filtered.map((item) => {
              const qty = item.availableQty ?? item.quantityOnHand ?? 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedProduct(item)}
                  activeOpacity={0.7}
                >
                  <ListRow
                    icon={<ProductAvatar item={item} />}
                    title={item.name || item.sku}
                    subtitle={`${item.sku} · ${item.location || 'Kho chính'}`}
                    meta={`${qty.toLocaleString('vi-VN')} ${item.unit || 'Cái'}`}
                  />
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description={
              search
                ? 'Thử tìm bằng tên hoặc mã SKU khác.'
                : 'Hiện chưa có mặt hàng kho nào trong hệ thống.'
            }
            actionLabel={search ? 'Xóa tìm kiếm' : 'Tải lại'}
            onAction={search ? () => setSearch('') : () => fetchItems()}
          />
        )}
      </ScrollView>

      {/* Stock Item Detail Modal */}
      <ProductDetailModal
        visible={Boolean(selectedProduct)}
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </Screen>
  );
}

