import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

type CalendarThemeLoose = { [key: string]: any };

type EventItem = {
  id: string;
  title: string;
  start: string;  // 'HH:mm'
  end: string;    // 'HH:mm'
  color: string;  // ex) '#FCA5A5'
  subtitle?: string;
};

const EVENTS: Record<string, EventItem[]> = {
  '2025-08-17': [
    { id: 'e1', title: '티지톤 회의', start: '10:00', end: '11:00', color: '#F59CA9', subtitle: '티지톤' },
    { id: 'e2', title: '아르바이트', start: '13:00', end: '18:00', color: '#F6D04D' },
    { id: 'e3', title: '저녁 약속', start: '18:00', end: '20:00', color: '#8B5CF6', subtitle: '이윤서 외 3명' },
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
}

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
  const [selected, setSelected] = useState<string>(DEFAULT_DATE);
  const { height: winH } = Dimensions.get('window');
  // 리스트 최대 높이(화면의 ~40%) — 필요 시 조절
  const LIST_MAX_H = Math.max(180, Math.round(winH * 0.4));

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

  const dayEvents = useMemo(() => {
    const arr = EVENTS[selected] ?? [];
    return [...arr].sort((a, b) => (a.start < b.start ? -1 : 1));
  }, [selected]);

  const headerTitle = selected ? formatLong(selected) : '날짜를 선택하세요';

  return (
    <>
      <Stack.Screen
        options={{
          title: '내 일정',
          headerTitleStyle: { fontSize: 24, fontWeight: '800' },
          headerRight: () => (
            <View style={{ marginRight: 24 }}> {/* 값 키울수록 더 왼쪽으로 이동 */}
              <Pressable hitSlop={8} onPress={() => { /* 알림 화면 이동 등 */ }}>
                <Ionicons name="notifications-outline" size={32} color="#111827" />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* 전체 화면은 스크롤하지 않음 */}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* 카드 영역 */}
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
          {/* 상단: 선택 날짜 + 추가버튼 */}
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
              onPress={() => {/* 새 일정 추가 */}}
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

          {/* 달력 */}
          <Calendar
            current = {selected}
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

        {/* 오늘의 일정 - 이 영역만 스크롤 */}
        <View style={{ marginHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
            오늘의 일정
          </Text>

          <FlatList
            data={dayEvents}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: LIST_MAX_H }}
            contentContainerStyle={{ paddingBottom: 12, gap: 10 }}
            renderItem={({ item }) => <EventRow item={item} />}
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

function EventRow({ item }: { item: EventItem }) {
  return (
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
        <Text style={{ fontWeight: '800', color: 'white', }}>{item.title}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {item.subtitle ? <Text style={{ color: '#6B7280' }}>{item.subtitle}</Text> : null}
      </View>

      <Text style={{ color: '#111827', fontWeight: '600', marginRight: 6 }}>
        {item.start} - {item.end}
      </Text>

      <Ionicons name="ellipsis-vertical" size={18} color="#111827" />
    </View>
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
