// app/calendarDetail.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, Platform, BackHandler } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiDeleteJSON, apiGetJSON } from './lib/api';

type CalendarResp = {
  id: number | string;
  start: number;   // epoch seconds
  end: number;     // epoch seconds
  color?: string;
  title?: string;
  note?: string;
  members?: string[]; // 이름 문자열 배열
};

export default function CalendarDetail() {
  const router = useRouter();
  const raw = useLocalSearchParams<{ id?: string | string[] }>();

  const getStr = (v?: string | string[]) => (typeof v === 'string' ? v : v?.[0] ?? '');
  const idParam = getStr(raw.id);
  const apiId = idParam ? String(idParam).split('-')[0] : ''; // "1755968538-2" 같은 케이스 대비

  // 화면 표시용 상태 (처음엔 빈값, API로 채움)
  const [title, setTitle] = useState('일정');
  const [dateStr, setDateStr] = useState('');  // YYYY-MM-DD
  const [startHM, setStartHM] = useState('');  // HH:mm
  const [endHM, setEndHM] = useState('');      // HH:mm
  const [memberLabel, setMemberLabel] = useState('');
  const [color, setColor] = useState('#F59CA9');
  const [note, setNote] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const dateLabel =
    (dateStr ? formatKorean(dateStr) : '') + (startHM && endHM ? `  ${startHM} - ${endHM}` : '');

  // 공용 알림
  const notify = (t: string, m: string) =>
    Platform.OS === 'web' ? window.alert(`${t}: ${m}`) : Alert.alert(t, m);

  // 확인 다이얼로그
  const confirmAsync = (t: string, m: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(window.confirm(`${t}\n\n${m}`))
      : new Promise<boolean>((resolve) => {
          Alert.alert(
            t,
            m,
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });

  // 상세 조회
  useEffect(() => {
    if (!apiId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await apiGetJSON<CalendarResp>(`/api/calendar/${apiId}`);
        if (cancelled || !data) return;

        // 제목
        setTitle(data.title || '일정');

        // 시간 변환 (초 → ms)
        if (Number.isFinite(data.start)) {
          const d = new Date(Number(data.start) * 1000);
          setDateStr(toYMD(d));
          setStartHM(toHM(d));
        }
        if (Number.isFinite(data.end)) {
          const d = new Date(Number(data.end) * 1000);
          setEndHM(toHM(d));
        }

        // 색상/메모
        if (data.color) setColor(data.color);
        setNote(data.note || undefined);

        // 멤버 문자열 조합
        if (Array.isArray(data.members)) {
          setMemberLabel(data.members.filter(Boolean).join(', '));
        } else {
          setMemberLabel('');
        }
      } catch (e: any) {
        notify('불러오기 실패', e?.message ?? '일정 정보를 불러오지 못했어요.');
        console.error('GET /api/calendar/:id 실패', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiId]);

  // 하드웨어 뒤로가기 → 캘린더 탭으로
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(tabs)/calendar');
      return true;
    });
    return () => sub.remove();
  }, [router]);

  // 삭제
  const handleDelete = async () => {
    if (!apiId) {
      notify('삭제 실패', `유효하지 않은 일정 ID입니다: "${apiId}"`);
      return;
    }
    const ok = await confirmAsync('삭제', '이 일정을 삭제할까요?');
    if (!ok) return;

    try {
      await apiDeleteJSON(`/api/calendar/${apiId}`);
      notify('삭제 완료', '일정을 삭제했습니다.');
      router.replace('/(tabs)/calendar');
    } catch (e: any) {
      notify('삭제 실패', e?.message ?? '요청 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/(tabs)/calendar')} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Row icon={<Ionicons name="calendar-outline" size={22} color="#111827" />}>
            <Text style={{ fontSize: 16, color: '#111827' }}>
              {loading ? '불러오는 중…' : dateLabel || '—'}
            </Text>
          </Row>

          {memberLabel ? (
            <Row icon={<Ionicons name="people-outline" size={22} color="#111827" />}>
              <Text style={{ fontSize: 16, color: '#111827' }}>{memberLabel}</Text>
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
                  params: {
                    id: apiId,
                    date: dateStr,
                    title,
                    start: startHM,
                    end: endHM,
                    member: memberLabel,
                    color,
                    note: note ?? '',
                  },
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

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function toHM(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function formatKorean(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}
