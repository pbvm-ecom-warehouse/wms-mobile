import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, CupSoda, Printer, RefreshCw, X } from 'lucide-react-native';
import { MOCK_PRINT_JOBS } from '../../mock/data';
import { PrintJob } from '../../types';

export const PrintJobListScreen: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);

  const statusBadges = {
    QUEUED: { label: 'Chờ in', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
    PRINTING: { label: 'Đang in ly', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
    COMPLETED: { label: 'Đã hoàn thành', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
    REJECTED: { label: 'Hủy/Lỗi', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
  };

  const renderPrintJob = ({ item }: { item: PrintJob }) => {
    const badge = statusBadges[item.status];
    const progress = Math.round((item.printedQuantity / item.quantity) * 100);

    return (
      <TouchableOpacity
        onPress={() => setSelectedJob(item)}
        activeOpacity={0.8}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4 shadow-md"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-purple-500/10 items-center justify-center mr-3">
              <Printer size={22} color="#a855f7" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">{item.jobCode}</Text>
              <Text className="text-slate-400 text-xs">Size: {item.cupSize}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full border ${badge.bg}`}>
            <Text className={`text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
          </View>
        </View>

        <Text className="text-white font-semibold text-sm mb-3">{item.productName}</Text>

        {/* Progress Bar */}
        <View className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-slate-400 text-xs">Tiến độ in:</Text>
            <Text className="text-purple-400 font-bold text-xs">
              {item.printedQuantity.toLocaleString()} / {item.quantity.toLocaleString()} ly ({progress}%)
            </Text>
          </View>
          <View className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <View className="bg-purple-500 h-full rounded-full" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-950 px-4 py-4">
      {/* Top Banner */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-lg">Đơn In Ly & Gia Công</Text>
          <Text className="text-slate-400 text-xs">Bộ phận máy in ly thương hiệu</Text>
        </View>
        <TouchableOpacity className="bg-purple-600 px-4 py-2.5 rounded-2xl flex-row items-center">
          <Printer size={16} color="#ffffff" />
          <Text className="text-white font-bold text-xs ml-2">Máy in 01</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_PRINT_JOBS}
        keyExtractor={(item) => item.id}
        renderItem={renderPrintJob}
        showsVerticalScrollIndicator={false}
      />

      {/* Update Progress Modal */}
      <Modal visible={!!selectedJob} transparent animationType="slide">
        <View className="flex-1 bg-slate-950/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 h-[60%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-xl">{selectedJob?.jobCode}</Text>
              <TouchableOpacity onPress={() => setSelectedJob(null)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-white font-bold text-base mb-1">{selectedJob?.productName}</Text>
            <Text className="text-slate-400 text-xs mb-4">Kích thước ly: {selectedJob?.cupSize}</Text>

            <View className="bg-slate-950 p-4 rounded-2xl mb-6 border border-slate-800">
              <Text className="text-slate-300 text-sm font-semibold mb-2">Cập nhật số lượng đã in:</Text>
              <Text className="text-purple-400 font-bold text-2xl mb-1">
                {selectedJob?.printedQuantity} / {selectedJob?.quantity} ly
              </Text>
              <Text className="text-slate-500 text-xs">Mẫu in được kiểm duyệt bởi Admin</Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setSelectedJob(null)}
                className="flex-1 bg-purple-600 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-sm">+500 LY ĐÃ IN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedJob(null)}
                className="flex-1 bg-emerald-600 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-sm">HOÀN THÀNH</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
