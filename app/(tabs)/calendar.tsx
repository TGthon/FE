import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { apiGetJSON } from '../lib/api';

type CalendarThemeLoose = { [key: string]: any };

type EventItem = {
  id: string;
  title: string;
  start: string;   // 'HH:mm'
  end: string;     // 'HH:mm'
  color: string;
  member?: string;
  note?: string;
};
type EventsByDate = Record<string, EventItem[]>;

/* ─ UI 테마 ─ */
const CAL_THEME: CalendarThemeLoose = {
  calendarBackground: '#FFFFFF',
  monthTextColor: '#111827',
  arrowColor: '#2563EB',
  todayTextColor: '#EF4444',
  dayTextColor: '#111827',
  textMonthFontSize: 18,
  textMonthFontWeight: '700',
  textDayHeaderFontSize: 13,
  textDayHeaderFontWeight: '600',
  textDayFontSize: 16,
  textDayFontWeight: '400',
  selectedDayBackgroundColor: '#EF4444',
  selectedDayTextColor: '#FFFFFF',
  dotColor: '#6B7280',
  selectedDotColor: '#FFFFFF',
};

/* ─ 유틸 ─ */
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
function formatLong(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
function ymOf(dateStr: string) {
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, month: m };
}
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const toHM = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/* ─ 폴백(네트워크 실패 시) ─ */
const FALLBACK_EVENTS: EventsByDate = {
  '2025-08-17': [
    { id: 'e1', title: '티지톤 회의', start: '10:00', end: '11:00', color: '#F59CA9', member: '티지톤', note: '회의 안건 정리하기' },
  ],
};

/* ─ 백엔드 스키마 정규화 ─ */
function normalizeFromBackend(list: any[]): EventsByDate {
  const map: EventsByDate = {};
  list.forEach((raw, idx) => {
    const startSec = Number(raw?.start ?? 0);
    const endSec = Number(raw?.end ?? 0);
    if (!startSec || !endSec) return;

    const startDate = new Date(startSec * 1000);
    const endDate = new Date(endSec * 1000);

    const date = toYMD(startDate);
    const title = String(raw?.name ?? '제목없음');
    const color = String(raw?.color ?? '#3B82F6');

    let member: string | undefined;
    if (raw?.groupName) {
      member = String(raw.groupName);
    } else if (Array.isArray(raw?.users) && raw.users.length > 0) {
      member = raw.users.length <= 2 ? raw.users.join(', ') : `${raw.users[0]} 외 ${raw.users.length - 1}명`;
    }

    const item: EventItem = {
      id: String(raw?.scheduleid),
      title,
      start: toHM(startDate),
      end: toHM(endDate),
      color,
      member,
    };

    if (!map[date]) map[date] = [];
    map[date].push(item);
  });
  return map;
}

