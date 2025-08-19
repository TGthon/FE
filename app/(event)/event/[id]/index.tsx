import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';

/** 투표 스키마 */
type VoteStatus = 'preferred' | 'non-preferred' | 'impossible';
type Vote = { userId: string; date: string; status: VoteStatus };

type DayAgg = { preferred: number; nonPreferred: number; impossible: number; total: number };

/** 목업 투표 데이터 (YYYY-MM-DD) */
const VOTES: Vote[] = [
  { userId: 'u1', date: '2025-08-07', status: 'preferred' },
  { userId: 'u2', date: '2025-08-07', status: 'preferred' },
  { userId: 'u3', date: '2025-08-07', status: 'non-preferred' },
  { userId: 'u4', date: '2025-08-07', status: 'impossible' },

  { userId: 'u1', date: '2025-08-12', status: 'preferred' },
  { userId: 'u2', date: '2025-08-12', status: 'preferred' },
  { userId: 'u3', date: '2025-08-12', status: 'preferred' },

  { userId: 'u2', date: '2025-08-14', status: 'non-preferred' },
  { userId: 'u3', date: '2025-08-14', status: 'non-preferred' },
  { userId: 'u4', date: '2025-08-14', status: 'non-preferred' },

  { userId: 'u1', date: '2025-08-17', status: 'preferred' },
  { userId: 'u2', date: '2025-08-17', status: 'preferred' },
  { userId: 'u3', date: '2025-08-17', status: 'non-preferred' },

  { userId: 'u1', date: '2025-08-20', status: 'preferred' },
  { userId: 'u2', date: '2025-08-20', status: 'non-preferred' },
  { userId: 'u3', date: '2025-08-20', status: 'non-preferred' },
];

export default function EventDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  /** 날짜별 집계 */
  const aggByDate = useMemo<Record<string, DayAgg>>(() => {
    const m: Record<string, DayAgg> = {};
    for (const v of VOTES) {
      const key = v.date;
      if (!m[key]) m[key] = { preferred: 0, nonPreferred: 0, impossible: 0, total: 0 };
      if (v.status === 'preferred') m[key].preferred += 1;
      else if (v.status === 'non-preferred') m[key].nonPreferred += 1;
      else m[key].impossible += 1;
      m[key].total += 1;
    }
    return m;
  }, []);

  /** 선택된 날짜의 카운트 */
  const counts = useMemo<DayAgg>(() => {
    if (!selected || !aggByDate[selected]) return { preferred: 0, nonPreferred: 0, impossible: 0, total: 0 };
    return aggByDate[selected];
  }, [selected, aggByDate]);

  /** 달력에 칠할 색 계산 + markedDates 생성 */
  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};

    Object.entries(aggByDate).forEach(([date, c]) => {
      const { bg, text } = computeDayColor(c);
      result[date] = {
        customStyles: {
          container: {
            backgroundColor: bg,
            borderRadius: 8,
            borderWidth: selected === date ? 2 : 0,
            borderColor: selected === date ? '#1D4ED8' : 'transparent', // 선택 시 파란 테두리
          },
          text: { color: text, fontWeight: selected === date ? '700' : '400' },
        },
      };
    });

    // 집계가 없는 날짜를 선택했을 때도 선택 표시
    if (selected && !result[selected]) {
      result[selected] = {
        customStyles: {
          container: { borderRadius: 8, borderWidth: 2, borderColor: '#1D4ED8' },
          text: { color: '#111827', fontWeight: '700' },
        },
      };
    }

    return result;
  }, [aggByDate, selected]);

  const onDayPress = useCallback((day: DateData) => {
    setSelected(day.dateString);
  }, []);

  const headerTitle = selected ? formatLong(selected) : '날짜를 선택하세요';

  return (
    <>
      <Stack.Screen
        options={{
          title: title ?? '이벤트',
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, backgroundColor: '#fff' }}>
        {/* 날짜 선택 박스 */}
        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {/* 상단 날짜 */}
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
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{headerTitle}</Text>
            <Pressable onPress={() => Alert.alert('편집', '달력 편집 액션을 연결하세요.')}>
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </Pressable>
          </View>

          {/* 실제 달력 */}
          <View style={{ padding: 12 }}>
            <Calendar
              markingType="custom"
              onDayPress={onDayPress}
              markedDates={markedDates}
              theme={{
                todayTextColor: '#2563EB',
                arrowColor: '#2563EB',
                monthTextColor: '#111827',
                textMonthFontWeight: '700',
                textDayFontSize: 14,
              }}
            />
          </View>
        </View>

        {/* 투표 상태 집계 (선택된 날짜 기준) */}
        <View style={{ gap: 10 }}>
          <StatusRow label="Preferred" color="#FCA5A5" count={`${counts.preferred}명`} />
          <StatusRow label="Non-preferred" color="#FACC15" count={`${counts.nonPreferred}명`} />
          <StatusRow label="Impossible" color="#CBD5E1" count={`${counts.impossible}명`} />
        </View>

        {/* 디버그 */}
        <Text style={{ marginTop: 16, color: '#94A3B8' }}>event id: {id}</Text>
      </ScrollView>
    </>
  );
}

/** 색상 계산 규칙
 * - impossible ≥ 1 → 회색 배경(#CBD5E1)
 * - 그 외: 분홍(#F43F5E) ↔ 흰색(#FFFFFF) 사이를 선호 비율로 보간
 *   ratio = preferred / (preferred + nonPreferred)
 */
function computeDayColor(c: DayAgg) {
  if (c.impossible > 0) {
    return { bg: '#CBD5E1', text: '#111827' }; // 회색
  }
  const denom = c.preferred + c.nonPreferred;
  if (denom === 0) return { bg: 'transparent', text: '#111827' }; // 투표 없음

  const ratio = c.preferred / denom; // 0=비선호 100% → 흰색, 1=선호 100% → 진분홍
  const bg = mixHex('#FFFFFF', '#F43F5E', ratio);
  const text = ratio > 0.65 ? '#FFFFFF' : '#111827'; // 어두워지면 가독성 위해 흰 글자
  return { bg, text };
}

/** HEX 색 보간(0~1) */
function mixHex(hexA: string, hexB: string, t: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bl);
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** 라벨 포맷: Mon, Aug 17 */
function formatLong(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function StatusRow({ label, color, count }: { label: string; color: string; count: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          backgroundColor: color,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          marginRight: 10,
        }}
      >
        <Text style={{ fontWeight: '600' }}>{label}</Text>
      </View>
      <Text>{count}</Text>
    </View>
  );
}
