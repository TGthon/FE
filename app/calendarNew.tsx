import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const COLOR_PALETTE = [
  '#F59CA9', '#F43F5E', '#EC4899', '#E11D48',
  '#FB923C', '#F59E0B',
  '#F6D04D',
  '#22C55E', '#10B981', '#65A30D',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#2563EB',
  '#8B5CF6', '#7C3AED', '#A855F7'
];

export default function CalendarNew() {
  const router = useRouter();
  const { date: rawDate } = useLocalSearchParams<{ date?: string | string[] }>();
  const dateParam = typeof rawDate === 'string' ? rawDate : rawDate?.[0];

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);

  // 기본값: 선택된 날짜(없으면 오늘) 09:00 ~ 10:00
  const baseDate = dateParam ?? todayStr;
  const [title, setTitle]   = useState('');
  const [member, setMember] = useState('');
  const [note, setNote]     = useState('');
  const [color, setColor]   = useState(COLOR_PALETTE[0]);

  const [startDT, setStartDT] = useState(() => strToDate(baseDate, '09:00'));
  const [endDT,   setEndDT]   = useState(() => strToDate(baseDate, '10:00'));

  // ✅ 필수값 검사(제목, 날짜) → 저장 → 캘린더로 복귀
  const onSave = async () => {
    // 제목 필수
    if (!title.trim()) {
      Alert.alert('제목을 입력하세요.');
      return;
    }
    // 날짜(시간) 유효성
    const hasValidDate = !Number.isNaN(startDT.getTime()) && !Number.isNaN(endDT.getTime());
    if (!hasValidDate) {
      Alert.alert('날짜/시간을 선택하세요.');
      return;
    }
    if (endDT <= startDT) {
      Alert.alert('종료 시간은 시작 시간보다 커야 합니다.');
      return;
    }

    // 저장 페이로드 (멤버/메모는 선택)
    const payload = {
      title: title.trim(),
      date: startDT.toISOString().slice(0, 10),
      start: formatTime(startDT),
      end: formatTime(endDT),
      member: member.trim() || undefined,
      note: note.trim() || undefined,
      color,
    };

    try {
      // TODO: 실제 저장 API 연동
      // await api.post('/events', payload);

    } finally {
      // 저장 후 즉시 캘린더로
      router.replace('/(tabs)/calendar');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '일정 추가',
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
          headerTitleAlign: 'center',
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 제목 */}
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="일정 이름을 입력해주세요."
            returnKeyType="done"
          />

          {/* 날짜/시간 */}
          <SectionDivider />
          <SectionIcon name="calendar-outline" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 12, marginTop: 8 }}>
            <DateTimePill
              value={startDT}
              onChange={(d) => {
                setStartDT(d);
                if (d >= endDT) setEndDT(addMinutes(d, 60));
              }}
            />
            <Text style={{ color: '#6B7280' }}>→</Text>
            <DateTimePill
              value={endDT}
              onChange={(d) => {
                if (d <= startDT) return setEndDT(addMinutes(startDT, 30));
                setEndDT(d);
              }}
            />
          </View>

          {/* 멤버 (선택) */}
          <SectionDivider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionIcon name="people-outline" />
            <Text style={{ color: '#6B7280' }}>그룹 또는 친구에서 추가</Text>
          </View>
          <Input
            value={member}
            onChangeText={setMember}
            placeholder="참여자/그룹명 등을 입력해주세요."
            style={{ marginTop: 8 }}
          />

          {/* 메모 (선택) */}
          <SectionDivider />
          <SectionIcon name="document-text-outline" />
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="메모를 입력해주세요."
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: 'top', marginTop: 8 }}
          />

          {/* 색상 */}
          <SectionDivider />
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6, fontWeight: '600' }}>색상</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {COLOR_PALETTE.map((c) => {
              const selected = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: c,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: selected ? 2 : 0,
                    borderColor: selected ? '#111827' : 'transparent',
                    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 1,
                  }}
                >
                  {selected ? <Ionicons name="checkmark" size={18} color="#111827" /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
            backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 12, borderRadius: 22,
                borderWidth: 1, borderColor: '#111827',
                backgroundColor: pressed ? '#F3F4F6' : '#fff',
                alignItems: 'center', justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#111827', fontWeight: '700' }}>취소</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 12, borderRadius: 22,
                backgroundColor: pressed ? '#fb7185' : '#F43F5E',
                alignItems: 'center', justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>완료</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

/* ───────────── 재사용 UI ───────────── */

function SectionIcon({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
      <Ionicons name={name} size={26} color="#111827" />
    </View>
  );
}
function SectionDivider() {
  return <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />;
}
function Input(props: React.ComponentProps<typeof TextInput>) {
  const { style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      placeholderTextColor="#9CA3AF"
      style={[
        {
          borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 16,
          paddingHorizontal: 14, paddingVertical: 10,
          fontSize: 16, color: '#111827', backgroundColor: '#FFFFFF',
        },
        style,
      ]}
    />
  );
}

/** 알약 UI: 위-날짜, 아래-시간 */
function DateTimePill({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const onChangeDate = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (e.type !== 'set' || !d) return;
    const next = new Date(value);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(next);
  };

  const onChangeTime = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setShowTime(false);
    if (e.type !== 'set' || !d) return;
    const next = new Date(value);
    next.setHours(d.getHours(), d.getMinutes(), 0, 0);
    onChange(next);
  };

  return (
    <View style={{
      borderWidth: 1, borderColor: '#111827', borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 8, minWidth: 160,
    }}>
      <Pressable onPress={() => setShowDate(true)}>
        <Text style={{ fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          {formatKoreanDate(value)}
        </Text>
        <View style={{ height: 1, backgroundColor: '#111827', marginTop: 6 }} />
      </Pressable>

      <Pressable onPress={() => setShowTime(true)}>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>
          {formatTime(value)}
        </Text>
      </Pressable>

      {showDate && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
        />
      )}
      {showTime && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeTime}
        />
      )}
    </View>
  );
}

/* ───────────── 유틸 ───────────── */

function formatKoreanDate(d: Date) {
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function strToDate(ymd: string, hhmm: string) {
  return new Date(`${ymd}T${hhmm}:00`);
}
function addMinutes(d: Date, mins: number) {
  const n = new Date(d);
  n.setMinutes(n.getMinutes() + mins);
  return n;
}
