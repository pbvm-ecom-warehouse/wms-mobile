import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Lock, LogIn, Package, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }
    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      const errorText = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage || 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại!';
      
      Alert.alert('Đăng nhập thất bại', errorText);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-950"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-10">
        {/* Brand Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-sky-500/10 rounded-3xl items-center justify-center border border-sky-500/30 mb-4 shadow-lg">
            <Package size={42} color="#0284c7" />
          </View>
          <Text className="text-3xl font-bold text-white tracking-wider">WMS MOBILE</Text>
          <Text className="text-slate-400 text-sm mt-1">Hệ thống Quản lý Kho & Chuỗi Cung Ứng</Text>
        </View>

        {/* Card Form */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <Text className="text-xl font-bold text-white mb-6 text-center">Đăng Nhập Hệ Thống</Text>

          {/* Username Input */}
          <View className="mb-4">
            <Text className="text-slate-300 text-xs font-semibold uppercase mb-2">Tên đăng nhập / Email</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
              <UserIcon size={20} color="#94a3b8" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-slate-300 text-xs font-semibold uppercase mb-2">Mật khẩu</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
              <Lock size={20} color="#94a3b8" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#64748b"
                secureTextEntry
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            className="bg-sky-600 active:bg-sky-700 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-sky-600/30"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <LogIn size={20} color="#ffffff" className="mr-2" />
                <Text className="text-white font-bold text-base ml-2">ĐĂNG NHẬP HỆ THỐNG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-slate-500 text-xs text-center">
            API Deployed: https://api-ecom-wms.hoaiphuong.io.vn/api/wms
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
