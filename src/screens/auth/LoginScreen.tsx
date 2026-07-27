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
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-10">
        {/* Brand Header */}
        <View className="items-center mb-8">
          <View className="w-22 h-22 bg-blue-50 rounded-3xl items-center justify-center border border-blue-100 mb-4 shadow-sm p-4">
            <Package size={44} color="#007AFF" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">StockMate</Text>
          <Text className="text-slate-500 text-sm mt-1 font-medium">Hệ thống Quản lý Kho & Chuỗi Cung Ứng</Text>
        </View>

        {/* Card Form */}
        <View className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-200/60">
          <Text className="text-xl font-bold text-slate-900 mb-6 text-center">Đăng Nhập Hệ Thống</Text>

          {/* Username Input */}
          <View className="mb-4">
            <Text className="text-slate-600 text-xs font-semibold uppercase mb-2 ml-1">Tên đăng nhập / Email</Text>
            <View className="flex-row items-center bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-3.5">
              <UserIcon size={20} color="#64748b" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="flex-1 text-slate-900 ml-3 text-base font-medium"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-slate-600 text-xs font-semibold uppercase mb-2 ml-1">Mật khẩu</Text>
            <View className="flex-row items-center bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-3.5">
              <Lock size={20} color="#64748b" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                className="flex-1 text-slate-900 ml-3 text-base font-medium"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            className="bg-blue-600 active:bg-blue-700 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/25"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <LogIn size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base ml-2">ĐĂNG NHẬP HỆ THỐNG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-slate-400 text-xs text-center font-medium">
            StockMate v1.0.0 • Connected to Live WMS API
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
