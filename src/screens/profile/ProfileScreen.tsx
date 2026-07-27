import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LogOut, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { WmsRole } from '../../types';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const roleColors: Record<WmsRole, string> = {
    [WmsRole.ADMIN]: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    [WmsRole.MANAGER]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    [WmsRole.RECEIVER]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    [WmsRole.PICKER]: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    [WmsRole.PRINTER]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    [WmsRole.COUNTER]: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    [WmsRole.SHIPPER]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 px-4 py-6">
      {/* User Header */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mb-6 shadow-xl">
        <View className="relative mb-3">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-24 h-24 rounded-full border-2 border-sky-500" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-slate-800 border-2 border-sky-500 items-center justify-center">
              <UserIcon size={40} color="#38bdf8" />
            </View>
          )}
        </View>

        <Text className="text-xl font-bold text-white mb-1">{user?.name || 'Tài khoản WMS'}</Text>
        <Text className="text-slate-400 text-sm mb-3">@{user?.username || 'user'}</Text>

        <View className={`px-4 py-1.5 rounded-full border ${roleColors[user?.role || WmsRole.ADMIN]}`}>
          <Text className="text-xs font-bold uppercase tracking-wider">
            Role: {user?.role || WmsRole.ADMIN}
          </Text>
        </View>
      </View>

      {/* Account Info Details */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
        <Text className="text-slate-300 font-bold text-base mb-4">Thông Tin Cá Nhân</Text>
        
        <View className="flex-row items-center mb-4 pb-3 border-b border-slate-800">
          <Mail size={20} color="#64748b" />
          <View className="ml-3">
            <Text className="text-slate-500 text-xs">Email liên hệ</Text>
            <Text className="text-white font-medium text-sm">{user?.email || 'N/A'}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4 pb-3 border-b border-slate-800">
          <Phone size={20} color="#64748b" />
          <View className="ml-3">
            <Text className="text-slate-500 text-xs">Số điện thoại</Text>
            <Text className="text-white font-medium text-sm">{user?.phone || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <ShieldCheck size={20} color="#64748b" />
          <View className="ml-3">
            <Text className="text-slate-500 text-xs">Phòng ban</Text>
            <Text className="text-white font-medium text-sm">Bộ Phận Vận Hành Kho WMS</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        onPress={logout}
        activeOpacity={0.8}
        className="bg-rose-600/20 border border-rose-500/30 rounded-2xl py-4 flex-row items-center justify-center mb-10"
      >
        <LogOut size={20} color="#f43f5e" />
        <Text className="text-rose-400 font-bold ml-2 text-base">ĐĂNG XUẤT TÀI KHOẢN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
