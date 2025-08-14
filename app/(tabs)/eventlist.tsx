import React, { useCallback, useState } from 'react';
import { FlatList, View, Text, Modal, TextInput, Pressable, Alert, Platform } from 'react-native';
import EventCard from '../components/EventCard';
import { useRouter } from 'expo-router';

type EventItem = {
  id: string;
  title: string;
  people: number;
  status: '투표 전' | '투표 완료';
  date?: string;
};

export default function EventListScreen() {
    const router = useRouter();

  const [data, setData] = useState<EventItem[]>([
    { id: '1', title: '그룹 이름', people: 7, status: '투표 완료', date: '2025.08.07' },
    { id: '2', title: '맛집 투어', people: 5, status: '투표 전' },
    { id: '3', title: '부산 ㄱㄱ', people: 3, status: '투표 전' },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const [renameVisible, setRenameVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  const openRename = useCallback((id: string, currentName: string) => {
    setTargetId(id);
    setNameInput(currentName);
    setRenameVisible(true);
  }, []);
  const closeRename = () => setRenameVisible(false);

  const applyRename = () => {
    if (!targetId) return;
    const next = data.map(it => (it.id === targetId ? { ...it, title: nameInput.trim() || it.title } : it));
    setData(next);
    setRenameVisible(false);
  };

  const confirmDelete = useCallback((item: EventItem) => {
    if (Platform.OS === 'web') {
        const ok = window.confirm(`"${item.title}" 을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.`);
        if (ok) {
            setData(prev => prev.filter(it => it.id !== item.id));
        }
        return;
    }

    Alert.alert(
      '그룹 삭제',
      `"${item?.title}" 을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive', onPress: () => {
            setData(prev => prev.filter(it => it.id !== item.id));
          }
        }
      ]
    );
  }, [data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(r => setTimeout(r, 800));
    } finally {
      setRefreshing(false);
    }
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
            router.push({ pathname: '../(event)/event/[id]', params: { id: item.id, title: item.title}})
        }
        onRename={() => openRename(item.id, item.title)}
        onDelete={() => confirmDelete(item)}
      />
    ),
    [openRename, confirmDelete]
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
            left: 20, right: 20, top: '30%',
            backgroundColor: 'white', borderRadius: 14, padding: 16,
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>이름 변경</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="새 이름을 입력하세요"
            style={{
              borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 10, fontSize: 16,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Pressable onPress={closeRename} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text>취소</Text>
            </Pressable>
            <Pressable
              onPress={applyRename}
              style={{ paddingVertical: 10, paddingHorizontal: 12 }}
            >
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>저장</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
