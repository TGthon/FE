import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';

type Props = {
    id: string;
    title: string;
    people: number;
    status: '투표 전' | '투표 완료';
    date?: string;
    onPress?: () => void;
    onRename?: () => void;
    onDelete?: (id: string) => void;
}

export default function EventCard({
  id, title, people, status, date, onPress, onRename, onDelete,
}: Props) {
  const anchorRef = useRef<View>(null);
  const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const openMenu = () => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      const { width: W } = Dimensions.get('window');
      const menuWidth = 180;
      const padding = 8;
      const left = Math.max(padding, Math.min(x + w - menuWidth, W - menuWidth - padding));
      setMenu({ visible: true, x: left, y: y + h + 4 });
    });
  };
  const closeMenu = () => setMenu((m) => ({ ...m, visible: false }));

  const isDone = status === '투표 완료';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* 헤더 영역 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>{title}</Text>
          <Text style={{ color: '#9AA0A6', marginTop: 2 }}>{people}명</Text>
        </View>

        {/* 점 3개 버튼 (앵커) */}
        <Pressable ref={anchorRef} onPress={openMenu} hitSlop={10} style={{ padding: 4 }}>
          <Text style={{ fontSize: 20 }}>⋯</Text>
        </Pressable>
      </View>

      {/* 하단 상태/날짜 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ color: isDone ? '#16a34a' : '#ef4444', fontWeight: '700' }}>
          {status}
        </Text>
        {isDone && !!date && <Text style={{ color: '#9AA0A6' }}>{date} 확정</Text>}
      </View>

      {/* 팝업 메뉴 */}
      <Modal visible={menu.visible} transparent animationType="fade" onRequestClose={closeMenu}>
        {/* 반투명 배경 + 바깥 클릭 시 닫기 */}
        <Pressable style={{ flex: 1 }} onPress={closeMenu}>
          <View />
        </Pressable>

        {/* 메뉴 박스 (좌표로 절대 배치) */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: menu.y,
            left: menu.x,
            width: 180,
            backgroundColor: 'white',
            borderRadius: 12,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <Pressable
            onPress={() => { closeMenu(); onRename?.(); }}
            style={{ paddingVertical: 12, paddingHorizontal: 14 }}
            android_ripple={{ borderless: false }}
          >
            <Text style={{ fontSize: 16, }}>이름 변경</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

          <Pressable
            onPress={() => { closeMenu(); onDelete?.(id); }}
            style={{ paddingVertical: 12, paddingHorizontal: 14 }}
            android_ripple={{ borderless: false }}
          >
            <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '600' }}>그룹 삭제</Text>
          </Pressable>
        </View>
      </Modal>
    </Pressable>
  );
}
