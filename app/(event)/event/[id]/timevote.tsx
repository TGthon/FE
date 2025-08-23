import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
  StyleSheet,
  PixelRatio,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

/** 투표 모드 */
type VoteMode = 'possible' | 'impossible';
type CellKey = string; // 'HH:mm'

/** 헬퍼: string | string[] | undefined → string | undefined */
const s = (v?: string | string[]) => (typeof v === 'string' ? v : v?.[0]);

/** 픽셀 반올림 유틸 */
const rn = (n: number) => Math.max(1, Math.floor(PixelRatio.roundToNearestPixel(n)));

export default function TimeVoteScreen() {
  const router = useRouter();
  const raw = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    date?: string | string[];
  }>();
  const id = s(raw.id);
  const title = s(raw.title);
  const date = s(raw.date);

  const { height: winH, width: winW } = Dimensions.get('window');

  /** 화면에 24줄이 보이도록 자동 높이 (안드로이드 픽셀 반올림 포함) */
  const RESERVED_H = 220;
  const availableH = Math.max(200, winH - RESERVED_H);
  const ROW_H = rn(Math.max(16, Math.floor(availableH / 24)));

  /** 30분 → 한 행 2칸, 중앙 정렬용 폭 계산 */
  const HOUR_W = rn(48);
  const CELL_W = rn((winW * 0.9 - HOUR_W) / 2);
  const GRID_W = rn(HOUR_W + CELL_W * 2);
  const CELL_AREA_W = rn(CELL_W * 2);

  /** 모드 (가능/불가능) */
  const [mode, setMode] = useState<VoteMode>('possible');

  /** 현재 유저의 선택: key('HH:mm') -> 'possible' | 'impossible' */
  const [myVotes, setMyVotes] = useState<Record<CellKey, VoteMode>>({});

  /** 드래그/토글 제어 */
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragMode = useRef<VoteMode>('possible');
  const appliedDuringDrag = useRef<Set<CellKey>>(new Set());

  /** 터치영역 절대좌표(measure) */
  const touchAreaRef = useRef<View>(null);
  const measureRef = useRef({ px: 0, py: 0, w: 0, h: 0 });

  const doMeasure = useCallback(() => {
    // measure는 레이아웃 후 호출 필요
    touchAreaRef.current?.measure?.((_x, _y, w, h, px, py) => {
      measureRef.current = { px: px ?? 0, py: py ?? 0, w: w ?? 0, h: h ?? 0 };
    });
  }, []);

  const onTouchAreaLayout = useCallback(() => {
    // 레이아웃 직후/회전 등에서 재측정
    requestAnimationFrame(doMeasure);
    setTimeout(doMeasure, 0);
  }, [doMeasure]);

  useEffect(() => {
    const id = setTimeout(doMeasure, 50);
    return () => clearTimeout(id);
  }, [winW, winH, doMeasure]);

  const keyOf = (row: number, col: number) => `${pad(row)}:${col === 0 ? '00' : '30'}`;

  /** 같은 모드로 또 선택하면 해제, 아니면 설정 (탭/드래그 공통) */
  const toggleApplyAt = useCallback((rowIdx: number, colIdx: number, m: VoteMode) => {
    if (rowIdx < 0 || rowIdx > 23 || colIdx < 0 || colIdx > 1) return;
    const key: CellKey = keyOf(rowIdx, colIdx);
    setMyVotes(prev => {
      if (prev[key] === m) {
        const { [key]: _, ...rest } = prev; // 해제
        return rest;
      }
      return { ...prev, [key]: m }; // 설정
    });
  }, []);

  /** pageX/Y → 셀 인덱스 변환 (안드로이드 신뢰용) */
  const eventToCell = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      const { px, py } = measureRef.current;
      const relX = Math.max(0, pageX - px);
      const relY = Math.max(0, pageY - py);
      const row = Math.floor(relY / ROW_H);
      const col = Math.floor(relX / CELL_W);
      return { row, col };
    },
    [ROW_H, CELL_W]
  );

  /** 제스처 핸들러: PanResponder로 ScrollView와 충돌 방지 */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          dragging.current = true;
          setIsDragging(true);
          dragMode.current = mode;
          appliedDuringDrag.current.clear();

          const { row, col } = eventToCell(evt);
          const key = keyOf(row, col);
          if (!appliedDuringDrag.current.has(key)) {
            appliedDuringDrag.current.add(key);
            toggleApplyAt(row, col, dragMode.current);
          }
        },
        onPanResponderMove: (evt) => {
          if (!dragging.current) return;
          const { row, col } = eventToCell(evt);
          const key = keyOf(row, col);
          if (appliedDuringDrag.current.has(key)) return;
          appliedDuringDrag.current.add(key);
          toggleApplyAt(row, col, dragMode.current);
        },
        onPanResponderRelease: () => {
          dragging.current = false;
          setIsDragging(false);
          appliedDuringDrag.current.clear();
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          setIsDragging(false);
          appliedDuringDrag.current.clear();
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [mode, eventToCell, toggleApplyAt]
  );

  /** 셀 배경 색: 내 선택만 반영 (가능=핑크, 불가능=회색, 미선택=흰색) */
  const fillFor = useCallback(
    (key: CellKey) => {
      const v = myVotes[key];
      if (!v) return '#FFFFFF';
      if (v === 'impossible') return '#CBD5E1';
      return '#FBC0C5';
    },
    [myVotes]
  );

  /** 저장(예시): 서버 포맷으로 변환 후 제출 → 성공 시 이전 화면 */
  const dirty = Object.keys(myVotes).length > 0;
  const handleSubmit = async () => {
    if (!id || !date) {
      Alert.alert('오류', '그룹 또는 날짜 정보가 없습니다.');
      return;
    }
    const payload = Object.entries(myVotes).map(([hhmm, m]) => ({
      datetime: `${date}T${hhmm}`,
      status: m === 'possible' ? 'preferred' : 'impossible',
    }));
    try {
      // TODO: 실제 API 호출
      // await apiPostJSON(`/api/event/${id}/time-vote`, payload);
      router.back();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? '잠시 후 다시 시도해주세요.');
    }
  };

  /** 24시간 × 2칸의 키 미리 생성 */
  const keys = useMemo(
    () => Array.from({ length: 24 }).map((_, h) => [`${pad(h)}:00`, `${pad(h)}:30`] as const),
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '시간 투표',
          headerTitleStyle: { fontSize: 22, fontWeight: '800' },
          headerRight: () => (
            <Pressable
              onPress={handleSubmit}
              disabled={!dirty}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: dirty ? '#F45F62' : '#FBD5D5',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>투표하기</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }}
        scrollEnabled={!isDragging}
        keyboardShouldPersistTaps="handled"
      >
        {/* 상단: 날짜 + 모드 토글 */}
        <View
          style={{
            width: GRID_W,
            paddingTop: 12,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 16, color: '#6B7280' }}>{formatKorean(date ?? '')} 기준</Text>
          <ModeCards mode={mode} onChange={setMode} />
        </View>

        {/* 헤더 (시/분 + 00/30) */}
        <View style={{ width: GRID_W, flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
          <View style={{ width: HOUR_W }}>
            <Text style={{ fontWeight: '700', color: '#111827' }}>시/분</Text>
          </View>
          <View style={{ flex: 1, position: 'relative', flexDirection: 'row' }}>
            {['00', '30'].map((m) => (
              <Text key={m} style={{ width: CELL_W, textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>
                {m}
              </Text>
            ))}
            <Text style={{ position: 'absolute', right: 0, fontWeight: '600', color: '#6B7280', textAlign: 'right' }}>
              00
            </Text>
          </View>
        </View>

        {/* 본문 그리드 */}
        <View style={{ width: GRID_W, flexDirection: 'row' }}>
          {/* 시 라벨 */}
          <View style={{ width: HOUR_W }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <View key={h} style={{ height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#6B7280' }}>{pad(h)}</Text>
              </View>
            ))}
          </View>

          {/* 셀 영역 (터치/드래그 처리) */}
          <View
            ref={touchAreaRef}
            collapsable={false}            // Android measure 안정화
            onLayout={onTouchAreaLayout}
            {...panResponder.panHandlers}  // PanResponder 연결
            style={{ width: CELL_AREA_W }}
          >
            {keys.map(([k00, k30], rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row' }}>
                <Cell width={CELL_W} height={ROW_H} color={fillFor(k00)} />
                <Cell width={CELL_W} height={ROW_H} color={fillFor(k30)} />
              </View>
            ))}
          </View>
        </View>

        {/* 하단 안내문구 */}
        <View style={{ width: GRID_W, marginTop: 14 }}>
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
            모드를 고른 뒤 그리드에서 여러 칸을 드래그/탭하세요. 같은 모드로 다시 선택하면 해제됩니다.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function ModeCards({ mode, onChange }: { mode: VoteMode; onChange: (m: VoteMode) => void }) {
  // 정수 픽셀로 버튼 치수 보정
  const BTN_MIN_H = rn(40);
  const BTN_PAD_H = rn(8);
  const BTN_PAD_W = rn(14);
  const RADIUS = rn(20);

  const baseBtn = {
    minWidth: rn(100),
    minHeight: BTN_MIN_H,
    paddingHorizontal: BTN_PAD_W,
    paddingVertical: BTN_PAD_H,
    borderRadius: RADIUS,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const, // 클리핑/픽셀 잔상 방지
  };

  const labelStyle = (active: boolean) => ({
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,              // fontSize보다 살짝 크게: 클리핑 방지
    includeFontPadding: false,   // ANDROID: 글자 상단 여백 제거(깎임 방지)
    textAlignVertical: 'center' as const, // ANDROID
    color: active ? '#111827' : '#6B7280',
    textAlign: 'center' as const,
  });

  return (
    <View style={{ flexDirection: 'row' }}>
      <Pressable
        onPress={() => onChange('possible')}
        style={({ pressed }) => ({
          ...baseBtn,
          backgroundColor: '#F5BFC5',
          borderWidth: mode === 'possible' ? 2 : 0,
          borderColor: '#111827',
          opacity: pressed ? 0.9 : 1,
          marginRight: 12,
        })}
      >
        <Text
          style={labelStyle(mode === 'possible')}
          numberOfLines={1}
          allowFontScaling={false} // 시스템 글자크기 확대 시 버튼 클리핑 방지
        >
          가능
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('impossible')}
        style={({ pressed }) => ({
          ...baseBtn,
          backgroundColor: '#D9DDE2',
          borderWidth: mode === 'impossible' ? 2 : 0,
          borderColor: '#111827',
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text
          style={labelStyle(mode === 'impossible')}
          numberOfLines={1}
          allowFontScaling={false}
        >
          불가능
        </Text>
      </Pressable>
    </View>
  );
}


/** 셀: 칠해진 칸이면 선을 흰색(#FFF)으로, Hairline로 이음새 최소화 */
function Cell({ width, height, color }: { width: number; height: number; color: string }) {
  const isFilled = color !== '#FFFFFF';
  return (
    <View
      style={{
        width,
        height,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: isFilled ? '#FFFFFF' : '#D1D5DB',
        backgroundColor: color,
      }}
    />
  );
}

/** 유틸 */
const pad = (n: number) => String(n).padStart(2, '0');
function formatKorean(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}
