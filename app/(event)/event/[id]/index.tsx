import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Modal, ActivityIndicator, Platform, Image } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import EventRenameModal from '../../../components/EventRenameModal';
import { apiPostJSON, apiDeleteJSON, apiGetJSON } from '../../../lib/api';

/** 투표 스키마 (화면 내부용) */
type VoteStatus = 'preferred' | 'non-preferred' | 'impossible';
type Vote = { userId: string; date: string; status: VoteStatus };

type DayAgg = { preferred: number; nonPreferred: number; impossible: number; total: number };

/** GET /api/event/:id 응답 타입 */
type ApiVote = {
  uid: number;
  picture: string;
  type: 'P' | 'N' | 'I';
  date: number; // seconds
};
type ApiUser = { uid: number; picture: string };
type EventResp = {
  eventid: number;
  title: string;
  votes: ApiVote[];
  users: ApiUser[];
};

/** 더미 친구 목록(백엔드 완성 전까지 사용) */
type Friend = { id: string; name: string };
const FRIENDS: Friend[] = [
  { id: '1001', name: '황유나' },
  { id: '1002', name: '이윤서' },
  { id: '1003', name: '김동희' },
  { id: '1004', name: '김서연' },
  { id: '1005', name: '이동현' },
];

export default function EventDetail() {
  // 파라미터 정규화 (배열 방지)
  const raw = useLocalSearchParams<{ id?: string | string[]; title?: string | string[] }>();
  const eventId = Array.isArray(raw.id) ? raw.id[0] : raw.id ?? '';
  const titleFromParam = Array.isArray(raw.title) ? raw.title[0] : raw.title ?? '';

  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);

  // 메뉴 모달
  const [menuOpen, setMenuOpen] = useState(false);

  // 이름 변경 모달
  const [renameVisible, setRenameVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const closeRename = () => setRenameVisible(false);

  // 초대 모달
  const [inviteOpen, setInviteOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState(false);

  // API 로드 상태 & 데이터
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState<string>(titleFromParam);
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]); // 화면 집계용

  // 이벤트 상세 불러오기
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    (async () => {
      setLoadingEvent(true);
      try {
        const data = await apiGetJSON<EventResp>(`/api/event/${eventId}`);

        if (cancelled) return;

        // 제목
        if (data?.title) setFetchedTitle(data.title);

        // 구성원
        setMembers(Array.isArray(data?.users) ? data.users : []);

        // 투표 → 화면용으로 매핑
        const mapped: Vote[] = (data?.votes ?? []).map((v) => ({
          userId: String(v.uid),
          date: toYMD(new Date(v.date * 1000)),
          status: v.type === 'P' ? 'preferred' : v.type === 'N' ? 'non-preferred' : 'impossible',
        }));
        setVotes(mapped);
      } catch (e) {
        console.warn('GET /api/event/:id 실패', e);
        // 실패 시엔 그냥 비워두기(기존 집계는 0으로 처리됨)
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const applyRename = useCallback(async () => {
    // TODO: 백엔드 연결 시 교체
    // await apiPutJSON(`/event/${eventId}/rename`, { title: nameInput.trim()});
    closeRename();
  }, [eventId, nameInput]);

  /** 날짜별 집계 (API 투표 기반) */
  const aggByDate = useMemo<Record<string, DayAgg>>(() => {
    const m: Record<string, DayAgg> = {};
    for (const v of votes) {
      const key = v.date;
      if (!m[key]) m[key] = { preferred: 0, nonPreferred: 0, impossible: 0, total: 0 };
      if (v.status === 'preferred') m[key].preferred += 1;
      else if (v.status === 'non-preferred') m[key].nonPreferred += 1;
      else m[key].impossible += 1;
      m[key].total += 1;
    }
    return m;
  }, [votes]);

  /** 분홍 강도 스케일 기준치: (불가능 없는 날들 중) 선호 최댓값 */
  const maxPreferred = useMemo(() => {
    let max = 0;
    Object.values(aggByDate).forEach((c) => {
      if (c.impossible === 0) max = Math.max(max, c.preferred);
    });
    return Math.max(max, 1);
  }, [aggByDate]);

  /** 선택된 날짜의 카운트 */
  const counts = useMemo<DayAgg>(() => {
    if (!selected || !aggByDate[selected]) return { preferred: 0, nonPreferred: 0, impossible: 0, total: 0 };
    return aggByDate[selected];
  }, [selected, aggByDate]);

  /** 달력 마킹 */
  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};
    Object.entries(aggByDate).forEach(([date, c]) => {
      const { bg, text } = computeDayColor(c, maxPreferred);
      result[date] = {
        customStyles: {
          container: { backgroundColor: bg, borderRadius: 8 },
          text: { color: text, fontWeight: '400' },
        },
      };
    });

    if (selected && !result[selected]) {
      result[selected] = {
        customStyles: {
          container: { borderRadius: 8 },
          text: { color: '#111827', fontWeight: '700' },
        },
      };
    }
    return result;
  }, [aggByDate, selected, maxPreferred]);

  const onDayPress = useCallback((day: DateData) => {
    setSelected(day.dateString);
  }, []);

  const headerTitle = selected ? formatLong(selected) : '날짜를 선택하세요';

  /** 초대 토글 */
  const togglePick = (uid: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  /** 선택 인원 초대 요청 */
  const inviteSelected = async () => {
    if (!eventId) return;
    if (picked.size === 0) {
      Alert.alert('안내', '초대할 친구를 선택해 주세요.');
      return;
    }

    setInviting(true);
    try {
      const ids = Array.from(picked);
      const results = await Promise.allSettled(ids.map((uid) => apiPostJSON(`/api/event/${eventId}/user`, { user: uid })));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;

      if (ok > 0 && fail === 0) {
        Alert.alert('완료', `${ok}명 초대했어요.`);
        setInviteOpen(false);
        setPicked(new Set());
      } else if (ok > 0 && fail > 0) {
        Alert.alert('부분 완료', `${ok}명은 초대했고, ${fail}명은 실패했어요.`);
      } else {
        Alert.alert('실패', '초대에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '초대 중 오류가 발생했어요.');
    } finally {
      setInviting(false);
    }
  };

  /** 이벤트 탈퇴 실행 */
  const leaveEvent = async () => {
    try {
      if (!eventId) throw new Error('이벤트 ID가 없습니다.');
      await apiDeleteJSON(`/api/event/${eventId}/user/me`);
      router.back();
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '탈퇴에 실패했습니다.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: fetchedTitle || '이벤트',
          headerTitleStyle: { fontSize: 24, fontWeight: '700' },
          headerRight: () => (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Ionicons name="menu" size={28} color="#111827" />
            </Pressable>
          ),
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
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(event)/event/[id]/vote',
                  params: { id: eventId, title: fetchedTitle },
                })
              }
            >
              <Ionicons name="create-outline" size={32} color="#111827" />
            </Pressable>
          </View>

          {/* 실제 달력 */}
          <View style={{ padding: 12, position: 'relative' }}>
            <Calendar
              markingType="custom"
              markedDates={markedDates}
              onDayPress={onDayPress}
              dayComponent={({ date, state, marking }: { date?: DateData; state?: string; marking?: any }) => {
                if (!date) return <View style={{ width: 32, height: 32 }} />;

                const isSelected = selected === date.dateString;
                const bg = marking?.customStyles?.container?.backgroundColor ?? 'transparent';
                const textColor =
                  marking?.customStyles?.text?.color ?? (state === 'disabled' ? '#94A3B8' : '#111827');

                const agg = (aggByDate as any)[date.dateString] as DayAgg | undefined;
                const showDot = !!agg && agg.impossible === 0 && agg.nonPreferred > 0;

                const CELL_SIZE = 32;
                const BUBBLE_SIZE = 28;
                const DOT_SIZE = 7;
                const DOT_OFFSET = 3;

                return (
                  <Pressable
                    onPress={() => onDayPress(date)}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <View
                      style={{
                        width: BUBBLE_SIZE,
                        height: BUBBLE_SIZE,
                        borderRadius: BUBBLE_SIZE / 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bg,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? '#1D4ED8' : 'transparent',
                        position: 'relative',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: textColor, fontWeight: isSelected ? '700' : '400' }}>
                        {date.day}
                      </Text>
                    </View>

                    {showDot && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          transform: [{ translateX: DOT_OFFSET }, { translateY: DOT_OFFSET }],
                          width: DOT_SIZE,
                          height: DOT_SIZE,
                          borderRadius: DOT_SIZE / 2,
                          backgroundColor: '#FACC15',
                          shadowColor: '#000',
                          shadowOpacity: 0.12,
                          shadowRadius: 1.5,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 1,
                        }}
                      />
                    )}
                  </Pressable>
                );
              }}
              theme={{
                todayTextColor: '#2563EB',
                arrowColor: '#2563EB',
                monthTextColor: '#111827',
                textMonthFontWeight: '700',
                textDayFontSize: 14,
              }}
            />

            {loadingEvent && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ActivityIndicator size="small" />
                <Text style={{ fontSize: 12, color: '#374151' }}>불러오는 중…</Text>
              </View>
            )}
          </View>
        </View>

        {/* 투표 상태 집계 */}
        <View style={{ gap: 10 }}>
          <StatusRow label="Preferred" color="#FCA5A5" count={`${counts.preferred}명`} />
          <StatusRow label="Non-preferred" color="#FACC15" count={`${counts.nonPreferred}명`} />
          <StatusRow label="Impossible" color="#CBD5E1" count={`${counts.impossible}명`} />
        </View>

        {/* 세부 시간 조율하기 버튼 */}
        <View style={{ marginTop: 16 }}>
          <OutlineButton
            title="세부 시간 조율하기"
            disabled={!selected}
            onPress={() => {
              if (!selected) return;
              router.push({
                pathname: '/(event)/event/[id]/time',
                params: { id: eventId, title: fetchedTitle, date: selected },
              });
            }}
          />
        </View>
      </ScrollView>

      {/* ====== 그룹 메뉴 모달 ====== */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setMenuOpen(false)} />
        <View
          style={{
            position: 'absolute',
            right: 16,
            top: 80,
            width: 260,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{fetchedTitle || '그룹'}</Text>
          </View>

          {/* 구성원 리스트 (API users 기반) */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ marginBottom: 10, color: '#374151' }}>구성원 {members.length}명</Text>
            {members.map((u) => (
              <View key={u.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                  }}
                >
                  {u.picture ? (
                    <Image source={{ uri: u.picture }} style={{ width: 28, height: 28 }} />
                  ) : (
                    <Text>👤</Text>
                  )}
                </View>
                <Text style={{ fontSize: 14 }}>사용자 {u.uid}</Text>
              </View>
            ))}
            {members.length === 0 && <Text style={{ color: '#9CA3AF' }}>구성원 정보가 없습니다.</Text>}
          </View>

          <MenuItem
            label="그룹 이름 변경"
            onPress={() => {
              setMenuOpen(false);
              setNameInput(fetchedTitle ?? '');
              setRenameVisible(true);
            }}
          />
          <MenuItem
            label="구성원 초대하기"
            onPress={() => {
              setMenuOpen(false);
              setInviteOpen(true);
            }}
          />
          <MenuItem
            label="도움말"
            onPress={() => {
              setMenuOpen(false);
              router.push('/(event)/event/tip');
            }}
          />
          <MenuItem
            label="이벤트 확정"
            important
            onPress={() => {
              setMenuOpen(false);

              if (Platform.OS === 'web') {
                const ok = window.confirm('이 이벤트를 확정하시겠습니까? 확정 후 수정이 불가능합니다.');
                if (ok) {
                  router.push({
                    pathname: '/(event)/event/[id]/finalize',
                    params: { id: eventId, title: fetchedTitle },
                  });
                }
                return;
              }

              Alert.alert(
                '이벤트 확정',
                '이 이벤트를 확정하시겠습니까? 확정 후 수정이 불가능합니다.',
                [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '확정',
                    style: 'default',
                    onPress: () =>
                      router.push({
                        pathname: '/(event)/event/[id]/finalize',
                        params: { id: eventId, title: fetchedTitle },
                      }),
                  },
                ],
                { cancelable: true }
              );
            }}
          />
          <MenuItem
            label="이벤트 탈퇴"
            destructive
            onPress={() => {
              setMenuOpen(false);

              if (Platform.OS === 'web') {
                const ok = window.confirm('정말 이 이벤트에서 탈퇴하시겠습니까?');
                if (ok) void leaveEvent();
                return;
              }

              Alert.alert(
                '이벤트 탈퇴',
                '정말 이 이벤트에서 탈퇴하시겠습니까?',
                [
                  { text: '취소', style: 'cancel' },
                  { text: '탈퇴', style: 'destructive', onPress: () => void leaveEvent() },
                ],
                { cancelable: true }
              );
            }}
          />
        </View>
      </Modal>

      {/* 이름 변경 모달 */}
      <EventRenameModal visible={renameVisible} value={nameInput} onChangeText={setNameInput} onCancel={closeRename} onSave={applyRename} />

      {/* 초대 모달 (더미 친구 목록 기반) */}
      <Modal visible={inviteOpen} transparent animationType="fade" onRequestClose={() => setInviteOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setInviteOpen(false)} />
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 120,
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            padding: 14,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>친구 초대</Text>

          {/* 친구 리스트(멀티 선택) */}
          <View style={{ maxHeight: 320, paddingVertical: 4 }}>
            {FRIENDS.map((f) => {
              const active = picked.has(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => togglePick(f.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? '#F9FAFB' : '#fff',
                  })}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? '#F43F5E' : '#CBD5E1',
                      marginRight: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? '#FEE2E2' : '#fff',
                    }}
                  >
                    {active ? <Ionicons name="checkmark" size={18} color="#F43F5E" /> : null}
                  </View>
                  <Text style={{ flex: 1, fontSize: 16 }}>{f.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* 하단 버튼 */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={() => setInviteOpen(false)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#111827',
                backgroundColor: pressed ? '#F3F4F6' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontWeight: '700', color: '#111827' }}>취소</Text>
            </Pressable>

            <Pressable
              onPress={inviteSelected}
              disabled={picked.size === 0 || inviting}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: picked.size === 0 ? '#FECACA' : pressed ? '#fb7185' : '#F43F5E',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: inviting ? 0.7 : 1,
              })}
            >
              {inviting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '700', color: '#fff' }}>초대하기{picked.size ? ` (${picked.size})` : ''}</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** 색상 규칙 */
function computeDayColor(c: DayAgg, maxPreferred: number) {
  if (c.impossible > 0) {
    return { bg: '#CBD5E1', text: '#111827' };
  }
  if (maxPreferred <= 0 || c.preferred <= 0) {
    return { bg: '#FFFFFF', text: '#111827' };
  }
  const ratio = Math.max(0, Math.min(1, c.preferred / maxPreferred));
  const bg = mixHex('#FFFFFF', '#F43F5E', ratio);
  const text = ratio > 0.65 ? '#FFFFFF' : '#111827';
  return { bg, text };
}

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
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
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

/** YYYY-MM-DD */
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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

function MenuItem({
  label,
  onPress,
  destructive,
  important,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  important?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: pressed ? '#F9FAFB' : '#fff',
      })}
    >
      <Text
        style={{
          fontSize: 15,
          color: destructive ? '#DC2626' : important ? 'green' : '#111827',
          fontWeight: destructive ? '700' : important ? '700' : '400',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OutlineButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: disabled ? '#F5B7BA' : '#F45F62',
        borderRadius: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: disabled ? '#F5B7BA' : '#F45F62', fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}
