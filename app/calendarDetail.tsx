// app/calendarDetail.tsx
import React from 'react';
import { View, Text, Pressable, Alert, ScrollView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiDeleteJSON } from './lib/api';

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
  const id = getStr(raw.id) // API 경로용 ID
  const date = getStr(raw.date);
  const title = getStr(raw.title) || '일정';
  const start = getStr(raw.start);
  const end = getStr(raw.end);
  const member = getStr(raw.member);
  const color = getStr(raw.color) || '#F59CA9';
  const note = getStr(raw.note);

  const dateLabel = formatKorean(date) + (start && end ? `  ${start} - ${end}` : '');

  // 플랫폼별 확인 다이얼로그
  const confirmAsync = (title: string, message: string) => {
    if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true }
      );
    });
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

    const handleDelete = async () => {
    if (!id) {
      notify('삭제 실패', `유효하지 않은 일정 ID입니다: "${id}"`);
      return;
    }

    const ok = await confirmAsync('삭제', '이 일정을 삭제할까요?');
    if (!ok) return;

    try {
      await apiDeleteJSON(`/api/calendar/${id}`);
      notify('삭제 완료', '일정을 삭제했습니다.');
      router.back();
    } catch (e: any) {
      // 서버에서 내려준 메시지 그대로 노출(디버깅 도움)
      notify('삭제 실패', e?.message ?? '요청 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
          headerTitleAlign: 'center',
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Row icon={<Ionicons name="calendar-outline" size={22} color="#111827" />}>
            <Text style={{ fontSize: 16, color: '#111827' }}>{dateLabel}</Text>
          </Row>

          {member ? (
            <Row icon={<Ionicons name="people-outline" size={22} color="#111827" />}>
              <Text style={{ fontSize: 16, color: '#111827' }}>{member}</Text>
            </Row>
          ) : null}

          {note ? (
            <Row icon={<Ionicons name="document-text-outline" size={22} color="#111827" />}>
              <Text style={{ fontSize: 16, color: '#111827' }}>{note}</Text>
            </Row>
          ) : null}
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleDelete}
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
              onPress={() =>
                router.push({
                  pathname: '/calendarEdit',
                  params: { id, date, title, start, end, member, color, note },
                })
              }
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

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
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
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}
