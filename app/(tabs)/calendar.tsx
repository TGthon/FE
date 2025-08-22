import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

type CalendarThemeLoose = { [key: string]: any };

type EventItem = {
  id: string;
  title: string;
  start: string;   // 'HH:mm'
  end: string;     // 'HH:mm'
  color: string;   // ex) '#F59CA9'
  member?: string; // ← subtitle 대신 member
  note?: string;
};

const EVENTS: Record<string, EventItem[]> = {
  '2025-08-17': [
    { id: 'e1', title: '티지톤 회의', start: '10:00', end: '11:00', color: '#F59CA9', member: '티지톤', note: '회의 안건 정리하기' },
    { id: 'e2', title: '아르바이트', start: '13:00', end: '18:00', color: '#F6D04D' },
    { id: 'e3', title: '저녁 약속', start: '18:00', end: '20:00', color: '#8B5CF6', member: '이윤서 외 3명' },
  ],
  '2025-08-10': [{ id: 'a', title: '프로젝트 미팅', start: '15:00', end: '16:00', color: '#F59CA9' }],
  '2025-08-11': [{ id: 'b', title: '리서치', start: '14:00', end: '16:00', color: '#F6D04D' }],
  '2025-08-25': [
    { id: 'c', title: '스터디', start: '19:00', end: '21:00', color: '#3B82F6' },
    { id: 'd', title: '운동', start: '07:30', end: '08:30', color: '#3B82F6' },
  ],
  '2025-08-26': [{ id: 'e', title: '회의', start: '10:00', end: '11:30', color: '#3B82F6' }],
  '2025-08-03': [{ id: 'f', title: '친구 생파', start: '18:00', end: '22:00', color: '#F59CA9' }],
  '2025-08-18': [
    { id: 'g', title: '점심 미팅', start: '12:30', end: '13:30', color: '#F6D04D' },
    { id: 'h', title: '발표 준비', start: '16:00', end: '18:00', color: '#F59CA9' },
    { id: 'i', title: '달리기', start: '06:30', end: '07:10', color: '#10B981' },
  ],
};

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DEFAULT_DATE = todayStr();

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

export default function CalendarHome() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(DEFAULT_DATE);
  const { height: winH } = Dimensions.get('window');
  const LIST_MAX_H = Math.max(180, Math.round(winH * 0.4)); // “오늘의 일정” 영역만 스크롤

  // 달력 점 + 선택 상태
  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(EVENTS).forEach(([date, list]) => {
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
  }, [selected]);

  // 오늘의 일정
  const dayEvents = useMemo(() => {
    const arr = EVENTS[selected] ?? [];
    return [...arr].sort((a, b) => (a.start < b.start ? -1 : 1));
  }, [selected]);

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
          headerRight: () => (
            <View style={{ marginRight: 24 }}>
            </View>
          ),
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
              onPress={() => { router.push({ pathname: '/calendarNew', params: { date: selected } }) }}
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

          <Calendar
            current={selected}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(d) => setSelected(d.dateString)}
            theme={CAL_THEME}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          />
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

// “오늘의 일정” 한 줄 (전체가 버튼)
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
        {/* 왼쪽 컬러 라벨(제목) */}
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

        {/* 가운데: 멤버/장소 등 */}
        <View style={{ flex: 1 }}>
          {item.member ? <Text style={{ color: '#6B7280' }}>{item.member}</Text> : null}
        </View>

        {/* 시간 */}
        <Text style={{ color: '#111827', fontWeight: '600', marginRight: 6 }}>
          {item.start} - {item.end}
        </Text>

        <Ionicons name="ellipsis-vertical" size={18} color="#111827" />
      </View>
    </Pressable>
  );
}

function formatLong(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
