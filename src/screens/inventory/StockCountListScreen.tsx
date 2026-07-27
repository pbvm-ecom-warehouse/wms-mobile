import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, BarChart2, CheckCircle2, ChevronRight, ClipboardList, Plus, QrCode, X } from 'lucide-react-native';
import { MOCK_ADJUSTMENTS, MOCK_STOCK_COUNTS } from '../../mock/data';
import { StockCount } from '../../types';

export const StockCountListScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'counts' | 'adjustments'>('counts');
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);

  const renderStockCount = ({ item }: { item: StockCount }) => (
    <TouchableOpacity
      onPress={() => setSelectedCount(item)}
      activeOpacity={0.8}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-md"
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-cyan-500/10 items-center justify-center mr-3">
            <ClipboardList size={22} color="#06b6d4" />
          </View>
          <View>
            <Text className="text-white font-bold text-base">{item.code}</Text>
            <Text className="text-slate-400 text-xs">{item.warehouseZone}</Text>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
          <Text className="text-cyan-400 text-xs font-semibold">{item.status}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-slate-800 mt-2">
        <Text className="text-slate-400 text-xs">
          Tổng SKU kiểm: <Text className="text-white font-bold">{item.totalSKUs}</Text>
        </Text>
        {item.discrepanciesCount > 0 ? (
          <View className="flex-row items-center bg-rose-500/10 px-2.5 py-1 rounded-lg">
            <AlertCircle size={14} color="#f43f5e" />
            <Text className="text-rose-400 font-bold text-xs ml-1">{item.discrepanciesCount} SKU lệch</Text>
          </View>
        ) : (
          <Text className="text-emerald-400 font-medium text-xs">Khớp 100%</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-950 px-4 py-4">
      {/* Tab Header */}
      <View className="flex-row bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('counts')}
          className={`flex-1 py-2.5 rounded-xl items-center ${
            activeTab === 'counts' ? 'bg-sky-600' : 'bg-transparent'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'counts' ? 'text-white' : 'text-slate-400'}`}>
            ĐỢT KIỂM KÊ KHO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('adjustments')}
          className={`flex-1 py-2.5 rounded-xl items-center ${
            activeTab === 'adjustments' ? 'bg-sky-600' : 'bg-transparent'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'adjustments' ? 'text-white' : 'text-slate-400'}`}>
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
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sky-400 font-bold text-xs">{item.code}</Text>
                <Text className="text-slate-500 text-xs">{item.createdAt}</Text>
              </View>
              <Text className="text-white font-bold text-base mb-1">{item.productName}</Text>
              <Text className="text-slate-400 text-xs mb-3">Lý do: {item.reason}</Text>

              <View className="flex-row justify-between items-center pt-2 border-t border-slate-800">
                <Text className="text-slate-400 text-xs">SKU: {item.productSku}</Text>
                <Text className={`font-bold text-sm ${item.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
        <View className="flex-1 bg-slate-950/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-xl">{selectedCount?.code}</Text>
              <TouchableOpacity onPress={() => setSelectedCount(null)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-white font-bold text-base mb-1">{selectedCount?.warehouseZone}</Text>
            <Text className="text-slate-400 text-xs mb-4">Ngày bắt đầu: {selectedCount?.createdAt}</Text>

            <TouchableOpacity className="bg-sky-600 rounded-2xl py-4 flex-row justify-center items-center mb-4">
              <QrCode size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2">QUÉT MÃ VẠCH SẢN PHẨM CẦN ĐẾM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedCount(null)}
              className="bg-emerald-600 rounded-2xl py-4 items-center"
            >
              <Text className="text-white font-bold text-base">HOÀN THÀNH ĐỢT KIỂM KÊ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
