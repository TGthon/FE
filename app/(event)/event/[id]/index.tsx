import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function EventDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  return (
    <>
      {/* 헤더 타이틀 */}
      <Stack.Screen options={{
        title: title ?? '이벤트',
        headerTitleStyle: {
            fontSize: 24,
            fontWeight: '700',
        },
        }} />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          backgroundColor: '#fff',
        }}
      >
        {/* 날짜 선택 박스 */}
        <View style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* 상단 날짜 */}
          <View style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Mon, Aug 17</Text>
            <Pressable>
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </Pressable>
          </View>

          {/* 달력 목업 */}
          <View style={{ padding: 12 }}>
            <Text style={{ color: '#64748B', marginBottom: 6 }}>August 2025</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {['S','M','T','W','T','F','S'].map(d => (
                <Text key={d} style={{ width: 28, textAlign: 'center', color: '#94A3B8' }}>{d}</Text>
              ))}
            </View>
            {[0,1,2,3,4].map(row => (
              <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                {Array.from({ length: 7 }).map((_, col) => {
                  const day = row * 7 + col + 1;
                  const isHighlighted = [7, 12, 14, 17, 20, 22].includes(day); // 예시 하이라이트
                  return (
                    <View
                      key={col}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isHighlighted ? '#FCA5A5' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: isHighlighted ? '#fff' : '#000' }}>
                        {day <= 31 ? day : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* 투표 상태 */}
        <View style={{ gap: 10 }}>
          <StatusRow label="Preferred" color="#FCA5A5" count="0명" />
          <StatusRow label="Non-preferred" color="#FACC15" count="2명" />
          <StatusRow label="Impossible" color="#CBD5E1" count="1명" />
        </View>

        {/* 하단 아이콘 4개 */}
        <View style={{
          marginTop: 20,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <IconButton label="달력" icon="📅" />
          <IconButton label="설정" icon="📝" />
          <IconButton label="참여자" icon="👥" />
          <IconButton label="메뉴" icon="⚙️" />
        </View>

        {/* 디버그용 */}
        <Text style={{ marginTop: 16, color: '#94A3B8' }}>event id: {id}</Text>
      </ScrollView>
    </>
  );
}

function StatusRow({ label, color, count }: { label: string; color: string; count: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        backgroundColor: color,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
      }}>
        <Text style={{ fontWeight: '600' }}>{label}</Text>
      </View>
      <Text>{count}</Text>
    </View>
  );
}

function IconButton({ label, icon }: { label: string; icon: string }) {
  return (
    <Pressable style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </Pressable>
  );
}
