import React, { useState } from 'react';
import { Image, FlatList, Text, TextInput, View } from 'react-native';
import { MapPin, Package, Search, Tag } from 'lucide-react-native';
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
    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-3 flex-row items-center">
      {item.image ? (
        <Image source={{ uri: item.image }} className="w-20 h-20 rounded-2xl mr-4 bg-slate-800" />
      ) : (
        <View className="w-20 h-20 rounded-2xl mr-4 bg-slate-800 items-center justify-center border border-slate-700">
          <Package size={32} color="#64748b" />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-bold text-sky-400 uppercase">{item.sku}</Text>
          <View className="bg-slate-800 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] text-slate-300 font-medium">{item.category}</Text>
          </View>
        </View>

        <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
          {item.name}
        </Text>

        <View className="flex-row items-center mb-1">
          <MapPin size={12} color="#94a3b8" />
          <Text className="text-slate-400 text-xs ml-1">Vị trí: {item.location}</Text>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
          <Text className="text-slate-400 text-xs">
            Tồn kho: <Text className="text-white font-bold">{item.totalQuantity.toLocaleString()}</Text> {item.unit}
          </Text>
          <Text className="text-emerald-400 text-xs font-semibold">
            Khả dụng: {item.availableQuantity.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-950 px-4 py-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 mb-4">
        <Search size={20} color="#94a3b8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên sản phẩm, SKU hoặc Mã vạch..."
          placeholderTextColor="#64748b"
          className="flex-1 text-white ml-3 text-sm"
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
