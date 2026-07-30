import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  PackageCheck,
  Send,
  ShoppingCart,
  X,
  XCircle,
} from 'lucide-react-native';
import { StatusBadge } from '@/shared/ui';
import { updatePurchaseOrderStatus } from '../api/orders-api';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/orders';

interface PurchaseOrderDetailModalProps {
  visible: boolean;
  po: PurchaseOrder | null;
  onClose: () => void;
  onUpdate: () => void;
}

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'neutral' },
  PARTIALLY_RECEIVED: { label: 'Nhập 1 phần', variant: 'warning' },
  COMPLETED: { label: 'Đã hoàn tất', variant: 'success' },
};

export function PurchaseOrderDetailModal({
  visible,
  po,
  onClose,
  onUpdate,
}: PurchaseOrderDetailModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!visible || !po) return null;

  const statusCfg = statusBadgeMap[po.status] || {
    label: po.status,
    variant: 'neutral',
  };

  const handleUpdateStatus = async (nextStatus: PurchaseOrderStatus) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updatePurchaseOrderStatus(po.id, nextStatus);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.warn('Lỗi cập nhật trạng thái đơn hàng:', err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đổi trạng thái đơn hàng';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl h-[85%] w-full overflow-hidden flex-col justify-between">
          {/* Modal Header */}
          <View className="p-4 border-b border-[#e4e5e9] flex-row justify-between items-center bg-[#f8fafc]">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-2xl bg-[#0878f9]/10 items-center justify-center">
                <ShoppingCart size={20} color="#0878f9" />
              </View>
              <View>
                <Text className="text-base font-extrabold text-[#101114]">
                  Chi tiết đơn hàng: {po.poNumber}
                </Text>
                <Text className="text-xs text-[#6c7078]">Đặt mua từ Nhà cung cấp</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-white rounded-full border border-[#e4e5e9]">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1 p-4">
            {errorMsg ? (
              <View className="mb-4 p-3 bg-[#fff5f5] border border-[#fecaca] rounded-2xl flex-row items-center gap-2">
                <AlertCircle size={18} color="#dc2626" />
                <Text className="text-xs font-bold text-[#b91c1c] flex-1">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Status & General Info */}
            <View className="bg-[#f8fafc] p-4 rounded-2xl border border-[#e4e5e9] mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-bold text-[#64748b] uppercase">Trạng thái đơn hàng</Text>
                <StatusBadge {...statusCfg} />
              </View>

              <View className="gap-2 pt-2 border-t border-[#e2e8f0]">
                <View className="flex-row items-center gap-2">
                  <Building2 size={15} color="#64748b" />
                  <Text className="text-xs text-[#64748b]">Nhà cung cấp:</Text>
                  <Text className="text-xs font-bold text-[#101114] flex-1" numberOfLines={1}>
                    {po.supplierName}
                  </Text>
                </View>

                {Boolean(po.supplierCode) && (
                  <View className="flex-row items-center gap-2 pl-6">
                    <Text className="text-xs text-[#64748b]">Mã NCC:</Text>
                    <Text className="text-xs font-bold text-[#101114]">{po.supplierCode}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-2">
                  <Calendar size={15} color="#64748b" />
                  <Text className="text-xs text-[#64748b]">Ngày tạo đơn:</Text>
                  <Text className="text-xs font-bold text-[#101114]">
                    {po.orderDate ? po.orderDate.split('T')[0].split(' ')[0] : po.createdAt?.split('T')[0]}
                  </Text>
                </View>

                {Boolean(po.expectedDate) && (
                  <View className="flex-row items-center gap-2">
                    <Clock size={15} color="#d97706" />
                    <Text className="text-xs text-[#64748b]">Dự kiến nhận hàng:</Text>
                    <Text className="text-xs font-bold text-[#d97706]">
                      {po.expectedDate ? po.expectedDate.split('T')[0].split(' ')[0] : ''}
                    </Text>
                  </View>
                )}
              </View>

              {Boolean(po.note) && (
                <View className="mt-3 pt-3 border-t border-[#e2e8f0]">
                  <Text className="text-[11px] font-semibold text-[#64748b]">Ghi chú đơn hàng:</Text>
                  <Text className="text-xs font-medium text-[#334155] mt-0.5">{po.note}</Text>
                </View>
              )}
            </View>

            {/* Line Items List */}
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">
              Danh sách sản phẩm đặt mua ({po.items?.length || 0})
            </Text>

            <View className="gap-2.5 mb-6">
              {po.items?.map((item, idx) => (
                <View key={item.itemId || idx} className="bg-white p-3.5 rounded-2xl border border-[#e4e5e9]">
                  {/* Item Name & SKU */}
                  <View className="mb-2">
                    <Text className="text-xs font-extrabold text-[#101114] leading-4" numberOfLines={2}>
                      {item.itemName || item.sku}
                    </Text>
                    <Text className="text-[11px] font-semibold text-[#0878f9] mt-0.5">
                      SKU: {item.sku}
                    </Text>
                  </View>

                  {/* Quantity, Unit Price, Total */}
                  <View className="bg-[#f8fafc] p-2.5 rounded-xl flex-row justify-between items-center border border-[#f1f5f9]">
                    <View className="flex-1 mr-2">
                      <Text className="text-[10px] font-medium text-[#64748b]">Số lượng & Đơn giá</Text>
                      <Text className="text-xs font-bold text-[#334155]" numberOfLines={1}>
                        {item.expectedQty} {item.unit || 'thùng'} × {(item.unitPrice || 0).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-[10px] font-medium text-[#64748b]">Thành tiền</Text>
                      <Text className="text-xs font-black text-[#16a34a]">
                        {(item.expectedQty * (item.unitPrice || 0)).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  </View>

                  {(item.receivedQty ?? 0) > 0 && (
                    <View className="mt-2 pt-2 border-t border-[#f1f5f9] flex-row justify-between items-center">
                      <Text className="text-[11px] text-[#16a34a] font-bold">
                        Đã nhập: {item.receivedQty} {item.unit || 'thùng'}
                      </Text>
                      <Text className="text-[11px] text-[#d97706] font-bold">
                        Còn lại: {item.remainingQty} {item.unit || 'thùng'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View className="p-4 bg-white border-t border-[#e4e5e9] gap-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs text-[#64748b] font-medium">Tổng giá trị đơn hàng:</Text>
              <Text className="text-lg font-black text-[#0878f9]">
                {po.totalAmount ? po.totalAmount.toLocaleString('vi-VN') : 0} đ
              </Text>
            </View>

            {submitting ? (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#0878f9" />
              </View>
            ) : po.status === 'SENT' ? (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('PARTIALLY_RECEIVED')}
                  className="flex-1 bg-[#d97706] py-3 rounded-2xl items-center justify-center flex-row gap-2 active:opacity-80"
                >
                  <PackageCheck size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Tạo phiếu nhập (GRN)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleUpdateStatus('COMPLETED')}
                  className="bg-[#16a34a] px-4 py-3 rounded-2xl items-center justify-center flex-row gap-1.5 active:opacity-80"
                >
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Hoàn tất</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
