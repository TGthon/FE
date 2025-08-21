import React from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarDetail() {
  const router = useRouter();
  const raw = useLocalSearchParams<{
    id?: string | string[];
    date?: string | string[];
    title?: string | string[];
    start?: string | string[];
    end?: string | string[];
    member?: string | string[];
    color?: string | string[];
    note?: string | string[];
  }>();

  const getStr = (v?: string | string[]) => (typeof v === 'string' ? v : v?.[0] ?? '');
  const id = getStr(raw.id);
  const date = getStr(raw.date);
  const title = getStr(raw.title) || '일정';
  const start = getStr(raw.start);
  const end = getStr(raw.end);
  const member = getStr(raw.member);
  const color = getStr(raw.color) || '#F59CA9';
  const note = getStr(raw.note);

  const dateLabel = formatKorean(date) + (start && end ? `  ${start} - ${end}` : '');

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
          headerTitleAlign: 'center'
        }}
      />

      {/* 버튼 바 고정을 위한 래퍼 */}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* 스크롤 본문: 하단 고정 바 높이만큼 여유 공간 확보 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        >

          {/* 날짜/시간 */}
          <Row
            icon={<Ionicons name="calendar-outline" size={22} color="#111827" />}
          >
            <Text style={{ fontSize: 16, color: '#111827' }}>{dateLabel}</Text>
          </Row>

          {/* 멤버 */}
          {member ? (
            <Row icon={<Ionicons name="people-outline" size={22} color="#111827" />}>
              <Text style={{ fontSize: 16, color: '#111827' }}>{member}</Text>
            </Row>
          ) : null}

          {/* 메모 */}
          {note ? (
            <Row icon={<Ionicons name="document-text-outline" size={22} color="#111827" />}>
              <Text style={{ fontSize: 16, color: '#111827' }}>{note}</Text>
            </Row>
          ) : null}
        </ScrollView>

        {/* 하단 고정 버튼 바 */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16, // 필요하면 기기 하단 여백 더
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() =>
                Alert.alert('삭제', '이 일정을 삭제할까요?', [
                  { text: '취소', style: 'cancel' },
                  { text: '삭제', style: 'destructive', onPress: () => router.back() },
                ])
              }
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 22,
                backgroundColor: pressed ? '#fda4af' : '#F87171',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>삭제</Text>
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('수정', '수정 화면으로 이동(구현 예정)')}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: '#111827',
                backgroundColor: pressed ? '#F3F4F6' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#111827', fontWeight: '700' }}>수정</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}
    >
      <View style={{ width: 28, alignItems: 'center', marginRight: 8 }}>{icon}</View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function formatKorean(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}
