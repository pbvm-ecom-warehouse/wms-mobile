import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowUpRight, ChevronRight, MapPin, PackageCheck, QrCode, X } from 'lucide-react-native';
import { MOCK_GOODS_ISSUES } from '../../mock/data';
import { GoodsIssue } from '../../types';

export const GoodsIssueListScreen: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<GoodsIssue | null>(null);

  const priorityBadges = {
    HIGH: { label: 'Ưu tiên Cao', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
    NORMAL: { label: 'Bình thường', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    LOW: { label: 'Thấp', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
  };

  const renderIssueItem = ({ item }: { item: GoodsIssue }) => {
    const pBadge = priorityBadges[item.priority];
    return (
      <TouchableOpacity
        onPress={() => setSelectedIssue(item)}
        activeOpacity={0.8}
        className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-4 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
              <ArrowUpRight size={20} color="#007AFF" />
            </View>
            <View>
              <Text className="text-slate-900 font-bold text-base">{item.code}</Text>
              <Text className="text-slate-500 text-xs font-medium">Khách hàng: {item.customerName}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full border ${pBadge.bg}`}>
            <Text className={`text-xs font-bold ${pBadge.text}`}>{pBadge.label}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-slate-100 mt-2">
          <Text className="text-slate-500 text-xs font-medium">
            Trạng thái: <Text className="text-blue-600 font-bold">{item.status}</Text>
          </Text>
          <View className="flex-row items-center">
            <Text className="text-emerald-600 font-bold text-xs mr-1">Bắt đầu soạn hàng</Text>
            <ChevronRight size={14} color="#10b981" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 px-4 py-4">
      {/* Top Bar */}
      <View className="bg-white border border-slate-200/80 rounded-3xl p-4 mb-4 flex-row items-center justify-between shadow-sm">
        <View>
          <Text className="text-slate-900 font-bold text-lg">Soạn / Xuất Kho (Outbound)</Text>
          <Text className="text-slate-500 text-xs font-medium">Danh sách đơn hàng chờ lấy từ kệ</Text>
        </View>
        <TouchableOpacity className="bg-blue-600 px-4 py-2.5 rounded-2xl flex-row items-center shadow-md shadow-blue-500/20">
          <QrCode size={16} color="#ffffff" />
          <Text className="text-white font-bold text-xs ml-2">Quét Kệ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_GOODS_ISSUES}
        keyExtractor={(item) => item.id}
        renderItem={renderIssueItem}
        showsVerticalScrollIndicator={false}
      />

      {/* Picking Detail Modal */}
      <Modal visible={!!selectedIssue} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white border-t border-slate-200 rounded-t-3xl p-6 h-[85%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-slate-900 font-bold text-xl">{selectedIssue?.code}</Text>
                <Text className="text-slate-500 text-xs font-medium">{selectedIssue?.customerName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedIssue(null)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-900 font-bold text-base mb-3">Danh Sách Vị Trí Kệ Cần Lấy Hàng</Text>
              {selectedIssue?.items.map((item) => (
                <View key={item.id} className="bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-200">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-blue-600 font-bold text-xs uppercase">{item.sku}</Text>
                    <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <MapPin size={12} color="#10b981" />
                      <Text className="text-emerald-700 font-bold text-xs ml-1">{item.location}</Text>
                    </View>
                  </View>
                  
                  <Text className="text-slate-900 font-bold text-base mb-2">{item.productName}</Text>
                  
                  <View className="flex-row justify-between items-center pt-2 border-t border-slate-200">
                    <Text className="text-slate-500 text-xs font-medium">Cần lấy: <Text className="text-slate-900 font-bold">{item.quantityToPick}</Text></Text>
                    <TouchableOpacity className="bg-emerald-600 border border-emerald-500 px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
                      <PackageCheck size={14} color="#ffffff" />
                      <Text className="text-white font-bold text-xs ml-1">Đã lấy đủ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setSelectedIssue(null)}
                className="bg-emerald-600 rounded-2xl py-4 items-center mt-4 shadow-lg shadow-emerald-500/25"
              >
                <Text className="text-white font-bold text-base">HOÀN THÀNH SOẠN ĐƠN HÀNG</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
