import React, { useState } from 'react';
import { Package } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, SearchField, Surface } from '@/shared/ui';
import { products } from '../data/mock-products';

export function ProductsScreen() {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = products.filter(
    (item) => item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query),
  );

  return (
    <Screen withTabBar>
      <AppHeader title="Sản phẩm" subtitle="Tra cứu tồn kho và vị trí" />
      <SearchField value={search} onChangeText={setSearch} placeholder="Tên hoặc SKU" />
      <Surface className="mt-4">
        {filtered.length ? (
          filtered.map((item) => (
            <ListRow
              key={item.id}
              icon={<Package size={19} color={colors.primary} />}
              title={item.name}
              subtitle={`${item.sku} · ${item.location}`}
              meta={`${item.available.toLocaleString('vi-VN')} ${item.unit}`}
            />
          ))
        ) : (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Thử tìm bằng tên hoặc mã SKU khác."
            actionLabel="Xóa tìm kiếm"
            onAction={() => setSearch('')}
          />
        )}
      </Surface>
    </Screen>
  );
}
