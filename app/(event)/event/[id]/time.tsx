import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type VoteStatus = 'preferred' | 'non-preferred' | 'impossible';
type TimeVote = { userId: string; datetime: string; status: VoteStatus };

const TIME_VOTES: TimeVote[] = [
  { userId: 'u1', datetime: '2025-08-17T09:00', status: 'preferred' },
  { userId: 'u2', datetime: '2025-08-17T09:30', status: 'preferred' },
  { userId: 'u3', datetime: '2025-08-17T15:00', status: 'non-preferred' },
  { userId: 'u4', datetime: '2025-08-17T18:00', status: 'impossible' },

  { userId: 'u1', datetime: '2025-08-18T13:00', status: 'preferred' },
  { userId: 'u2', datetime: '2025-08-18T13:00', status: 'preferred' },
  { userId: 'u3', datetime: '2025-08-18T13:30', status: 'preferred' },
  { userId: 'u4', datetime: '2025-08-18T10:30', status: 'impossible' },
];

type SlotAgg = { preferred: number; nonPreferred: number; impossible: number };

export default function TimeScreen() {
  const { title, date } = useLocalSearchParams<{ title?: string; date: string }>();
  const { height: winH, width: winW } = Dimensions.get('window');

  // 높이 맞춰 24줄이 화면에 보이도록
  const RESERVED_H = 200; // 헤더/여백 대략치
  const availableH = Math.max(200, winH - RESERVED_H);
  const ROW_H = Math.max(16, Math.floor(availableH / 24));

  // 30분 → 한 행에 2칸
  const HOUR_W = 44;
  const CELL_W = Math.floor((winW * 0.9 - HOUR_W) / 2);
  const GRID_W = HOUR_W + CELL_W * 2;

  /** 날짜별 집계 (HH:mm 단위) */
  const aggBySlot = useMemo<Record<string, SlotAgg>>(() => {
    const map: Record<string, SlotAgg> = {};
    TIME_VOTES.filter(v => v.datetime.startsWith(`${date}T`)).forEach(v => {
      const hhmm = v.datetime.slice(11, 16); // 'HH:mm'
      if (!map[hhmm]) map[hhmm] = { preferred: 0, nonPreferred: 0, impossible: 0 };
      if (v.status === 'preferred') map[hhmm].preferred += 1;
      else if (v.status === 'non-preferred') map[hhmm].nonPreferred += 1;
      else map[hhmm].impossible += 1;
    });
    return map;
  }, [date]);

  /** 분홍 강도 기준치: (불가능 없는 슬롯 중) preferred 최댓값 */
  const maxPreferred = useMemo(() => {
    let max = 0;
    Object.values(aggBySlot).forEach(c => {
      if (c.impossible === 0) max = Math.max(max, c.preferred);
    });
    return Math.max(max, 1);
  }, [aggBySlot]);

  return (
    <>
      <Stack.Screen
        options={{
          title: title ?? '세부 시간',
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ paddingBottom: 16, alignItems: 'center' }}
      >
        {/* 날짜 라벨 + 편집 아이콘 (우측) */}
        <View
          style={{
            width: GRID_W,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 16, color: '#6B7280' }}>{formatKorean(date)} 기준</Text>

          <Pressable
            onPress={() => {
              // TODO: 편집/입력 화면 이동 등
              // router.push({ pathname: '/(event)/event/[id]/vote', params: { id, title, date } });
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="편집"
            style={{ padding: 6, backgroundColor: 'transparent' }}
          >
            <Ionicons name="create-outline" size={28} color="#111827" />
          </Pressable>
        </View>

        {/* 헤더 (시/분 + 00/30 시작 위치 정렬, 우측 끝 '00') */}
        <View
          style={{
            width: GRID_W,
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: 6,
          }}
        >
          {/* 왼쪽 상단 라벨: 시/분 */}
          <View style={{ width: HOUR_W }}>
            <Text style={{ fontWeight: '700', color: '#111827' }}>시/분</Text>
          </View>

          {/* 00 / 30 */}
          <View style={{ flex: 1, position: 'relative', flexDirection: 'row' }}>
            {['00', '30'].map((m) => (
              <Text
                key={m}
                style={{
                  width: CELL_W,
                  textAlign: 'left', // 각 칸 시작 위치에 붙임
                  fontWeight: '600',
                  color: '#6B7280',
                }}
              >
                {m}
              </Text>
            ))}

            {/* 맨 오른쪽 끝 경계에 '00' 추가 */}
            <Text
              style={{
                position: 'absolute',
                right: 0,
                fontWeight: '600',
                color: '#6B7280',
                textAlign: 'right',
              }}
            >
              00
            </Text>
          </View>
        </View>

        {/* 24행 */}
        <View style={{ width: GRID_W }}>
          {Array.from({ length: 24 }).map((_, hour) => (
            <Row
              key={hour}
              hour={hour}
              hourW={HOUR_W}
              cellW={CELL_W}
              cellH={ROW_H}
              leftColor={colorFor(aggBySlot[`${pad(hour)}:00`], maxPreferred)}
              rightColor={colorFor(aggBySlot[`${pad(hour)}:30`], maxPreferred)}
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function Row({
  hour,
  hourW,
  cellW,
  cellH,
  leftColor,
  rightColor,
}: {
  hour: number;
  hourW: number;
  cellW: number;
  cellH: number;
  leftColor: string;
  rightColor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* 시 라벨 */}
      <View style={{ width: hourW, alignItems: 'center' }}>
        <Text style={{ color: '#6B7280', width: hourW, textAlign: 'center' }}>{pad(hour)}</Text>
      </View>

      {/* 00분 / 30분 */}
      <Cell width={cellW} height={cellH} color={leftColor} />
      <Cell width={cellW} height={cellH} color={rightColor} />
    </View>
  );
}

function Cell({ width, height, color }: { width: number; height: number; color: string }) {
  return (
    <View
      style={{
        width,
        height,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: color,
      }}
    />
  );
}

function colorFor(agg: SlotAgg | undefined, maxPreferred: number) {
  if (!agg) return '#FFFFFF';
  if (agg.impossible > 0) return '#CBD5E1'; // 회색
  if (maxPreferred <= 0 || agg.preferred <= 0) return '#FFFFFF';
  const t = Math.min(1, agg.preferred / maxPreferred);
  return mixHex('#FFFFFF', '#F43F5E', t); // 흰 ↔ 진분홍
}

const pad = (n: number) => String(n).padStart(2, '0');

function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(
    Math.round(A.r + (B.r - A.r) * t),
    Math.round(A.g + (B.g - A.g) * t),
    Math.round(A.b + (B.b - A.b) * t)
  );
}
function hexToRgb(h: string) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const x = parseInt(h, 16);
  return { r: (x >> 16) & 255, g: (x >> 8) & 255, b: x & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
function formatKorean(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}
