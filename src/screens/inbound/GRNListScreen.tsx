import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowDownLeft, Calendar, ChevronRight, QrCode, X } from 'lucide-react-native';
import { MOCK_GRN_LIST } from '../../mock/data';
import { GRN } from '../../types';

export const GRNListScreen: React.FC = () => {
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);

  const statusBadges = {
    PENDING: { label: 'Chờ tiếp nhận', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    IN_PROGRESS: { label: 'Đang kiểm/nhập', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    COMPLETED: { label: 'Đã hoàn thành', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  };

  const renderGRNItem = ({ item }: { item: GRN }) => {
    const badge = statusBadges[item.status];
    return (
      <TouchableOpacity
        onPress={() => setSelectedGrn(item)}
        activeOpacity={0.8}
        className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-4 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center mr-3">
              <ArrowDownLeft size={20} color="#10b981" />
            </View>
            <View>
              <Text className="text-slate-900 font-bold text-base">{item.code}</Text>
              <Text className="text-slate-500 text-xs font-medium">{item.poNumber}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full border ${badge.bg}`}>
            <Text className={`text-xs font-bold ${badge.text}`}>{badge.label}</Text>
          </View>
        </View>

        <Text className="text-slate-600 text-sm mb-3 font-medium">Nhà cung cấp: {item.supplierName}</Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
          <View className="flex-row items-center">
            <Calendar size={14} color="#64748b" />
            <Text className="text-slate-400 text-xs ml-1 font-medium">{item.createdAt}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-blue-600 font-bold text-xs mr-1">Xem chi tiết ({item.totalItems} sản phẩm)</Text>
            <ChevronRight size={14} color="#007AFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 px-4 py-4">
      {/* Header Banner */}
      <View className="bg-white border border-slate-200/80 rounded-3xl p-4 mb-4 flex-row items-center justify-between shadow-sm">
        <View>
          <Text className="text-slate-900 font-bold text-lg">Quản Lý Nhập Kho (GRN)</Text>
          <Text className="text-slate-500 text-xs font-medium">Tổng số: {MOCK_GRN_LIST.length} phiếu nhập kho</Text>
        </View>
        <TouchableOpacity className="bg-emerald-600 px-4 py-2.5 rounded-2xl flex-row items-center shadow-md shadow-emerald-500/20">
          <QrCode size={16} color="#ffffff" />
          <Text className="text-white font-bold text-xs ml-2">Quét Mã PO</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_GRN_LIST}
        keyExtractor={(item) => item.id}
        renderItem={renderGRNItem}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedGrn} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white border-t border-slate-200 rounded-t-3xl p-6 h-[80%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 font-bold text-xl">{selectedGrn?.code}</Text>
              <TouchableOpacity onPress={() => setSelectedGrn(null)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200">
                <Text className="text-slate-500 text-xs mb-1">Mã đơn mua hàng PO: <Text className="text-slate-900 font-bold">{selectedGrn?.poNumber}</Text></Text>
                <Text className="text-slate-500 text-xs mb-1">Nhà cung cấp: <Text className="text-slate-900 font-bold">{selectedGrn?.supplierName}</Text></Text>
                <Text className="text-slate-500 text-xs">Thời gian khởi tạo: <Text className="text-slate-900 font-medium">{selectedGrn?.createdAt}</Text></Text>
              </View>

              <Text className="text-slate-900 font-bold text-base mb-3">Danh Sách Sản Phẩm Tiếp Nhận</Text>
              {selectedGrn?.items.map((item) => (
                <View key={item.id} className="bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-200">
                  <Text className="text-blue-600 font-bold text-xs uppercase">{item.sku}</Text>
                  <Text className="text-slate-900 font-bold text-base mb-2">{item.productName}</Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs font-medium">Yêu cầu: {item.expectedQty} {item.unit}</Text>
                    <Text className="text-emerald-600 font-bold text-xs">Đã nhập: {item.receivedQty} {item.unit}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setSelectedGrn(null)}
                className="bg-blue-600 rounded-2xl py-4 items-center mt-4 shadow-lg shadow-blue-500/25"
              >
                <Text className="text-white font-bold text-base">XÁC NHẬN HOÀN THÀNH NHẬP KHO</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
