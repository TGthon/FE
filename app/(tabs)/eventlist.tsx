import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, View, Text, Modal, TextInput, Pressable, Alert, Platform } from 'react-native';
import EventCard from '../components/EventCard';
import { useRouter } from 'expo-router';
import EventRenameModal from '../components/EventRenameModal';
import { apiGetJSON, apiPutJSON, apiDeleteJSON, getAccessToken } from '../lib/api';

type EventItem = {
  id: string;
  title: string;
  people: number;
  status: '투표 전' | '투표 완료';
  date?: string;
};

export default function EventListScreen() {
  const router = useRouter();

  const [data, setData] = useState<EventItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [renameVisible, setRenameVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  // 서버 응답 파싱 유틸
  const pickEvents = useCallback((raw: any) => {
    return Array.isArray(raw) ? raw : raw?.events ?? [];
  }, []);

  const normalizeEvents = useCallback((raw: any): EventItem[] => {
    const arr = pickEvents(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((e: any) => {
        if (!e?.id || !e?.title) return null;
        const s = String(e.status);
        const status: EventItem['status'] = s === '투표 완료' || s === 'done' ? '투표 완료' : '투표 전';
        return {
          id: String(e.id),
          title: String(e.title),
          people: Number(e.people) || 0,
          status,
          date: e.date ? String(e.date) : undefined,
        } as EventItem;
      })
      .filter(Boolean) as EventItem[];
  }, [pickEvents]);

  const loadEvents = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        router.replace('/');
        return;
      }
      const json = await apiGetJSON<any>('/api/event');
      const list = normalizeEvents(json);
      setData(list);
    } catch (err: any) {
      Alert.alert('오류', err?.message ?? '이벤트 목록을 불러오지 못했습니다.');
      setData([]);
    }
  }, [router, normalizeEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  }, [loadEvents]);

  const openRename = useCallback((id: string, currentName: string) => {
    setTargetId(id);
    setNameInput(currentName);
    setRenameVisible(true);
  }, []);
  const closeRename = () => setRenameVisible(false);

  const applyRename = useCallback(async () => {
    if (!targetId) return;

    try {
      await apiPutJSON(`/api/event/${targetId}/name`, { name: nameInput.trim() });
      await loadEvents();
      setRenameVisible(false);
    } catch (err: any) {
      Alert.alert('오류 발생', err?.message ?? '이름 변경에 실패했습니다.');
      await loadEvents();
    }
  }, [targetId, nameInput, loadEvents]);

  const confirmDelete = useCallback((item: EventItem) => {
    const onConfirm = async () => {
      try {
        await apiDeleteJSON(`/api/event/${item.id}/user/me`);
        await loadEvents();
      } catch (err: any) {
        Alert.alert('오류 발생', err?.message ?? '이벤트 탈퇴에 실패했습니다.');
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`정말 "${item.title}" 이벤트에서 탈퇴하시겠습니까?`);
      if (ok) onConfirm();
      return;
    }

    Alert.alert('이벤트 탈퇴', `정말 "${item.title}" 이벤트에서 탈퇴하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴', style: 'destructive', onPress: onConfirm },
    ]);
  }, [loadEvents]);

  const renderItem = useCallback(
    ({ item }: { item: EventItem }) => (
      <EventCard
        id={item.id}
        title={item.title}
        people={item.people}
        status={item.status}
        date={item.date}
        onPress={() =>
          router.push({
            pathname: '../(event)/event/[id]',
            params: { id: item.id, title: item.title },
          })
        }
        onRename={() => openRename(item.id, item.title)}
        onDelete={() => confirmDelete(item)}
      />
    ),
    [openRename, confirmDelete, router],
  );

  return (
    <>
      <FlatList
        style={{ backgroundColor: 'white' }}
        data={data}
        extraData={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#9AA0A6' }}>생성된 이벤트가 없습니다.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* 이름 변경 모달 */}
      <EventRenameModal
        visible={renameVisible}
        value={nameInput}
        onChangeText={setNameInput}
        onCancel={closeRename}
        onSave={applyRename}
      />
    </>
  );
}
