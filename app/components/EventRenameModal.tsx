import React from 'react';
import { Modal, Pressable, View, Text, TextInput } from 'react-native';

export default function EventRenameModal({
  visible,
  value,
  onChangeText,
  onCancel,
  onSave,
}: {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={onCancel} />
      <View
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: '30%',
          backgroundColor: 'white',
          borderRadius: 14,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>이름 변경</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="새 이름을 입력하세요"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          <Pressable onPress={onCancel} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
            <Text>취소</Text>
          </Pressable>
          <Pressable onPress={onSave} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
            <Text style={{ color: '#2563eb', fontWeight: '700' }}>저장</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
