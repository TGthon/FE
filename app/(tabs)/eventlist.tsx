import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, View, Text, Modal, TextInput, Pressable, Alert, Platform } from 'react-native';
import EventCard from '../components/EventCard';
import { useRouter } from 'expo-router';
// ⛔ 백엔드 연결 임시 비활성화
// import { apiGetJSON, apiPutJSON, apiDeleteJSON, getAccessToken } from '../lib/api';

type EventItem = {
  id: string;
  title: string;
  people: number;
  status: '투표 전' | '투표 완료';
  date?: string;
};

const MOCK_EVENTS: EventItem[] = [
  { id: '1', title: '그룹 이름', people: 7, status: '투표 완료', date: '2025.08.07' },
  { id: '2', title: '맛집 투어', people: 5, status: '투표 전' },
  { id: '3', title: '부산 ㄱㄱ', people: 3, status: '투표 전' },
];

export default function EventListScreen() {
  const router = useRouter();

  const [data, setData] = useState<EventItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [renameVisible, setRenameVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  // ⛔ 서버 응답 파싱 유틸은 임시 미사용 (남겨둠)
/*
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
*/

  const loadEvents = useCallback(async () => {
    // ⛔ 백엔드/토큰 체크 전부 비활성화
    // const token = await getAccessToken();
    // if (!token) { ...router.replace('/'); return; }
    // const json = await apiGetJSON<any>('/api/event');
    // const list = normalizeEvents(json);
    // setData(list);

    // ✅ 프론트 확인용 목업 데이터
    setData(MOCK_EVENTS);
  }, []);

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

    // ✅ 로컬(목업)만 즉시 반영
    setData(prev =>
      prev.map(it => (it.id === targetId ? { ...it, title: nameInput.trim() || it.title } : it)),
    );
    setRenameVisible(false);

    // ⛔ 서버 동기화 비활성화
    // try {
    //   await apiPutJSON(`/api/event/${targetId}`, { title: nameInput.trim() });
    // } catch (err: any) {
    //   Alert.alert('오류 발생', err?.message ?? '이름 변경에 실패했습니다.');
    //   await loadEvents();
    // }
  }, [targetId, nameInput]);

  const confirmDelete = useCallback((item: EventItem) => {
    const doLocalRemove = () => setData(prev => prev.filter(it => it.id !== item.id));

    const onConfirm = async () => {
      // ⛔ 서버 삭제 비활성화
      // try {
      //   await apiDeleteJSON(`/api/event/${item.id}`);
      //   doLocalRemove();
      // } catch (err: any) {
      //   Alert.alert('오류 발생', err?.message ?? '일정 삭제에 실패했습니다.');
      // }
      doLocalRemove();
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`정말 "${item.title}" 일정을 삭제하시겠습니까?`);
      if (ok) onConfirm();
      return;
    }

    Alert.alert('일정 삭제', `정말 "${item.title}" 일정을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onConfirm },
    ]);
  }, []);

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
        data={data}
        extraData={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#9AA0A6' }}>생성된 일정이 없습니다.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* 이름 변경 */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={closeRename}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={closeRename} />
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: '30%',
            backgroundColor: 'white',
            borderRadius: 14,
            padding: 16,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>이름 변경</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="새 이름을 입력하세요"
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Pressable onPress={closeRename} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text>취소</Text>
            </Pressable>
            <Pressable onPress={applyRename} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>저장</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
