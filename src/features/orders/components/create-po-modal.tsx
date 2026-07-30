import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Box,
  Check,
  ChevronDown,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { listProducts } from '@/features/products/api/products-api';
import type { WarehouseItem } from '@/features/products/api/products-api';
import {
  listSupplierItemsBySupplier,
  listSuppliers,
} from '@/features/suppliers/api/suppliers-api';
import type { Supplier } from '@/features/suppliers/api/suppliers-api';
import { createPurchaseOrder } from '../api/orders-api';
import type { CreatePurchaseOrderItemInput } from '../types/orders';

interface CreatePurchaseOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePurchaseOrderModal({
  visible,
  onClose,
  onSuccess,
}: CreatePurchaseOrderModalProps) {
  // Supplier Selection
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Date Selection
  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [dateObj, setDateObj] = useState<Date>(defaultDate);
  const [expectedDate, setExpectedDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [note, setNote] = useState('');

  // Selected Order Line Items
  const [selectedItems, setSelectedItems] = useState<CreatePurchaseOrderItemInput[]>([]);

  // Product Selection Modal & Supplier Items
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<
    { itemId: string; sku: string; name: string; unit: string; price: number }[]
  >([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      // Reset form
      setSelectedSupplier(null);
      const initDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      setDateObj(initDate);
      setExpectedDate(initDate.toISOString().split('T')[0]);
      setShowDatePicker(false);
      setNote('');
      setSelectedItems([]);
      setErrorMsg('');

      // Load Suppliers
      setLoadingSuppliers(true);
      listSuppliers()
        .then((res) => {
          setSuppliers(res || []);
          if (res && res.length > 0) {
            handleSelectSupplier(res[0]);
          }
        })
        .catch((err) => {
          console.warn('Lỗi tải Nhà cung cấp:', err);
          setSuppliers([]);
          const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách Nhà cung cấp';
          setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
        })
        .finally(() => setLoadingSuppliers(false));
    }
  }, [visible]);

  // Load products bound to the selected supplier
  const handleSelectSupplier = async (sup: Supplier) => {
    setSelectedSupplier(sup);
    setSelectedItems([]); // Clear previous items when supplier changes
    setLoadingProducts(true);

    try {
      const [supItems, warehouseItems] = await Promise.all([
        listSupplierItemsBySupplier(sup.id),
        listProducts(),
      ]);

      if (supItems && supItems.length > 0) {
        const mapped = supItems.map((sItem) => {
          const matchedWh = warehouseItems.find((w) => w.id === sItem.itemId || w.sku === sItem.sku);
          return {
            itemId: sItem.itemId,
            sku: sItem.sku || matchedWh?.sku || 'SKU-ITEM',
            name: sItem.itemName || matchedWh?.name || 'Sản phẩm NCC',
            unit: sItem.unit || matchedWh?.unit || 'thùng',
            price: sItem.purchasePrice || matchedWh?.price || 0,
          };
        });
        setSupplierProducts(mapped);
      } else {
        // Fallback: If no supplier items linked yet, map all warehouse items
        setSupplierProducts(
          warehouseItems.map((w) => ({
            itemId: w.id,
            sku: w.sku,
            name: w.name,
            unit: w.unit || 'thùng',
            price: w.price || 0,
          })),
        );
      }
    } catch {
      setSupplierProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProductItem = (prod: { itemId: string; sku: string; name: string; unit: string; price: number }) => {
    const existingIndex = selectedItems.findIndex((it) => it.itemId === prod.itemId || it.sku === prod.sku);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].expectedQty += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          itemId: prod.itemId,
          sku: prod.sku,
          itemName: prod.name,
          expectedQty: 10,
          unit: prod.unit || 'thùng',
          unitPrice: prod.price || 50000,
        },
      ]);
    }
    setShowProductPicker(false);
  };

  const handleUpdateItemQty = (index: number, qtyStr: string) => {
    const qty = Math.max(1, parseInt(qtyStr, 10) || 1);
    const updated = [...selectedItems];
    updated[index].expectedQty = qty;
    setSelectedItems(updated);
  };

  const handleUpdateItemPrice = (index: number, priceStr: string) => {
    const price = Math.max(0, parseInt(priceStr, 10) || 0);
    const updated = [...selectedItems];
    updated[index].unitPrice = price;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalEstimatedCost = selectedItems.reduce(
    (sum, it) => sum + it.expectedQty * (it.unitPrice || 0),
    0,
  );

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      setErrorMsg('Vui lòng chọn Nhà cung cấp!');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng!');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      await createPurchaseOrder({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        supplierCode: selectedSupplier.code,
        expectedDate: expectedDate.trim(),
        note: note.trim(),
        items: selectedItems,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Lỗi gửi đơn đặt hàng:', err?.response?.data || err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Có lỗi xảy ra khi gửi đơn đặt hàng!';
      setErrorMsg(Array.isArray(serverMsg) ? serverMsg.join('\n') : String(serverMsg));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const filteredProducts = supplierProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProductQuery.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl h-[90%] w-full overflow-hidden flex-col justify-between">
          {/* Modal Header */}
          <View className="p-4 border-b border-[#e4e5e9] flex-row justify-between items-center bg-[#f8fafc]">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-2xl bg-[#0878f9]/10 items-center justify-center">
                <ShoppingCart size={20} color="#0878f9" />
              </View>
              <View>
                <Text className="text-base font-extrabold text-[#101114]">Tạo Đơn Đặt Hàng</Text>
                <Text className="text-xs text-[#6c7078]">Đặt hàng mua từ Nhà cung cấp</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-white rounded-full border border-[#e4e5e9]">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Area */}
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            {Boolean(errorMsg) && (
              <View className="mb-4 p-3 bg-[#fff5f5] border border-[#fecaca] rounded-2xl flex-row items-center gap-2">
                <AlertCircle size={18} color="#dc2626" />
                <Text className="text-xs font-bold text-[#b91c1c] flex-1">{errorMsg}</Text>
              </View>
            )}

            {/* Supplier Picker */}
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2">Thông tin Nhà cung cấp</Text>
            <View className="mb-4 bg-[#f8fafc] p-3.5 rounded-2xl border border-[#e4e5e9] gap-3">
              <View>
                <Text className="text-xs font-semibold text-[#475569] mb-1">Bước 1: Chọn Nhà Cung Cấp *</Text>
                <TouchableOpacity
                  onPress={() => setShowSupplierPicker(true)}
                  className="bg-white border border-[#cbd5e1] rounded-xl p-3 flex-row justify-between items-center active:bg-[#f1f5f9]"
                >
                  {selectedSupplier ? (
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-[#101114]">{selectedSupplier.name}</Text>
                      <Text className="text-xs font-semibold text-[#0878f9] mt-0.5">
                        Mã NCC: {selectedSupplier.code} {selectedSupplier.phone ? `· SĐT: ${selectedSupplier.phone}` : ''}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-sm text-[#94a3b8]">-- Chọn Nhà cung cấp --</Text>
                  )}
                  <ChevronDown size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Interactive Date Picker */}
              <View>
                <Text className="text-xs font-semibold text-[#475569] mb-1">Ngày dự kiến nhận hàng</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 flex-row justify-between items-center active:bg-[#f1f5f9]"
                >
                  <Text className="text-sm font-bold text-[#101114]">
                    {expectedDate ? expectedDate : 'Chọn ngày dự kiến'}
                  </Text>
                  <Text className="text-xs font-bold text-[#0878f9]">Đổi ngày</Text>
                </TouchableOpacity>

                {/* Quick Date Presets */}
                <View className="mt-2 flex-row gap-1.5 justify-between">
                  {[
                    { label: 'Hôm nay', days: 0 },
                    { label: '+3 ngày', days: 3 },
                    { label: '+5 ngày', days: 5 },
                    { label: '+7 ngày', days: 7 },
                    { label: '+14 ngày', days: 14 },
                  ].map((preset) => {
                    const d = new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    const isSelected = expectedDate === dateStr;

                    return (
                      <TouchableOpacity
                        key={preset.label}
                        onPress={() => {
                          setDateObj(d);
                          setExpectedDate(dateStr);
                        }}
                        className={`flex-1 py-1.5 items-center justify-center rounded-xl border ${
                          isSelected ? 'bg-[#0878f9] border-[#0878f9]' : 'bg-white border-[#cbd5e1]'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isSelected ? 'text-white' : 'text-[#475569]'
                          }`}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Native DatePicker Modal */}
                {showDatePicker && (
                  <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setDateObj(selectedDate);
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setExpectedDate(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Order Items */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-bold text-[#6c7078] uppercase">
                Bước 2: Chọn Sản phẩm ({selectedItems.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!selectedSupplier) {
                    setErrorMsg('Vui lòng chọn Nhà cung cấp ở Bước 1 trước!');
                    return;
                  }
                  setShowProductPicker(true);
                }}
                className="bg-[#0878f9]/10 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
              >
                <Plus size={15} color="#0878f9" />
                <Text className="text-xs font-bold text-[#0878f9]">Thêm sản phẩm NCC</Text>
              </TouchableOpacity>
            </View>

            {selectedItems.length === 0 ? (
              <TouchableOpacity
                onPress={() => {
                  if (!selectedSupplier) {
                    setErrorMsg('Vui lòng chọn Nhà cung cấp ở Bước 1 trước!');
                    return;
                  }
                  setShowProductPicker(true);
                }}
                className="p-6 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-2xl items-center mb-4"
              >
                <Box size={32} color="#94a3b8" />
                <Text className="text-xs font-bold text-[#475569] mt-2">Chưa chọn sản phẩm nào</Text>
                <Text className="text-[11px] text-[#64748b] text-center mt-1">
                  Bấm để chọn các sản phẩm đã được gắn với nhà cung cấp [{selectedSupplier?.name || 'được chọn'}]
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-2.5 mb-4">
                {selectedItems.map((item, idx) => (
                  <View key={item.itemId || idx} className="bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm">
                    {/* Header: Item Name + SKU + Delete Button */}
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-extrabold text-[#101114] leading-4" numberOfLines={2}>
                          {item.itemName || item.sku}
                        </Text>
                        <Text className="text-[11px] font-semibold text-[#0878f9] mt-0.5">SKU: {item.sku}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveItem(idx)} className="p-1.5 bg-[#fff5f5] rounded-xl">
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>

                    {/* Form Controls: Quantity & Unit Price */}
                    <View className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#f1f5f9] gap-2">
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold text-[#64748b] mb-1">
                            Số lượng ({item.unit || 'thùng'})
                          </Text>
                          <TextInput
                            value={String(item.expectedQty)}
                            onChangeText={(v) => handleUpdateItemQty(idx, v)}
                            keyboardType="numeric"
                            className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs font-bold text-[#101114]"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="text-[10px] font-bold text-[#64748b] mb-1">
                            Đơn giá mua (đ)
                          </Text>
                          <TextInput
                            value={String(item.unitPrice || 0)}
                            onChangeText={(v) => handleUpdateItemPrice(idx, v)}
                            keyboardType="numeric"
                            className="bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs font-bold text-[#101114]"
                          />
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center pt-1.5 border-t border-[#e2e8f0]">
                        <Text className="text-[11px] font-bold text-[#64748b]">Thành tiền dòng này:</Text>
                        <Text className="text-xs font-black text-[#16a34a]">
                          {((item.expectedQty * (item.unitPrice || 0))).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Note */}
            <Text className="text-xs font-bold text-[#6c7078] uppercase mb-1">Ghi chú đơn hàng</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
              multiline
              numberOfLines={3}
              className="bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl p-3 text-xs font-medium text-[#101114] mb-6"
            />
          </ScrollView>

          {/* Modal Footer Bottom Action */}
          <View className="p-4 bg-white border-t border-[#e4e5e9] flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-[#64748b] font-medium">Tổng giá trị đơn hàng:</Text>
              <Text className="text-lg font-black text-[#0878f9]">
                {totalEstimatedCost.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-[#0878f9] px-6 py-3 rounded-2xl flex-row items-center gap-2 active:opacity-80 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" />
                  <Text className="text-sm font-bold text-white">Gửi Đơn Đặt Hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Supplier Selector Modal */}
      <Modal visible={showSupplierPicker} animationType="slide" transparent onRequestClose={() => setShowSupplierPicker(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl h-[70%] w-full p-4 justify-between">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-extrabold text-[#101114]">Chọn Nhà Cung Cấp</Text>
              <TouchableOpacity onPress={() => setShowSupplierPicker(false)} className="p-2 bg-[#f1f5f9] rounded-full">
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {loadingSuppliers ? (
              <View className="py-12 items-center flex-1 justify-center">
                <ActivityIndicator size="small" color="#0878f9" />
                <Text className="text-xs text-[#64748b] mt-2">Đang tải Nhà cung cấp...</Text>
              </View>
            ) : (
              <ScrollView className="flex-1">
                <View className="gap-2 pb-4">
                  {suppliers.map((sup) => (
                    <TouchableOpacity
                      key={sup.id}
                      onPress={() => {
                        handleSelectSupplier(sup);
                        setShowSupplierPicker(false);
                      }}
                      className={`p-3.5 rounded-2xl border flex-row justify-between items-center active:opacity-80 ${
                        selectedSupplier?.id === sup.id
                          ? 'bg-[#0878f9]/5 border-[#0878f9]'
                          : 'bg-white border-[#e4e5e9]'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-[#101114]">{sup.name}</Text>
                        <Text className="text-[11px] font-semibold text-[#0878f9] mt-0.5">
                          Mã NCC: {sup.code} {sup.phone ? `· SĐT: ${sup.phone}` : ''}
                        </Text>
                        {Boolean(sup.address) && (
                          <Text className="text-[10px] text-[#64748b] mt-0.5" numberOfLines={1}>
                            {sup.address}
                          </Text>
                        )}
                      </View>
                      {selectedSupplier?.id === sup.id && <UserCheck size={18} color="#0878f9" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal (Filtered by Supplier) */}
      <Modal visible={showProductPicker} animationType="slide" transparent onRequestClose={() => setShowProductPicker(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%] w-full p-4 justify-between">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-base font-extrabold text-[#101114]">Sản phẩm của Nhà cung cấp</Text>
                <Text className="text-xs font-semibold text-[#0878f9]">
                  {selectedSupplier?.name || 'NCC đã chọn'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowProductPicker(false)} className="p-2 bg-[#f1f5f9] rounded-full">
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="bg-[#f8fafc] border border-[#e4e5e9] rounded-2xl px-3.5 py-2 flex-row items-center gap-2 mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchProductQuery}
                onChangeText={setSearchProductQuery}
                placeholder="Tìm sản phẩm theo SKU, Tên..."
                className="flex-1 text-xs font-medium text-[#101114]"
              />
            </View>

            {loadingProducts ? (
              <View className="py-12 items-center flex-1 justify-center">
                <ActivityIndicator size="small" color="#0878f9" />
                <Text className="text-xs text-[#64748b] mt-2">Đang tải sản phẩm từ Nhà cung cấp...</Text>
              </View>
            ) : filteredProducts.length > 0 ? (
              <ScrollView className="flex-1">
                <View className="gap-2 pb-4">
                  {filteredProducts.map((prod) => (
                    <TouchableOpacity
                      key={prod.itemId}
                      onPress={() => handleAddProductItem(prod)}
                      className="p-3.5 bg-white border border-[#e4e5e9] rounded-2xl flex-row justify-between items-center active:bg-[#f8fafc]"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-[#101114]">{prod.name}</Text>
                        <Text className="text-[11px] font-semibold text-[#0878f9] mt-0.5">
                          SKU: {prod.sku} · Đơn vị: {prod.unit || 'Thùng'}
                        </Text>
                        <Text className="text-[11px] font-bold text-[#16a34a] mt-0.5">
                          Giá mua NCC: {(prod.price || 0).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                      <View className="bg-[#0878f9] px-3 py-1.5 rounded-xl flex-row items-center gap-1">
                        <Plus size={14} color="#ffffff" />
                        <Text className="text-xs font-bold text-white">Chọn</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="py-12 items-center justify-center flex-1">
                <Box size={32} color="#94a3b8" />
                <Text className="text-xs font-bold text-[#475569] mt-2">Không tìm thấy sản phẩm nào</Text>
                <Text className="text-[11px] text-[#64748b] text-center mt-1">
                  Nhà cung cấp này chưa có báo giá sản phẩm tương ứng.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
