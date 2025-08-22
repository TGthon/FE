import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Pressable, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';


export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picture, setPicture] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showEmail, setShowEmail] = useState(true);

  // 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedPicture = await AsyncStorage.getItem('userPicture');
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      if (storedPicture) setPicture(storedPicture);
    };
    loadUserInfo();
  }, []);

  // 이름 수정 저장
  const handleSaveName = async () => {
    const newName = nameInput.trim();
    if (newName) {
      setName(newName);
      await AsyncStorage.setItem('userName', newName);
      setEditName(false);
    }
  };

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
          'userPicture',
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
              'userPicture',
            ]);
            router.replace('/');
          },
        },
      ]);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.profileBox}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: picture || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />
          <Pressable style={styles.editPicBtn}>
            <Ionicons name="pencil" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.infoWrap}>
          <View style={styles.row}>
            <Text style={styles.label}>이름</Text>
            <Pressable onPress={() => { setEditName(true); setNameInput(name); }}>
              <Ionicons name="pencil" size={18} color="#F43F5E" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
          <TextInput
            style={styles.nameInput}
            value={name}
            editable={false}
          />
          <View style={[styles.row, { marginTop: 18 }]}>
            <Text style={styles.label}>지메일</Text>
            <Pressable onPress={() => setShowEmail((v) => !v)}>
              <Ionicons
                name={showEmail ? 'eye' : 'eye-off'}
                size={22}
                color="#6B7280"
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>
          <TextInput
            style={styles.emailInput}
            value={showEmail ? email : ''}
            editable={false}
            secureTextEntry={!showEmail}
            placeholder={showEmail ? '' : '******@gmail.com'}
          />
        </View>
      </View>
      <View style={{ width: '80%', alignItems: 'flex-start', marginTop: 8 }}>
        <SectionDivider />
        {/* 로그아웃 버튼 */}
        <Pressable style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#222" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>로그아웃</Text>
        </Pressable>
        {/* 탈퇴 버튼 */}
        <Pressable style={styles.withdrawRow} onPress={() => Alert.alert('탈퇴', '탈퇴 기능은 준비 중입니다.')}>
          <Ionicons name="person-remove-outline" size={22} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.withdrawText}>탈퇴</Text>
        </Pressable>
      </View>

      {/* 이름 수정 모달 */}
      <Modal visible={editName} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>이름 수정</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="새 이름 입력"
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#F3F4F6', marginRight: 8 }]}
                onPress={() => setEditName(false)}
              >
                <Text style={{ color: '#111827', fontWeight: '600' }}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#F43F5E' }]}
                onPress={handleSaveName}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: '10%',
    alignItems: 'center',
  },
  profileBox: {
    alignItems: 'center',
    marginBottom: '8%',
    width: '80%',
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F3F4F6',
  },
  editPicBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#F43F5E',
    borderRadius: 24,
    padding: 10,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  infoWrap: {
    width: '100%',
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  nameInput: {
    width: '100%',
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  emailInput: {
    width: '100%',
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  actionText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '500',
  },
  withdrawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  withdrawText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 2,
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    width: '90%',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '85%',
    elevation: 4,
  },
  modalInput: {
    fontSize: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});

function SectionDivider() {
  return (
    <View
      style={{
        height: 2,
        backgroundColor: '#E5E7EB',
        width: '100%',
        alignSelf: 'center',
        borderRadius: 1,
      }}
    />
  );
}