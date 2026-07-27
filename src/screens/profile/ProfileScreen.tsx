import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, KeyRound, Lock, RefreshCw, User as UserIcon, X } from 'lucide-react-native';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export const ProfileScreen: React.FC = () => {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const fresh = await refreshUser();
      if (fresh) {
        setUser(fresh);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Alert.alert('Phiên làm việc hết hạn', 'Vui lòng đăng nhập lại.', [
          { text: 'Đồng ý', onPress: logout },
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ nhân viên.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await refreshUser();
      if (fresh) {
        setUser(fresh);
      }
    } catch {
      // handled in refreshUser
    } finally {
      setRefreshing(false);
    }
  };

  const handlePickAndUploadAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
        const imageUri = pickerResult.assets[0].uri;
        setUploadingAvatar(true);

        const updatedUser = await authApi.uploadAvatar(imageUri);
        setUser(updatedUser);
        await refreshUser();
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới!');
      }
    } catch (err: any) {
      Alert.alert('Thất bại', err?.response?.data?.message || 'Không thể tải lên ảnh đại diện.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Mật khẩu hiện tại, Mật khẩu mới và Nhập lại mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi nhập liệu', 'Mật khẩu mới và Nhập lại mật khẩu mới không trùng khớp.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    setChangingPassword(true);
    try {
      // 100% Deployed Backend API endpoint: POST /api/wms/auth/change-password
      await authApi.changePassword(oldPassword.trim(), newPassword.trim());
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công!');
      
      // Reset form and close modal
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);

      // Refresh user profile
      await refreshUser();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const errorText = Array.isArray(serverMsg)
        ? serverMsg.join(', ')
        : serverMsg || 'Không thể đổi mật khẩu. Mật khẩu hiện tại có thể không đúng.';
      
      Alert.alert('Đổi mật khẩu thất bại', errorText);
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name?: string, username?: string) => {
    const target = name || username || 'User';
    const parts = target.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa khai báo';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(2);
      return `${hours}:${mins} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const currentAvatar = user?.avatarUrl || user?.avatar;

  if (loading && !user) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 text-sm mt-3">Đang tải hồ sơ nhân viên...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1 px-4 pt-4 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Title Header */}
        <View className="flex-row justify-between items-start mb-4 pt-2">
          <View>
            <View className="flex-row items-center">
              <UserIcon size={20} color="#3b82f6" />
              <Text className="text-xl font-bold text-white ml-2">Hồ sơ nhân viên</Text>
            </View>
            <Text className="text-slate-400 text-xs mt-1">Thông tin lấy từ endpoint /api/wms/auth/me.</Text>
          </View>
          <TouchableOpacity onPress={logout} className="p-2 bg-slate-900 rounded-full border border-slate-800">
            <X size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Top Avatar Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex-row items-center">
          <View className="mr-4">
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} className="w-20 h-20 rounded-full border border-slate-700 bg-slate-800" />
            ) : (
              <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center">
                <Text className="text-sky-400 font-bold text-2xl tracking-wider">
                  {getInitials(user?.name, user?.username)}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-white font-bold text-lg mb-1">{user?.name || user?.username || 'Nhân viên WMS'}</Text>
            <Text className="text-slate-400 text-xs mb-3">JPEG, PNG hoặc WebP, tối đa 5 MB.</Text>

            <TouchableOpacity
              onPress={handlePickAndUploadAvatar}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 flex-row items-center justify-center self-start"
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <>
                  <ImageIcon size={14} color="#38bdf8" />
                  <Text className="text-sky-400 font-semibold text-xs ml-1.5">Đổi ảnh đại diện</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Rows Container */}
        <View className="gap-y-2 mb-4">
          {/* Mã nhân viên */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Mã nhân viên</Text>
            <Text className="text-white font-bold text-sm" numberOfLines={1}>{user?.id || '—'}</Text>
          </View>

          {/* Tên đăng nhập */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Tên đăng nhập</Text>
            <Text className="text-white font-bold text-sm">{user?.username || '—'}</Text>
          </View>

          {/* Tên hiển thị */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Tên hiển thị</Text>
            <Text className="text-white font-bold text-sm">{user?.name || 'Chưa khai báo'}</Text>
          </View>

          {/* Email */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Email</Text>
            <Text className="text-white font-bold text-sm">{user?.email || 'Chưa khai báo'}</Text>
          </View>

          {/* Vai trò */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Vai trò</Text>
            <Text className="text-sky-400 font-bold text-sm uppercase">{user?.role || '—'}</Text>
          </View>

          {/* Số điện thoại */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Số điện thoại</Text>
            <Text className="text-white font-bold text-sm">{user?.phone || 'Chưa cập nhật'}</Text>
          </View>

          {/* Trạng thái */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Trạng thái</Text>
            <View className="flex-row items-center gap-x-2">
              <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Text className="text-emerald-400 text-xs font-semibold">
                  {user?.status === 'LOCKED' ? 'Bị khóa' : 'Đang hoạt động'}
                </Text>
              </View>
              {user?.mustChangePassword && (
                <View className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Text className="text-amber-400 text-xs font-semibold">Cần đổi mật khẩu</Text>
                </View>
              )}
            </View>
          </View>

          {/* Ngày tạo */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Ngày tạo</Text>
            <Text className="text-white font-semibold text-sm">{formatDate(user?.createdAt)}</Text>
          </View>

          {/* Cập nhật */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-slate-400 text-sm font-medium">Cập nhật</Text>
            <Text className="text-white font-semibold text-sm">{formatDate(user?.updatedAt)}</Text>
          </View>
        </View>

        {/* Change Password Trigger Banner Button */}
        <TouchableOpacity
          onPress={() => setShowChangePasswordModal(true)}
          activeOpacity={0.8}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex-row items-center justify-between mb-6"
        >
          <View className="flex-row items-center">
            <KeyRound size={20} color="#f59e0b" />
            <View className="ml-3">
              <Text className="text-amber-400 font-bold text-sm">Đổi Mật Khẩu Tải Khoản</Text>
              <Text className="text-slate-400 text-xs mt-0.5">Cập nhật mật khẩu đăng nhập nội bộ WMS</Text>
            </View>
          </View>
          <Text className="text-amber-400 font-bold text-xs">THAY ĐỔI</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Footer */}
      <View className="p-4 bg-slate-950 border-t border-slate-900 flex-row gap-3">
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.8}
          className="flex-1 bg-slate-900 border border-slate-800 py-3.5 rounded-2xl flex-row items-center justify-center"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <>
              <RefreshCw size={16} color="#94a3b8" />
              <Text className="text-slate-300 font-bold text-sm ml-2">Làm mới</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.8}
          className="flex-1 bg-blue-600 active:bg-blue-700 py-3.5 rounded-2xl items-center justify-center shadow-lg shadow-blue-600/30"
        >
          <Text className="text-white font-bold text-sm">Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* CHANGE PASSWORD MODAL (Matching Attached Design Mockup Exactly) */}
      <Modal visible={showChangePasswordModal} transparent animationType="slide">
        <View className="flex-1 bg-slate-950/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 h-[72%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center">
                  <KeyRound size={22} color="#3b82f6" />
                  <Text className="text-xl font-bold text-white ml-2">Đổi mật khẩu</Text>
                </View>
                <Text className="text-slate-400 text-xs mt-1">Cập nhật mật khẩu đăng nhập nội bộ WMS.</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="p-2 bg-slate-800 rounded-full"
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Form Input 1: Mật khẩu hiện tại */}
              <View className="mb-4">
                <Text className="text-slate-300 text-xs font-semibold uppercase mb-2">Mật khẩu hiện tại</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5">
                  <Lock size={18} color="#64748b" />
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Nhập mật khẩu hiện tại"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>

              {/* Form Input 2: Mật khẩu mới */}
              <View className="mb-4">
                <Text className="text-slate-300 text-xs font-semibold uppercase mb-2">Mật khẩu mới</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5">
                  <Lock size={18} color="#64748b" />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>

              {/* Form Input 3: Nhập lại mật khẩu mới */}
              <View className="mb-6">
                <Text className="text-slate-300 text-xs font-semibold uppercase mb-2">Nhập lại mật khẩu mới</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5">
                  <Lock size={18} color="#64748b" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>

              {/* Modal Action Buttons (Matching Mockup Footer) */}
              <View className="flex-row justify-end gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowChangePasswordModal(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl justify-center items-center"
                >
                  <Text className="text-slate-300 font-bold text-sm">Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  activeOpacity={0.8}
                  className="px-6 py-3.5 bg-blue-600 active:bg-blue-700 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-600/30"
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <KeyRound size={18} color="#ffffff" />
                      <Text className="text-white font-bold text-sm ml-2">Cập nhật mật khẩu</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
