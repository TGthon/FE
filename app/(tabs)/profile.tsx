// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';


export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
    };
    loadUserInfo();
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('정말 로그아웃하시겠어요?');
    if (confirmed) {
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userEmail',
        'userId',
        'userName',
      ]);
      router.replace('/'); // 로그인 화면으로 이동
    }
  } else {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            'accessToken',
            'refreshToken',
            'userEmail',
            'userId',
            'userName',
          ]);
          router.replace('/');
        },
      },
    ]);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>프로필</Text>

      <View style={styles.profileCard}>
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }} // 나중에 구글 프로필 이미지로 교체 가능
          style={styles.avatar}
        />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.name}>{name || '이름 없음'}</Text>

          <Text style={styles.label}>이메일</Text>
          <Text style={styles.email}>{email || '이메일 없음'}</Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});