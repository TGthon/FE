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
  Modal,
  TouchableOpacity,
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
  '#8B5CF6', '#7C3AED', '#A855F7',
];

export default function CalendarEdit() {
  const router = useRouter();
  const raw = useLocalSearchParams<{
    id?: string | string[];
    date?: string | string[];
    title?: string | string[];
    start?: string | string[];
    end?: string | string[];
    member?: string | string[];   // 콤마 구분 문자열일 수 있음
    color?: string | string[];
    note?: string | string[];
  }>();

  const getStr = (v?: string | string[]) => (typeof v === 'string' ? v : v?.[0] ?? '');

  // ---- 기존 값 수집 ----
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

  // 문자열 member → 배열로 변환(“A, B, C”만 분해, “이윤서 외 3명”은 그대로 한 항목)
  const initialMembers = useMemo(() => {
    if (!member0) return [];
    if (member0.includes(' 외 ')) return [member0];
    return member0.split(',').map(s => s.trim()).filter(Boolean);
  }, [member0]);

  // ---- 상태 ----
  const [title, setTitle]   = useState(title0);
  const [note, setNote]     = useState(note0);
  const [color, setColor]   = useState(color0);
  const [startDT, setStartDT] = useState(() => strToDate(baseDate, start0));
  const [endDT,   setEndDT]   = useState(() => strToDate(baseDate, end0));

  // 멤버(새 화면과 동일 메커니즘)
  const [members, setMembers] = useState<string[]>(initialMembers);
  const [memberInput, setMemberInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [friendList, setFriendList] = useState<{ id: string, name: string }[]>([]);
  const [groupList, setGroupList] = useState<{ id: string, name: string }[]>([]);
  const [selected, setSelected] = useState<{ id: string, name: string }[]>([]);

  const openSelectModal = async () => {
    // 실제 API 연동 시 여기서 불러오면 됨
    setFriendList([
      { id: 'f1', name: '홍길동' },
      { id: 'f2', name: '김철수' },
      { id: 'f3', name: '이영희' },
    ]);
    setGroupList([
      { id: 'g1', name: '스터디모임' },
      { id: 'g2', name: '동아리' },
    ]);
    setSelected([]);
    setModalVisible(true);
  };

  const addSelectedMembers = () => {
    const names = selected.map(s => s.name);
    setMembers(prev => Array.from(new Set([...prev, ...names])));
    setModalVisible(false);
  };

  const addMemberInput = () => {
    const name = memberInput.trim();
    if (name && !members.includes(name)) {
      setMembers([...members, name]);
      setMemberInput('');
    }
  };

  const removeMember = (name: string) => {
    setMembers(members.filter(m => m !== name));
  };

  // 저장
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
    // await api.put(`/events/${id}`, payload)

    router.replace({
      pathname: '/calendarDetail',
      params: {
        id,
        date: startDT.toISOString().slice(0, 10),
        title: title.trim(),
        start: formatTime(startDT),
        end: formatTime(endDT),
        member: members.join(', '), // detail은 문자열로 받으므로 합쳐서 전달
        color,
        note: (note || '').trim(),
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

          {/* 멤버 (캘린더 New와 동일) */}
          <SectionDivider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionIcon name="people-outline" />
            <Pressable
              onPress={openSelectModal}
              style={{
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: '#111827', fontWeight: '600' }}>그룹 또는 친구에서 추가</Text>
            </Pressable>
          </View>

          {/* 직접 입력 + 칩 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Input
              value={memberInput}
              onChangeText={setMemberInput}
              placeholder="참여자 이름 직접 입력"
              style={{ flex: 1 }}
              returnKeyType="done"
              onSubmitEditing={addMemberInput}
            />
            <Pressable
              onPress={addMemberInput}
              style={{
                marginLeft: 8,
                backgroundColor: '#F43F5E',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>추가</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {members.map((name) => (
              <View
                key={name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginRight: 4,
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: '#111827', fontWeight: '600', marginRight: 6 }}>{name}</Text>
                <TouchableOpacity onPress={() => removeMember(name)}>
                  <Ionicons name="close-circle" size={18} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* 메모 */}
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
              const selectedChip = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: c,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: selectedChip ? 2 : 0,
                    borderColor: selectedChip ? '#111827' : 'transparent',
                    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 1,
                  }}
                >
                  {selectedChip ? <Ionicons name="checkmark" size={18} color="#111827" /> : null}
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

      {/* 친구/그룹 선택 모달 (New와 동일) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 18, padding: 18, maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>친구/그룹 선택</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>친구</Text>
              {friendList.length === 0 && <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>친구 없음</Text>}
              {friendList.map((f) => (
                <Pressable
                  key={`friend-${f.id}`}
                  onPress={() => {
                    if (selected.some(s => s.id === f.id)) setSelected(selected.filter(s => s.id !== f.id));
                    else setSelected([...selected, f]);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
                >
                  <Ionicons
                    name={selected.some(s => s.id === f.id) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color="#F43F5E"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 16 }}>{f.name}</Text>
                </Pressable>
              ))}

              <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 6 }}>그룹</Text>
              {groupList.length === 0 && <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>그룹 없음</Text>}
              {groupList.map((g) => (
                <Pressable
                  key={`group-${g.id}`}
                  onPress={() => {
                    if (selected.some(s => s.id === g.id)) setSelected(selected.filter(s => s.id !== g.id));
                    else setSelected([...selected, g]);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
                >
                  <Ionicons
                    name={selected.some(s => s.id === g.id) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color="#2563EB"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 16 }}>{g.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 }}
              >
                <Text style={{ color: '#111827', fontWeight: '600' }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={addSelectedMembers}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#F43F5E' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>추가하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
