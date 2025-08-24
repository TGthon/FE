import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { apiPostJSON } from '@/app/lib/api';

// 투표 모드
type VoteStatus = 'preferred' | 'non-preferred' | 'impossible';

// 모드별 색상 (편집 화면 전용)
const COLORS = {
  preferred: '#FCA5A5',     // 분홍 배경
  'non-preferred': '#FACC15', // 노랑 배경
  impossible: '#CBD5E1',    // 회색 배경
} as const;

export default function VoteScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  // 현재 선택된 모드
  const [mode, setMode] = useState<VoteStatus>('preferred');

  // 내 투표 작업물 (달력에서 지정한 상태들)  e.g. { '2025-08-12': 'preferred', ... }
  const [myVotes, setMyVotes] = useState<Record<string, VoteStatus>>({});

  // 날짜 탭 → 현재 모드로 지정 / 같은 모드면 해제
  const onDayPress = useCallback((day: DateData) => {
    const key = day.dateString;
    setMyVotes(prev => {
      const current = prev[key];
      // 같은 모드면 해제(토글), 다른 모드면 바꾸기
      if (current === mode) {
        const cp = { ...prev };
        delete cp[key];
        return cp;
      }
      return { ...prev, [key]: mode };
    });
  }, [mode]);

  // 캘린더에 칠할 마킹 생성
  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};
    Object.entries(myVotes).forEach(([date, status]) => {
      const bg = COLORS[status];
      const text = status === 'preferred' ? '#111827' : '#111827'; // 모두 검정 글자(가독성)
      result[date] = {
        customStyles: {
          container: { backgroundColor: bg, borderRadius: 8 },
          text: { color: text, fontWeight: '600' },
        },
      };
    });
    return result;
  }, [myVotes]);

  function parseLocalDate(str: string) {
    const [year, month, day] = str.split("-").map(Number);
    return new Date(year, month - 1, day); // 월은 0부터 시작
  }

  // 저장
  const submit = useCallback(async () => {
    const payload = Object.entries(myVotes).map(([date, status]) => ({ date, status }));

    // ⛔ 백엔드 연동 전: 목업 동작
    // TODO: 나중에 실제 API 연결
    console.log(payload);

    await apiPostJSON<any>(`/api/vote/${id}/day`, payload.map(({date, status}) => ({
      time: parseLocalDate(date).getTime() / 1000,
      type: status[0].toUpperCase()
    })))

    const goDetail = () => router.replace({
        pathname: '/(event)/event/[id]',
        params: { id, title },
    });

    if (Platform.OS === 'web') {
        alert(`저장할 투표 수: ${payload.length}개`);
        goDetail();
    } else {
        Alert.alert('미리보기', '저장할 투표 수: ${payload.length}개', [
            { text: '확인', onPress: goDetail },
        ]);
        }
    }, [myVotes, id, title, router]);


  // dayComponent: 노란 점은 편집 화면에서는 쓰지 않고, 배경색으로 즉시 피드백
  // 선택 테두리/노란점 없이 심플하게
  const DayCell = ({
    date,
    state,
    marking,
  }: {
    date?: DateData;
    state?: string;
    marking?: any;
  }) => {
    if (!date) return <View style={{ width: 32, height: 32 }} />;

    const bg = marking?.customStyles?.container?.backgroundColor ?? 'transparent';
    const textColor =
      marking?.customStyles?.text?.color ??
      (state === 'disabled' ? '#94A3B8' : '#111827');

    const CELL = 32;
    const BUBBLE = 28;

    return (
      <Pressable
        onPress={() => onDayPress(date)}
        style={{
          width: CELL,
          height: CELL,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: BUBBLE,
            height: BUBBLE,
            borderRadius: BUBBLE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
          }}
        >
          <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
            {date.day}
          </Text>
        </View>
      </Pressable>
    );
  };

  const headerRight = (
    <Pressable
      onPress={submit}
      style={{
        marginRight: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#ef4444',
        borderRadius: 999,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700' }}>투표하기</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '날짜 투표',
          headerTitleStyle: { fontSize: 20, fontWeight: '700' },
          headerRight: () => headerRight,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, backgroundColor: '#fff' }}>
        {/* 달력 */}
        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>날짜 선택</Text>
            <Text style={{ color: '#64748B' }}>모드: {labelOf(mode)}</Text>
          </View>

          <View style={{ padding: 12 }}>
            <Calendar
              markingType="custom"
              markedDates={markedDates}
              dayComponent={DayCell}
            />
          </View>
        </View>

        {/* 모드 선택 */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <ModeButton
            label="Preferred"
            color={COLORS.preferred}
            active={mode === 'preferred'}
            onPress={() => setMode('preferred')}
          />
          <ModeButton
            label="Non-preferred"
            color={COLORS['non-preferred']}
            active={mode === 'non-preferred'}
            onPress={() => setMode('non-preferred')}
          />
          <ModeButton
            label="Impossible"
            color={COLORS.impossible}
            active={mode === 'impossible'}
            onPress={() => setMode('impossible')}
          />
        </View>

        {/* 간단 안내 */}
        <Text style={{ marginTop: 12, color: '#64748B' }}>
          모드를 고른 뒤 달력에서 여러 날짜를 탭하세요. 같은 모드로 다시 탭하면 해제됩니다.
        </Text>
      </ScrollView>
    </>
  );
}

function ModeButton({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0.55,
        borderWidth: active ? 2 : 0,
        borderColor: active ? '#111827' : 'transparent',
      }}
    >
      <Text style={{ fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function labelOf(m: VoteStatus) {
  switch (m) {
    case 'preferred':
      return '선호';
    case 'non-preferred':
      return '비선호';
    case 'impossible':
      return '불가능';
  }
}
