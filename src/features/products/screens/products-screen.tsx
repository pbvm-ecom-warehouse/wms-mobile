import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, SearchField, Surface } from '@/shared/ui';
import { listProducts, type WarehouseItem } from '../api/products-api';
import { ProductDetailModal } from '../components/product-detail-modal';

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
                    icon={<Package size={19} color={colors.primary} />}
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

