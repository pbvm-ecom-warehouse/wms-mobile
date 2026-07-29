import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react-native';

export type AlertModalVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AppAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AlertModalVariant;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function AppAlertModal({
  visible,
  title,
  message,
  variant = 'info',
  confirmText = 'Đồng ý',
  cancelText,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: AppAlertModalProps) {
  if (!visible) return null;

  const handleClose = onClose || onCancel || onConfirm;

  const iconMap = {
    info: <Info size={28} color="#0878f9" />,
    success: <CheckCircle2 size={28} color="#16a34a" />,
    warning: <AlertTriangle size={28} color="#d97706" />,
    danger: confirmText?.includes('Xóa') ? <Trash2 size={28} color="#dc2626" /> : <AlertCircle size={28} color="#dc2626" />,
  };

  const bgIconMap = {
    info: 'bg-[#0878f9]/10',
    success: 'bg-[#16a34a]/10',
    warning: 'bg-[#d97706]/10',
    danger: 'bg-[#dc2626]/10',
  };

  const confirmBtnBgMap = {
    info: 'bg-[#0878f9]',
    success: 'bg-[#16a34a]',
    warning: 'bg-[#d97706]',
    danger: 'bg-[#dc2626]',
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 justify-center items-center p-4 z-50">
        <View className="w-full max-w-[340px] bg-white rounded-3xl p-5 items-center shadow-xl border border-[#e4e5e9]">
          {/* Top Close Button if cancelable */}
          {onClose || cancelText ? (
            <TouchableOpacity
              onPress={handleClose}
              className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-[#f5f6f8]"
            >
              <X size={16} color="#6c7078" />
            </TouchableOpacity>
          ) : null}

          {/* Icon Badge */}
          <View className={`w-14 h-14 rounded-2xl ${bgIconMap[variant]} items-center justify-center mb-3 mt-1`}>
            {iconMap[variant]}
          </View>

          {/* Title */}
          <Text className="text-base font-extrabold text-[#101114] text-center mb-1 px-2">
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text className="text-xs font-medium text-[#6c7078] text-center mb-5 px-1 leading-5">
              {message}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-2.5 w-full">
            {cancelText ? (
              <TouchableOpacity
                onPress={onCancel || handleClose}
                disabled={loading}
                className="flex-1 bg-[#f5f6f8] py-3 rounded-2xl items-center justify-center border border-[#e4e5e9] active:opacity-80"
              >
                <Text className="text-xs font-bold text-[#475569]">{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onConfirm || handleClose}
              disabled={loading}
              className={`flex-1 ${confirmBtnBgMap[variant]} py-3 rounded-2xl items-center justify-center shadow-sm active:opacity-90`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-extrabold text-white">{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
