import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, ClipboardList, QrCode, X } from 'lucide-react-native';
import { MOCK_ADJUSTMENTS, MOCK_STOCK_COUNTS } from '../../mock/data';
import { StockCount } from '../../types';

export const StockCountListScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'counts' | 'adjustments'>('counts');
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);

  const renderStockCount = ({ item }: { item: StockCount }) => (
    <TouchableOpacity
      onPress={() => setSelectedCount(item)}
      activeOpacity={0.8}
      className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-4 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-sky-50 items-center justify-center mr-3">
            <ClipboardList size={22} color="#0284c7" />
          </View>
          <View>
            <Text className="text-slate-900 font-bold text-base">{item.code}</Text>
            <Text className="text-slate-500 text-xs font-medium">{item.warehouseZone}</Text>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200">
          <Text className="text-sky-700 text-xs font-bold">{item.status}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-slate-100 mt-2">
        <Text className="text-slate-500 text-xs font-medium">
          Tổng SKU kiểm: <Text className="text-slate-900 font-bold">{item.totalSKUs}</Text>
        </Text>
        {item.discrepanciesCount > 0 ? (
          <View className="flex-row items-center bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
            <AlertCircle size={14} color="#f43f5e" />
            <Text className="text-rose-700 font-bold text-xs ml-1">{item.discrepanciesCount} SKU lệch</Text>
          </View>
        ) : (
          <Text className="text-emerald-600 font-bold text-xs">Khớp 100%</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 px-4 py-4">
      {/* Tab Header */}
      <View className="flex-row bg-slate-200/60 p-1.5 rounded-2xl mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('counts')}
          className={`flex-1 py-2.5 rounded-xl items-center ${
            activeTab === 'counts' ? 'bg-white shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'counts' ? 'text-blue-600' : 'text-slate-500'}`}>
            ĐỢT KIỂM KÊ KHO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('adjustments')}
          className={`flex-1 py-2.5 rounded-xl items-center ${
            activeTab === 'adjustments' ? 'bg-white shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'adjustments' ? 'text-blue-600' : 'text-slate-500'}`}>
            PHIẾU ĐIỀU CHỈNH
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'counts' ? (
        <FlatList
          data={MOCK_STOCK_COUNTS}
          keyExtractor={(item) => item.id}
          renderItem={renderStockCount}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={MOCK_ADJUSTMENTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-blue-600 font-bold text-xs uppercase">{item.code}</Text>
                <Text className="text-slate-400 text-xs font-medium">{item.createdAt}</Text>
              </View>
              <Text className="text-slate-900 font-bold text-base mb-1">{item.productName}</Text>
              <Text className="text-slate-500 text-xs font-medium mb-3">Lý do: {item.reason}</Text>

              <View className="flex-row justify-between items-center pt-2 border-t border-slate-100">
                <Text className="text-slate-500 text-xs">SKU: {item.productSku}</Text>
                <Text className={`font-bold text-sm ${item.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange} Cái
                </Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Stock Count Entry Modal */}
      <Modal visible={!!selectedCount} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white border-t border-slate-200 rounded-t-3xl p-6 h-[70%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 font-bold text-xl">{selectedCount?.code}</Text>
              <TouchableOpacity onPress={() => setSelectedCount(null)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-900 font-bold text-base mb-1">{selectedCount?.warehouseZone}</Text>
            <Text className="text-slate-500 text-xs font-medium mb-4">Ngày bắt đầu: {selectedCount?.createdAt}</Text>

            <TouchableOpacity className="bg-blue-600 rounded-2xl py-4 flex-row justify-center items-center mb-4 shadow-lg shadow-blue-500/25">
              <QrCode size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2">QUÉT MÃ VẠCH SẢN PHẨM CẦN ĐẾM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedCount(null)}
              className="bg-emerald-600 rounded-2xl py-4 items-center shadow-lg shadow-emerald-500/25"
            >
              <Text className="text-white font-bold text-base">HOÀN THÀNH ĐỢT KIỂM KÊ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
