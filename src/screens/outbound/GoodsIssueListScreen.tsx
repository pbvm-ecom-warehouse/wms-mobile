import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowUpRight, CheckCircle2, ChevronRight, MapPin, PackageCheck, QrCode, X } from 'lucide-react-native';
import { MOCK_GOODS_ISSUES } from '../../mock/data';
import { GoodsIssue } from '../../types';

export const GoodsIssueListScreen: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<GoodsIssue | null>(null);

  const priorityBadges = {
    HIGH: { label: 'Ưu tiên Cao', bg: 'bg-rose-500/20 border-rose-500/30', text: 'text-rose-400' },
    NORMAL: { label: 'Bình thường', bg: 'bg-sky-500/20 border-sky-500/30', text: 'text-sky-400' },
    LOW: { label: 'Thấp', bg: 'bg-slate-800 border-slate-700', text: 'text-slate-400' },
  };

  const renderIssueItem = ({ item }: { item: GoodsIssue }) => {
    const pBadge = priorityBadges[item.priority];
    return (
      <TouchableOpacity
        onPress={() => setSelectedIssue(item)}
        activeOpacity={0.8}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-md"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-xl bg-sky-500/10 items-center justify-center mr-3">
              <ArrowUpRight size={20} color="#0284c7" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">{item.code}</Text>
              <Text className="text-slate-400 text-xs">Khách hàng: {item.customerName}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full border ${pBadge.bg}`}>
            <Text className={`text-xs font-semibold ${pBadge.text}`}>{pBadge.label}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-slate-800 mt-2">
          <Text className="text-slate-400 text-xs">
            Trạng thái: <Text className="text-sky-400 font-bold">{item.status}</Text>
          </Text>
          <View className="flex-row items-center">
            <Text className="text-emerald-400 font-semibold text-xs mr-1">Bắt đầu soạn hàng</Text>
            <ChevronRight size={14} color="#10b981" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-950 px-4 py-4">
      {/* Top Bar */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-lg">Soạn / Xuất Kho (Outbound)</Text>
          <Text className="text-slate-400 text-xs">Danh sách đơn hàng chờ lấy từ kệ</Text>
        </View>
        <TouchableOpacity className="bg-sky-600 px-4 py-2.5 rounded-2xl flex-row items-center">
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
        <View className="flex-1 bg-slate-950/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white font-bold text-xl">{selectedIssue?.code}</Text>
                <Text className="text-slate-400 text-xs">{selectedIssue?.customerName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedIssue(null)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-white font-bold text-base mb-3">Danh Sách Vị Trí Kệ Cần Lấy Hàng</Text>
              {selectedIssue?.items.map((item) => (
                <View key={item.id} className="bg-slate-950 p-4 rounded-2xl mb-3 border border-slate-800">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sky-400 font-bold text-xs">{item.sku}</Text>
                    <View className="flex-row items-center bg-slate-800 px-2 py-1 rounded-lg">
                      <MapPin size={12} color="#10b981" />
                      <Text className="text-emerald-400 font-bold text-xs ml-1">{item.location}</Text>
                    </View>
                  </View>
                  
                  <Text className="text-white font-bold text-base mb-2">{item.productName}</Text>
                  
                  <View className="flex-row justify-between items-center pt-2 border-t border-slate-800">
                    <Text className="text-slate-400 text-xs">Cần lấy: <Text className="text-white font-bold">{item.quantityToPick}</Text></Text>
                    <TouchableOpacity className="bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex-row items-center">
                      <PackageCheck size={14} color="#10b981" />
                      <Text className="text-emerald-400 font-bold text-xs ml-1">Đã lấy đủ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setSelectedIssue(null)}
                className="bg-emerald-600 rounded-2xl py-4 items-center mt-4 shadow-lg shadow-emerald-600/30"
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
