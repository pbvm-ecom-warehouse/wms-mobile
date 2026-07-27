import React, { useState } from 'react';
import { Image, FlatList, Text, TextInput, View } from 'react-native';
import { MapPin, Package, Search } from 'lucide-react-native';
import { MOCK_PRODUCTS } from '../../mock/data';
import { Product } from '../../types';

export const ProductListScreen: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredProducts = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View className="bg-white border border-slate-200/80 rounded-3xl p-4 mb-3 flex-row items-center shadow-sm">
      {item.image ? (
        <Image source={{ uri: item.image }} className="w-20 h-20 rounded-2xl mr-4 bg-slate-100 border border-slate-200" />
      ) : (
        <View className="w-20 h-20 rounded-2xl mr-4 bg-slate-100 items-center justify-center border border-slate-200">
          <Package size={32} color="#94a3b8" />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-bold text-blue-600 uppercase">{item.sku}</Text>
          <View className="bg-slate-100 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] text-slate-600 font-medium">{item.category}</Text>
          </View>
        </View>

        <Text className="text-slate-900 font-bold text-base mb-1" numberOfLines={1}>
          {item.name}
        </Text>

        <View className="flex-row items-center mb-1">
          <MapPin size={12} color="#64748b" />
          <Text className="text-slate-500 text-xs ml-1 font-medium">Vị trí: {item.location}</Text>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <Text className="text-slate-500 text-xs">
            Tồn kho: <Text className="text-slate-900 font-bold">{item.totalQuantity.toLocaleString()}</Text> {item.unit}
          </Text>
          <Text className="text-emerald-600 text-xs font-bold">
            Khả dụng: {item.availableQuantity.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 px-4 py-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-3.5 mb-4 shadow-sm">
        <Search size={20} color="#64748b" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên sản phẩm, SKU hoặc Mã vạch..."
          placeholderTextColor="#94a3b8"
          className="flex-1 text-slate-900 ml-3 text-sm font-medium"
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};