export default function CalendarHome() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(todayStr());
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const [loading, setLoading] = useState(false);

  const { height: winH } = Dimensions.get('window');
  const LIST_MAX_H = Math.max(180, Math.round(winH * 0.4));

  /** 포커스될 때와 selected 변경 시마다 최신화 */
  const loadCalendar = useCallback(async () => {
    const { year, month } = ymOf(selected);
    let active = true;
    setLoading(true);
    try {
      const qs = `?year=${year}&month=${month}`;
      const payload = await apiGetJSON<any>(`/api/calendar${qs}`);
      const normalized = Array.isArray(payload) ? normalizeFromBackend(payload) : {};
      if (active) setEventsByDate(normalized);
    } catch (e) {
      console.warn('GET /api/calendar 실패, 폴백 사용:', e);
      if (active) setEventsByDate(FALLBACK_EVENTS);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [selected]);

  // 화면 포커스될 때마다 & 선택된 날짜가 바뀔 때마다 재로딩
  useFocusEffect(
    useCallback(() => {
      let cleanup: undefined | (() => void);
      (async () => {
        cleanup = await loadCalendar();
      })();
      return () => {
        cleanup && cleanup();
      };
    }, [loadCalendar])
  );

  // 점/선택 표시
  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(eventsByDate).forEach(([date, list]) => {
      const dots = list.slice(0, 5).map((ev, idx) => ({
        key: `${ev.id}-${idx}`,
        color: ev.color,
        selectedDotColor: ev.color,
      }));
      m[date] = { ...(m[date] ?? {}), dots };
    });
    if (selected) {
      m[selected] = {
        ...(m[selected] ?? {}),
        selected: true,
        selectedColor: '#EF4444',
        selectedTextColor: '#FFFFFF',
      };
    }
    return m;
  }, [eventsByDate, selected]);

  const dayEvents = useMemo(() => {
    const arr = eventsByDate[selected] ?? [];
    return [...arr].sort((a, b) => (a.start < b.start ? -1 : 1));
  }, [eventsByDate, selected]);

  const headerTitle = selected ? formatLong(selected) : '날짜를 선택하세요';

  const openDetail = (item: EventItem) => {
    router.push({
      pathname: '/calendarDetail',
      params: {
        id: item.id,
        date: selected,
        title: item.title,
        start: item.start,
        end: item.end,
        member: item.member ?? '',
        color: item.color,
        note: item.note ?? '',
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '내 일정',
          headerTitleStyle: { fontSize: 24, fontWeight: '800', color: '#000000ff' },
          headerStyle: { backgroundColor: '#ffffff' },
          headerRight: () => <View style={{ marginRight: 24 }} />,
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* 카드: 달력 */}
        <View
          style={{
            margin: 16,
            paddingTop: 14,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* 상단: 날짜 + 추가 버튼 */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{headerTitle}</Text>

            <Pressable
              onPress={() => router.push({ pathname: '/calendarNew', params: { date: selected } })}
              style={{
                width: 36, height: 36, borderRadius: 18,
                borderWidth: 2, borderColor: '#9CA3AF',
                alignItems: 'center', justifyContent: 'center',
              }}
              hitSlop={8}
            >
              <Ionicons name="add" size={22} color="#374151" />
            </Pressable>
          </View>

          <View style={{ position: 'relative' }}>
            <Calendar
              current={selected}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={(d) => setSelected(d.dateString)}
              theme={CAL_THEME}
              style={{ borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}
            />
            {loading && (
              <View
                style={{
                  position: 'absolute', top: 8, right: 8,
                  paddingHorizontal: 8, paddingVertical: 4,
                  borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)',
                  borderWidth: 1, borderColor: '#E5E7EB',
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <ActivityIndicator size="small" />
                <Text style={{ fontSize: 12, color: '#374151' }}>불러오는 중…</Text>
              </View>
            )}
          </View>
        </View>

        {/* 오늘의 일정(이 영역만 스크롤) */}
        <View style={{ marginHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
            오늘의 일정
          </Text>

          <FlatList
            data={dayEvents}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: LIST_MAX_H }}
            contentContainerStyle={{ paddingBottom: 12, gap: 10 }}
            renderItem={({ item }) => <EventRow item={item} onPress={() => openDetail(item)} />}
            ListEmptyComponent={
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF' }}>선택한 날짜에 일정이 없습니다.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </>
  );
}

/* Row */
function EventRow({ item, onPress }: { item: EventItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 10,
          marginHorizontal: 8,
          borderRadius: 12,
          backgroundColor: '#F8FAFC',
        }}
      >
        <View
          style={{
            backgroundColor: item.color,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            marginRight: 10,
          }}
        >
          <Text style={{ fontWeight: '800', color: '#fff' }}>{item.title}</Text>
        </View>

        <View style={{ flex: 1 }}>
          {item.member ? <Text style={{ color: '#6B7280' }}>{item.member}</Text> : null}
        </View>

        <Text style={{ color: '#111827', fontWeight: '600', marginRight: 6 }}>
          {item.start} - {item.end}
        </Text>
      </View>
    </Pressable>
  );
}
