import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TipScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: '도움말',
          headerTitleStyle: { fontSize: 22, fontWeight: '800' },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ paddingHorizontal: 4, paddingVertical: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          backgroundColor: '#fff',
          gap: 18,
        }}
      >
        {/* 라벨 배지 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill label="Preferred" bg="#FCA5A5" />
          <Pill label="Non-preferred" bg="#FACC15" />
          <Pill label="Impossible" bg="#CBD5E1" />
        </View>

        {/* 설명 1 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800' }}>달력에 일정 선호도를 표시해보세요.</Text>
          <Text style={{ lineHeight: 22 }}>
            <Text style={{ fontWeight: '700' }}>Preferred</Text>
            <Text> : 선호, 약속 참여 가능 일정{'\n'}</Text>
            <Text style={{ fontWeight: '700' }}>Non-preferred</Text>
            <Text> : 비선호, 참여할 수는 있지만 선호하지 않음, 약속이 이미 있지만 바꿀 수 있음 등{'\n'}</Text>
            <Text style={{ fontWeight: '700' }}>Impossible</Text>
            <Text> : 불가능, 약속 참여할 수 없음</Text>
          </Text>
        </View>

        {/* 점점 진해지는 예시 */}
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 16 }}>
          {[0.25, 0.45, 0.65, 0.85].map((alpha, i) => (
            <Bubble key={i} size={36} color={`rgba(244,63,94,${alpha})`} />
          ))}
        </View>
        <Text style={{ lineHeight: 22 }}>
          <Text style={{ fontWeight: '700' }}>Preferred</Text>
          을 표시한 구성원들이 많을수록 날짜의 색은 진해집니다.
        </Text>

        {/* 노란 점 예시 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 16 }}>
          <DateCell label="1" showYellowDot />
          <DateCell label="1" showYellowDot backgroundColor='white'/>
        </View>
        <Text style={{ lineHeight: 22 }}>
          1명 이상의 사람이 <Text style={{ fontWeight: '700' }}>non-preferred</Text>를 표시했을 때
          날짜 우측 하단에 노란색으로 표시됩니다.
        </Text>

        {/* 회색 처리 예시 */}
        <View style={{ marginTop: 16 }}>
          <Bubble size={36} color="#CBD5E1" />
        </View>
        <Text style={{ lineHeight: 22 }}>
          1명 이상의 사람이 <Text style={{ fontWeight: '700' }}>impossible</Text>을 표시했을 때 그 날짜는 회색처리됩니다.
        </Text>
      </ScrollView>
    </>
  );
}

/* ============== 작은 재사용 컴포넌트들 ============== */

function Pill({ label, bg }: { label: string; bg: string }) {
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function Bubble({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

function DateCell({
  label,
  showYellowDot,
  backgroundColor = '#FCA5A5',
}: {
  label: string;
  showYellowDot?: boolean;
  backgroundColor?: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
          {label}
        </Text>
      </View>
      {showYellowDot && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FACC15',
          }}
        />
      )}
    </View>
  );
}