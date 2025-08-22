import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Pressable, Alert, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  apiGetJSON,
  apiFetch,
  apiPutJSON,
  apiPostJSON,
  getUserId,
  getRefreshToken,
  setUserId,
  clearSession,
} from '../lib/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picture, setPicture] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showEmail, setShowEmail] = useState(false); // 기본: 숨김
  const [loadingPic, setLoadingPic] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const profile: any = await apiGetJSON('/api/profile/me');
        setName(profile?.name ?? '');
        setEmail(profile?.email ?? '');
        setPicture(profile?.picture ?? '');

        await AsyncStorage.setItem('userName', profile?.name ?? '');
        await AsyncStorage.setItem('userEmail', profile?.email ?? '');
        await AsyncStorage.setItem('userPicture', profile?.picture ?? '');

        if (profile?.id != null) {
          await setUserId(String(profile.id));
        }
      } catch {
        const [storedName, storedEmail, storedPicture] = await Promise.all([
          AsyncStorage.getItem('userName'),
          AsyncStorage.getItem('userEmail'),
          AsyncStorage.getItem('userPicture'),
        ]);
        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedPicture) setPicture(storedPicture);
      }
    };
    loadUserInfo();
  }, []);

  const handleSaveName = async () => {
    const newName = nameInput.trim();
    if (!newName || newName === name) {
      Alert.alert('안내', '변경할 이름을 입력해 주세요.');
      return;
    }
    setSavingName(true);
    try {
      const res: any = await apiPutJSON('/api/profile/me/name', { name: newName });
      const saved = res?.name ?? newName;

      setName(saved);
      await AsyncStorage.setItem('userName', saved);
      setEditName(false);
      Alert.alert('완료', '이름이 변경되었습니다.');
    } catch (err: any) {
      Alert.alert('이름 변경 실패', err?.message ?? '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePicture = async () => {
    // 캐시 버스터
    const withBust = (url: string) => (url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url);

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
          Alert.alert('파일 크기 초과', '1MB 이하 이미지만 가능합니다.');
          return;
        }

        // 즉시 프리뷰
        const objUrl = URL.createObjectURL(file);
        setPicture(objUrl);

        setLoadingPic(true);
        try {
          const formData = new FormData();
          formData.append('picture', file);
          const res = await apiFetch('/api/profile/me/picture', { method: 'PUT', body: formData });
          const json = await res.json();
          if (json?.picture) {
            setPicture(withBust(json.picture));
            await AsyncStorage.setItem('userPicture', json.picture);
          } else {
            Alert.alert('업로드 실패', '프로필 사진 변경에 실패했습니다.');
          }
        } catch {
          Alert.alert('업로드 실패', '프로필 사진 변경 중 오류가 발생했습니다.');
        } finally {
          setLoadingPic(false);
          // 메모리 정리
          try { URL.revokeObjectURL(objUrl); } catch {}
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileType = asset.type || 'image/jpeg';

      // 즉시 프리뷰
      setPicture(uri);

      setLoadingPic(true);
      try {
        const formData = new FormData();
        formData.append('picture', { uri, name: 'profile.jpg', type: fileType } as any);
        const res = await apiFetch('/api/profile/me/picture', { method: 'PUT', body: formData });
        const json = await res.json();
        if (json?.picture) {
          setPicture(withBust(json.picture));
          await AsyncStorage.setItem('userPicture', json.picture);
        } else {
          Alert.alert('업로드 실패', '프로필 사진 변경에 실패했습니다.');
        }
      } catch {
        Alert.alert('업로드 실패', '프로필 사진 변경 중 오류가 발생했습니다.');
      } finally {
        setLoadingPic(false);
      }
    }
  };

  const performLogout = async () => {
    try {
      const [uid, refreshToken] = await Promise.all([getUserId(), getRefreshToken()]);
      if (uid && refreshToken) {
        await apiPostJSON('/api/auth/logout', { uid: Number(uid), refreshToken });
      }
    } catch (err) {
      console.warn('logout api failed:', err);
    } finally {
      await clearSession();
      await AsyncStorage.multiRemove(['userEmail', 'userName', 'userPicture']);
      router.replace('/');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말 로그아웃하시겠어요?')) await performLogout();
    } else {
      Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: performLogout },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileBox}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: picture || 'https://api.ldh.monster/images/default.jpg' }}
            style={styles.avatar}
          />
          <Pressable style={styles.editPicBtn} onPress={handleChangePicture} disabled={loadingPic}>
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
          <TextInput style={styles.nameInput} value={name} editable={false} />

          <View style={[styles.row, { marginTop: 18 }]}>
            <Text style={styles.label}>지메일</Text>
            <Pressable onPress={() => setShowEmail(v => !v)}>
              <Ionicons name={showEmail ? 'eye' : 'eye-off'} size={22} color="#6B7280" style={{ marginLeft: 8 }} />
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
        <Pressable style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#222" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>로그아웃</Text>
        </Pressable>

        <Pressable style={styles.withdrawRow} onPress={() => Alert.alert('탈퇴', '탈퇴 기능은 준비 중입니다.')}>
          <Ionicons name="person-remove-outline" size={22} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.withdrawText}>탈퇴</Text>
        </Pressable>
      </View>

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
                style={[
                  styles.modalBtn,
                  { backgroundColor: '#F43F5E' },
                  savingName ? { opacity: 0.6 } : {},
                ]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{savingName ? '저장 중…' : '저장'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: '10%', alignItems: 'center' },
  profileBox: { alignItems: 'center', marginBottom: '8%', width: '80%' },
  avatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  avatar: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#F3F4F6' },
  editPicBtn: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#F43F5E', borderRadius: 24, padding: 10, borderWidth: 2, borderColor: '#fff', elevation: 2 },
  infoWrap: { width: '100%', alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 18, color: '#374151', fontWeight: '600' },
  nameInput: { width: '100%', fontSize: 16, fontWeight: '500', color: '#111827', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 6, marginBottom: 12 },
  emailInput: { width: '100%', fontSize: 16, fontWeight: '500', color: '#374151', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 6, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 2 },
  actionText: { fontSize: 18, color: '#222', fontWeight: '500' },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 6, paddingHorizontal: 2 },
  withdrawText: { fontSize: 18, color: '#EF4444', fontWeight: '500', marginLeft: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: '85%', elevation: 4 },
  modalInput: { fontSize: 18, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2 },
});

function SectionDivider() {
  return <View style={{ height: 2, backgroundColor: '#E5E7EB', width: '100%', alignSelf: 'center', borderRadius: 1 }} />;
}
