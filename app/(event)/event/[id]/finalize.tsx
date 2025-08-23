import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView,
  Platform, Alert, Image, ActivityIndicator, Modal
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { apiGetJSON /*, apiPostJSON */ } from '../../../lib/api';

const COLOR_PALETTE = [
  '#F59CA9','#F43F5E','#EC4899','#E11D48',
  '#FB923C','#F59E0B','#F6D04D',
  '#22C55E','#10B981','#65A30D',
  '#06B6D4','#0EA5E9','#3B82F6','#2563EB',
  '#8B5CF6','#7C3AED','#A855F7'
];

/** API 타입 */
type ApiUser = { uid: number; picture: string };
type EventResp = { eventid: number; title: string; votes?: any; users: ApiUser[] };
type RecommendResp = { start: number; end: number }; // unixtime(초)

export default function EventFinalize() {
  const router = useRouter();
  const raw = useLocalSearchParams<{ id: string | string[]; title?: string | string[] }>();
  const getStr = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v ?? '');

  const eventId = getStr(raw.id);
  const titleFromParam = getStr(raw.title);

  // 기본값(오늘 09:00~10:00)
  const todayStr = useMemo(() => toYMD(new Date()), []);
  const [title, setTitle] = useState(titleFromParam || '이벤트');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [startDT, setStartDT] = useState(() => strToDate(todayStr, '09:00'));
  const [endDT, setEndDT] = useState(() => strToDate(todayStr, '10:00'));

  const [members, setMembers] = useState<ApiUser[]>([]);

  // 추천 불러오기 로딩/적용 여부/사용자 수정 여부
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoApplied, setRecoApplied] = useState(false);
  const [dirty, setDirty] = useState(false); // 사용자가 날짜/시간을 수정했는지

  /** (1) 이름 받아와서 표기 + (3) 구성원 받아와서 표기 + (2) 추천 날짜 적용 */
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    (async () => {
      // 이벤트 상세 (users, title)
      try {
        const data = await apiGetJSON<EventResp>(`/api/event/${eventId}`);
        if (cancelled) return;

        if (data?.title) setTitle((t) => t || data.title);
        setMembers(Array.isArray(data?.users) ? data.users : []);
      } catch (e) {
        console.warn('GET /api/event/:id 실패', e);
      }

      // 추천 시간
      setRecoLoading(true);
      try {
        const rec = await apiGetJSON<RecommendResp>(`/api/event/${eventId}/recommend`);
        if (cancelled) return;

        if (!dirty && rec?.start && rec?.end) {
          const s = new Date(rec.start * 1000);
          const e = new Date(rec.end * 1000);
          setStartDT(s);
          setEndDT(e);
          setRecoApplied(true);
        }
      } catch (e) {
        console.warn('GET /recommend 실패', e);
      } finally {
        if (!cancelled) setRecoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [eventId, dirty]);

  /** 확정 (4개 요구사항 외 로직 – 실제 확정 API 연결은 추후) */
  const onConfirm = async () => {
    if (!title.trim()) return Alert.alert('제목을 입력하세요.');
    if (Number.isNaN(startDT.getTime()) || Number.isNaN(endDT.getTime()))
      return Alert.alert('날짜/시간을 선택하세요.');
    if (endDT <= startDT)
      return Alert.alert('종료 시간은 시작 시간보다 커야 합니다.');

    const payload = {
      title: title.trim(),
      date: toYMD(startDT),
      start: toHM(startDT),
      end: toHM(endDT),
      members: members.map((m) => String(m.uid)),
      color,
    };

    try {
      // TODO: 백엔드 확정 API 연결
      // await apiPostJSON(`/api/event/${eventId}/finalize`, payload);
      router.back();
    } catch (e: any) {
      Alert.alert('확정 실패', e?.message ?? '오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${title} 확정하기`,
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
          {/* 1) 이름 */}
          <Input value={title} onChangeText={setTitle} placeholder="이벤트 이름" returnKeyType="done" />
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4, marginLeft: 8 }}>
            *이벤트 이름은 구성원 모두에게 동일하게 적용됩니다.
          </Text>

          {/* 2) 추천 날짜로 일정 정하기 (Pill만) */}
          <SectionDivider />
          <SectionIcon name="calendar-outline" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 12, marginTop: 8 }}>
            <DateTimePill
              value={startDT}
              onChange={(d) => {
                setDirty(true);
                setStartDT(d);
                if (d >= endDT) setEndDT(addMinutes(d, 60));
              }}
            />
            <Text style={{ color: '#6B7280' }}>→</Text>
            <DateTimePill
              value={endDT}
              onChange={(d) => {
                setDirty(true);
                if (d <= startDT) return setEndDT(addMinutes(startDT, 30));
                setEndDT(d);
              }}
            />
          </View>
          {recoApplied && (
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4, marginLeft: 8 }}>
              *자동으로 추천된 날짜입니다.
            </Text>
          )}

          {/* 3) 구성원 */}
          <SectionDivider />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="people-outline" size={22} color="#111827" />
            <Text style={{ marginLeft: 6, fontSize: 16, color: '#111827', fontWeight: '700' }}>
              구성원 {members.length}명
            </Text>
          </View>
          {members.length === 0 ? (
            <Text style={{ color: '#9CA3AF', marginLeft: 28 }}>구성원 정보가 없습니다.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {members.map((u) => (
                <View key={u.uid} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 28, height: 28, borderRadius: 14, overflow: 'hidden',
                      borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 8,
                      backgroundColor: '#fff',
                    }}
                  >
                    {u.picture ? <Image source={{ uri: u.picture }} style={{ width: 28, height: 28 }} /> : <Text>👤</Text>}
                  </View>
                  <Text style={{ fontSize: 14, color: '#111827' }}>사용자 {u.uid}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 4) 색상 정하기 */}
          <SectionDivider />
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6, fontWeight: '600' }}>색상</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {COLOR_PALETTE.map((c) => {
              const selectedColor = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={{
                    width: 34, height: 34, borderRadius: 17, backgroundColor: c,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: selectedColor ? 2 : 0,
                    borderColor: selectedColor ? '#111827' : 'transparent',
                    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 1,
                  }}
                >
                  {selectedColor ? <Ionicons name="checkmark" size={18} color="#111827" /> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4, marginLeft: 8 }}>
            *이벤트 색상은 캘린더에 표시됩니다. 선택한 색상은 이벤트 구성원 모두에게 동일하게 적용됩니다.
          </Text>
        </ScrollView>

        {/* 하단 버튼 바 */}
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
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 12, borderRadius: 22,
                backgroundColor: pressed ? '#fb7185' : '#F43F5E',
                alignItems: 'center', justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>확정</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 추천 시간 로딩 오버레이 */}
      <Modal visible={recoLoading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ color: '#374151' }}>추천 시간 불러오는 중…</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ───────── 공통 컴포넌트 & 유틸 ───────── */

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

function DateTimePill({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
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
    <View style={{ borderWidth: 1, borderColor: '#111827', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, minWidth: 160 }}>
      <Pressable onPress={() => setShowDate(true)}>
        <Text style={{ fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{formatKoreanDate(value)}</Text>
        <View style={{ height: 1, backgroundColor: '#111827', marginTop: 6 }} />
      </Pressable>

      <Pressable onPress={() => setShowTime(true)}>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>{toHM(value)}</Text>
      </Pressable>

      {showDate && <DateTimePicker value={value} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onChangeDate} />}
      {showTime && <DateTimePicker value={value} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeTime} />}
    </View>
  );
}

/** 유틸 */
function formatKoreanDate(d: Date) {
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
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
function strToDate(ymd: string, hhmm: string) {
  return new Date(`${ymd}T${hhmm}:00`);
}
function addMinutes(d: Date, mins: number) {
  const n = new Date(d);
  n.setMinutes(n.getMinutes() + mins);
  return n;
}
