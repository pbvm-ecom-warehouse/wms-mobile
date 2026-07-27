import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, MapPin, PhoneCall, Truck, X, XCircle } from 'lucide-react-native';
import { MOCK_SHIPPING_DELIVERIES } from '../../mock/data';
import { ShippingDelivery } from '../../types';

export const ShippingListScreen: React.FC = () => {
  const [selectedDelivery, setSelectedDelivery] = useState<ShippingDelivery | null>(null);

  const statusBadges = {
    READY: { label: 'Chờ lấy hàng', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    IN_TRANSIT: { label: 'Đang giao hàng', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
    DELIVERED: { label: 'Đã giao thành công', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    FAILED: { label: 'Giao thất bại', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  };

  const renderDeliveryItem = ({ item }: { item: ShippingDelivery }) => {
    const badge = statusBadges[item.status];
    return (
      <TouchableOpacity
        onPress={() => setSelectedDelivery(item)}
        activeOpacity={0.8}
        className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-4 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-orange-50 items-center justify-center mr-3">
              <Truck size={22} color="#f97316" />
            </View>
            <View>
              <Text className="text-slate-900 font-bold text-base">{item.trackingCode}</Text>
              <Text className="text-slate-500 text-xs font-medium">Người nhận: {item.recipientName}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full border ${badge.bg}`}>
            <Text className={`text-xs font-bold ${badge.text}`}>{badge.label}</Text>
          </View>
        </View>

        <View className="flex-row items-start my-2">
          <MapPin size={16} color="#64748b" className="mt-0.5" />
          <Text className="text-slate-700 text-xs ml-2 flex-1 font-medium">{item.address}</Text>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-slate-100">
          <Text className="text-slate-500 text-xs">
            Tiền COD: <Text className="text-emerald-600 font-bold">{item.codAmount.toLocaleString()} đ</Text>
          </Text>
          <View className="flex-row items-center bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            <PhoneCall size={12} color="#007AFF" />
            <Text className="text-blue-600 font-bold text-xs ml-1.5">{item.phone}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 px-4 py-4">
      {/* Top Banner */}
      <View className="bg-white border border-slate-200/80 rounded-3xl p-4 mb-4 flex-row items-center justify-between shadow-sm">
        <View>
          <Text className="text-slate-900 font-bold text-lg">Quản Lý Giao Hàng / Vận Đơn</Text>
          <Text className="text-slate-500 text-xs font-medium">Danh sách đơn hàng Shipper tiếp nhận</Text>
        </View>
        <View className="bg-orange-50 px-3 py-1.5 rounded-2xl border border-orange-200">
          <Text className="text-orange-700 font-bold text-xs">3 Đơn hàng</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_SHIPPING_DELIVERIES}
        keyExtractor={(item) => item.id}
        renderItem={renderDeliveryItem}
        showsVerticalScrollIndicator={false}
      />

      {/* Delivery Update Modal */}
      <Modal visible={!!selectedDelivery} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white border-t border-slate-200 rounded-t-3xl p-6 h-[75%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 font-bold text-xl">{selectedDelivery?.trackingCode}</Text>
              <TouchableOpacity onPress={() => setSelectedDelivery(null)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200">
              <Text className="text-slate-500 text-xs mb-1">Người nhận: <Text className="text-slate-900 font-bold">{selectedDelivery?.recipientName}</Text></Text>
              <Text className="text-slate-500 text-xs mb-1">SĐT: <Text className="text-blue-600 font-bold">{selectedDelivery?.phone}</Text></Text>
              <Text className="text-slate-500 text-xs mb-1">Địa chỉ: <Text className="text-slate-900 font-medium">{selectedDelivery?.address}</Text></Text>
              <Text className="text-slate-500 text-xs">Ghi chú: <Text className="text-amber-600 font-semibold">{selectedDelivery?.deliveryNote || 'Không'}</Text></Text>
            </View>

            <View className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200 flex-row justify-between items-center">
              <Text className="text-slate-700 font-semibold text-sm">Tổng Thu COD:</Text>
              <Text className="text-emerald-600 font-bold text-xl">{selectedDelivery?.codAmount.toLocaleString()} đ</Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setSelectedDelivery(null)}
                className="flex-1 bg-emerald-600 rounded-2xl py-4 items-center flex-row justify-center shadow-lg shadow-emerald-500/25"
              >
                <CheckCircle2 size={20} color="#ffffff" />
                <Text className="text-white font-bold text-sm ml-2">GIAO THÀNH CÔNG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedDelivery(null)}
                className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl py-4 items-center flex-row justify-center"
              >
                <XCircle size={20} color="#f43f5e" />
                <Text className="text-rose-700 font-bold text-sm ml-2">BÁO GIAO THẤT BẠI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
