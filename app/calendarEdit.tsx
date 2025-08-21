// app/calendarEdit.tsx
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
  // Pink / Red
  '#F59CA9', '#F43F5E', '#EC4899', '#E11D48',
  // Orange / Amber
  '#FB923C', '#F59E0B',
  // Yellow (짙은 톤)
  '#F6D04D',
  // Green
  '#22C55E', '#10B981', '#65A30D',
  // Cyan / Blue
  '#06B6D4', '#0EA5E9', '#3B82F6', '#2563EB',
  // Purple / Violet
  '#8B5CF6', '#7C3AED', '#A855F7',
];

export default function CalendarEdit() {
  const router = useRouter();
  const raw = useLocalSearchParams<{
    id?: string | string[];
    date?: string | string[];     // 'YYYY-MM-DD'
    title?: string | string[];
    start?: string | string[];    // 'HH:mm'
    end?: string | string[];      // 'HH:mm'
    member?: string | string[];
    color?: string | string[];
    note?: string | string[];
  }>();

  const getStr = (v?: string | string[]) => (typeof v === 'string' ? v : v?.[0] ?? '');

  // ---- 기존 값 수집 (없으면 합리적인 기본값) ----
  const id      = getStr(raw.id);
  const dateStr = getStr(raw.date);
  const title0  = getStr(raw.title);
  const start0  = getStr(raw.start) || '09:00';
  const end0    = getStr(raw.end)   || '10:00';
  const member0 = getStr(raw.member);
  const color0  = getStr(raw.color) || COLOR_PALETTE[0];
  const note0   = getStr(raw.note);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);

  const baseDate = dateStr || todayStr;

  // ---- 상태 (초기값을 기존 값으로 세팅) ----
  const [title, setTitle]   = useState(title0);
  const [member, setMember] = useState(member0);
  const [note, setNote]     = useState(note0);
  const [color, setColor]   = useState(color0);

  const [startDT, setStartDT] = useState(() => strToDate(baseDate, start0));
  const [endDT,   setEndDT]   = useState(() => strToDate(baseDate, end0));

  // 저장: 제목/날짜 필수, 종료>시작
  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('제목을 입력하세요.');
      return;
    }
    const valid = !Number.isNaN(startDT.getTime()) && !Number.isNaN(endDT.getTime());
    if (!valid) {
      Alert.alert('날짜/시간을 선택하세요.');
      return;
    }
    if (endDT <= startDT) {
      Alert.alert('종료 시간은 시작 시간보다 커야 합니다.');
      return;
    }

    // TODO: 실제 수정 API 연동
    // await api.put('/events/:id', { ...payload })

    // 상세 화면으로 값 갱신해서 되돌아가기
    router.replace({
      pathname: '/calendarDetail',
      params: {
        id,
        date: startDT.toISOString().slice(0, 10),
        title: title.trim(),
        start: formatTime(startDT),
        end: formatTime(endDT),
        member: member.trim(),
        color,
        note: note.trim(),
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '일정 수정',
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
            placeholder="일정 이름"
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
            placeholder="직접 입력"
            style={{ marginTop: 8 }}
          />

          {/* 메모 (선택) */}
          <SectionDivider />
          <SectionIcon name="document-text-outline" />
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="메모"
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

        {/* 하단 고정 버튼 바 */}
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
              <Text style={{ color: '#fff', fontWeight: '700' }}>저장</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

/* ───────── 재사용 컴포넌트 ───────── */

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

/* ───────── 유틸 ───────── */

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
