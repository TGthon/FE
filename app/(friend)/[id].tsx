import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type EventRow = { id: string; title: string; when: string };

const FRIEND_EVENTS: Record<string, EventRow[]> = {
  u1: [
    { id: 'e1', title: '맛집 투어', when: '(07-27 오전 1:00)' },
    { id: 'e2', title: '맛집 투어', when: '(07-27 오전 1:00)' },
    { id: 'e3', title: '맛집 투어', when: '(07-27 오전 1:00)' },
  ],
};

export default function FriendDetailScreen() {
  const router = useRouter();
  const { id, name, email } = useLocalSearchParams<{ id: string; name?: string; email?: string }>();
  const events = useMemo(() => FRIEND_EVENTS[id] ?? [], [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 프로필 헤더 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.avatarLg} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>{name || '이동현'}</Text>
            <Text style={styles.email}>{email || 'ldhhello0804@gmail.com'}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => {/* 삭제 액션 */}}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      {/* 이벤트 목록 */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 96 }}
        data={events}
        keyExtractor={(it, idx) => it?.id ?? `ev-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="#9CA3AF" />
            <Text style={styles.eventText}>
              {'  '}{item.title} {item.when}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.cta}
          onPress={() => router.push({ pathname: '/(tabs)/eventlist', params: { friendId: id } })}
        >
          <Text style={styles.ctaText}>새 이벤트 만들기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#8B5CF6' },
  title: { fontSize: 28, fontWeight: '900' },
  email: { color: '#9CA3AF', marginTop: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventText: { color: '#6B7280', fontSize: 16, marginLeft: 4 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  cta: {
    height: 56, borderRadius: 16, backgroundColor: '#F45F62',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
