import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ID = string;
type Friend = { id: ID; name: string };
type Group = {
  id: ID;
  name: string;
  members: Friend[];
  lastEventTitle?: string;  // 맛집 투어
  lastEventTimeText?: string; // (07-27 오전 1:00)
};

// 데모용 더미(실제에선 API로 대체)
const GROUPS: Record<string, Group> = {
  g1: {
    id: 'g1',
    name: '경희녀들',
    members: [
      { id: 'u1', name: '이동현' }, { id: 'u2', name: '이동현' },
      { id: 'u3', name: '이동현' }, { id: 'u4', name: '이동현' },
      { id: 'u5', name: '이동현' }, { id: 'u6', name: '이동현' },
    ],
    lastEventTitle: '맛집 투어',
    lastEventTimeText: '(07-27 오전 1:00)',
  },
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const group = useMemo<Group>(() => {
    const g = GROUPS[id] ?? { id, name: (name as string) || '그룹', members: [] };
    return g;
  }, [id, name]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 헤더 블록 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* 2×2 아바타 */}
          <View style={styles.groupAvatar}>
            {[0,1,2,3].map(i => <View key={i} style={styles.avatarCell} />)}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>{group.name}</Text>
            {(group.lastEventTitle || group.lastEventTimeText) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons name="checkbox-marked-outline" size={18} color="#9CA3AF" />
                <Text style={styles.subText}>
                  {'  '}{group.lastEventTitle}{' '}{group.lastEventTimeText}
                </Text>
              </View>
            )}
          </View>

          <Pressable hitSlop={8} onPress={() => { /* 공유 액션 */ }}>
            <MaterialCommunityIcons name="share-variant" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      {/* 멤버 2열 리스트 */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 96 }}
        data={group.members}
        keyExtractor={(item, idx) => item?.id ?? `m-${idx}`}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar} />
            <Text style={styles.memberName}>{item.name}</Text>
          </View>
        )}
        showsVerticalScrollIndicator
      />

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.cta}
          onPress={() => router.push({ pathname: '/(tabs)/eventlist', params: { groupId: id } })}
        >
          <Text style={styles.ctaText}>새 이벤트 만들기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  groupAvatar: {
    width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
    flexDirection: 'row', flexWrap: 'wrap',
  },
  avatarCell: {
    width: 32, height: 32, backgroundColor: '#8B5CF6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  title: { fontSize: 28, fontWeight: '900' },
  subText: { color: '#9CA3AF', fontSize: 14 },
  memberRow: {
    width: '48%', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
  },
  memberAvatar: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#8B5CF6', marginRight: 12 },
  memberName: { fontSize: 16, fontWeight: '600' },
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
