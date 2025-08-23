import React, { useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { useFriends } from "./context/FriendContext";
import { useGroups } from "./context/GroupContext";

/* ───────── 공용 컴포넌트 ───────── */

const Input = memo((props: React.ComponentProps<typeof TextInput>) => {
  const { style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      placeholderTextColor="#9CA3AF"
      style={[
        {
          borderWidth: 1,
          borderColor: "#9CA3AF",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 16,
          color: "#111827",
          backgroundColor: "#FFFFFF",
        },
        style,
      ]}
    />
  );
});

const SectionDivider = memo(() => (
  <View style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 }} />
));

const Pill = memo(function PillComp({
  active,
  label,
  onPress,
  accent = "#F43F5E",
  border = "#9CA3AF",
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  accent?: string;
  border?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: active ? 0 : 1,
        borderColor: active ? "transparent" : border,
        backgroundColor: active ? accent : "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111827", fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
});

/* ───────── 유틸 ───────── */
function mergeUnique<T extends { id: string; type: string }>(a: T[], b: T[]) {
  const map = new Map<string, T>();
  [...a, ...b].forEach((it) => map.set(it.type + it.id, it));
  return Array.from(map.values());
}

/* ───────── 본문 ───────── */

export default function EventForm({
  title,
  isMulti = false,
}: {
  title: string;
  isMulti?: boolean;
}) {
  const router = useRouter();
  const { friends } = useFriends();
  const { groups } = useGroups();

  // 이벤트 이름
  const [eventName, setEventName] = useState("");

  // 날짜
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // 주기
  const [repeatType, setRepeatType] = useState<
    "weekly" | "biweekly" | "monthly" | "custom" | null
  >(null);
  const [customInterval, setCustomInterval] = useState<number | null>(null);
  const [repeatCount, setRepeatCount] = useState<number | null>(null);

  // 참여자
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<
    { id: string; name: string; type: "friend" | "group" }[]
  >([]);

  // 친구/그룹 선택 모달
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<
    { id: string; name: string; type: "friend" | "group" }[]
  >([]);

  // 시간
  const [duration, setDuration] = useState<{ hours: number | null; minutes: number | null }>({
    hours: null,
    minutes: null,
  });

  // 날짜 포맷
  const formatDate = (d: Date | null) => (d ? d.toISOString().split("T")[0] : "날짜 선택");

  // 검색 대상 = 친구 + 그룹
  const friendPool = friends.map((f) => ({ id: f.id, name: f.name, type: "friend" as const }));
  const groupPool = groups.map((g) => ({ id: g.id, name: g.name, type: "group" as const }));

  // 필터링 (query 입력해야만 결과가 보임)
  const trimmed = query.trim();
  const friendMatches =
    trimmed.length > 0 ? friendPool.filter((it) => it.name.includes(trimmed)) : [];
  const groupMatches =
    trimmed.length > 0 ? groupPool.filter((it) => it.name.includes(trimmed)) : [];

  // 모달 열기
  const openSelectModal = () => {
    setSelected([]);
    setModalVisible(true);
  };

  // 모달에서 선택 추가
  const addSelectedMembers = () => {
    setParticipants((prev) => mergeUnique(prev, selected));
    setModalVisible(false);
  };

  // Enter(Submit) 시: 매칭이 정확히 1명일 때 자동 추가
  const handleMemberInputSubmit = () => {
    const combined = [...friendMatches, ...groupMatches].filter(
      (m) => !participants.find((p) => p.id === m.id && p.type === m.type)
    );
    if (combined.length === 1) {
      setParticipants((prev) => mergeUnique(prev, [combined[0]]));
      setQuery("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen
        options={{
          title,
          headerTitleAlign: "center",
          headerTitleStyle: { fontSize: 24, fontWeight: "700" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12 }}>
              <Image
                source={require("../assets/images/arrow-left.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        {/* 스크롤 영역 */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
          {/* 이벤트 이름 */}
          <Text style={styles.sectionTitle}>이벤트 이름</Text>
          <Input
            value={eventName}
            onChangeText={setEventName}
            placeholder="이벤트 이름을 입력해주세요."
            returnKeyType="done"
          />

          {/* 날짜 범위 */}
          <SectionDivider />
          <Text style={styles.sectionTitle}>날짜 범위</Text>

          {/* 가운데 정렬 */}
          <View style={[styles.row, { justifyContent: "center", columnGap: 12 }]}>
            <Pressable style={styles.datePill} onPress={() => setStartPickerVisible(true)}>
              <Ionicons name="calendar-outline" size={18} color="#111827" />
              <Text style={styles.datePillText}>{formatDate(startDate)}</Text>
            </Pressable>

            <Text style={{ color: "#6B7280" }}>→</Text>

            <Pressable style={styles.datePill} onPress={() => setEndPickerVisible(true)}>
              <Ionicons name="calendar-outline" size={18} color="#111827" />
              <Text style={styles.datePillText}>{formatDate(endDate)}</Text>
            </Pressable>
          </View>

          {/* 모달 달력 */}
          <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="date"
            onConfirm={(date: Date) => {
              setStartDate(date);
              setStartPickerVisible(false);
              if (endDate && date > endDate) setEndDate(date);
            }}
            onCancel={() => setStartPickerVisible(false)}
          />
          <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="date"
            onConfirm={(date: Date) => {
              setEndDate(date);
              setEndPickerVisible(false);
              if (startDate && date < startDate) setStartDate(date);
            }}
            onCancel={() => setEndPickerVisible(false)}
          />

          {/* ✅ 다회성 이벤트에서만 주기 영역 */}
          {isMulti && (
            <>
              <SectionDivider />
              <Text style={styles.sectionTitle}>주기</Text>
              <Text style={{ marginBottom: 8, color: "#6B7280" }}>
                얼마나 자주 이벤트를 진행하실 예정인가요?
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <Pill active={repeatType === "weekly"} label="매주" onPress={() => setRepeatType("weekly")} />
                <Pill active={repeatType === "biweekly"} label="격주" onPress={() => setRepeatType("biweekly")} />
                <Pill active={repeatType === "monthly"} label="매달" onPress={() => setRepeatType("monthly")} />
                <Pill active={repeatType === "custom"} label="직접 입력" onPress={() => setRepeatType("custom")} />
              </View>

              {repeatType === "custom" && (
                <View style={[styles.row, { marginTop: 12 }]}>
                  <Input
                    keyboardType="numeric"
                    placeholder="0"
                    value={customInterval ? String(customInterval) : ""}
                    onChangeText={(t) => setCustomInterval(t ? parseInt(t, 10) : null)}
                    style={{ width: 80, textAlign: "center" }}
                  />
                  <Text style={{ marginLeft: 8, color: "#111827", fontWeight: "600" }}>일마다</Text>
                </View>
              )}

              <View style={[styles.row, { marginTop: 12 }]}>
                <Input
                  keyboardType="numeric"
                  placeholder="0"
                  value={repeatCount ? String(repeatCount) : ""}
                  onChangeText={(t) => setRepeatCount(t ? parseInt(t, 10) : null)}
                  style={{ width: 80, textAlign: "center" }}
                />
                <Text style={{ marginLeft: 8, color: "#111827", fontWeight: "600" }}>번 반복</Text>
              </View>
            </>
          )}

          {/* 참여자 */}
          <SectionDivider />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>참여자</Text>

            {/* 버튼 -> 모달 오픈 */}
            <Pressable
              onPress={openSelectModal}
              style={{
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#111827", fontWeight: "600" }}>그룹 또는 친구에서 추가</Text>
            </Pressable>
          </View>

          {/* 직접 입력 + 자동 제안 */}
          <Input
            placeholder="참여자 이름 직접 입력"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleMemberInputSubmit}
          />

          {/* 제안 카드 */}
          {trimmed.length > 0 && (
            <View style={styles.resultCard}>
              {friendMatches.length === 0 && groupMatches.length === 0 ? (
                <Text style={styles.resultEmpty}>일치하는 친구/그룹이 없어요.</Text>
              ) : (
                <>
                  {/* 친구 섹션 */}
                  {friendMatches.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.resultHeader}>친구</Text>
                      {friendMatches.map((f) => {
                        const disabled = participants.some((p) => p.id === f.id && p.type === "friend");
                        return (
                          <Pressable
                            key={`friend-${f.id}`}
                            onPress={() => {
                              if (disabled) return;
                              setParticipants((prev) => mergeUnique(prev, [f]));
                              setQuery("");
                            }}
                            style={styles.resultRow}
                          >
                            <Ionicons
                              name="person-outline"
                              size={18}
                              color={disabled ? "#9CA3AF" : "#111827"}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={[styles.resultText, disabled && { color: "#9CA3AF" }]}>{f.name}</Text>
                            {disabled && <Text style={styles.badge}>추가됨</Text>}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* 그룹 섹션 */}
                  {groupMatches.length > 0 && (
                    <View>
                      <Text style={styles.resultHeader}>그룹</Text>
                      {groupMatches.map((g) => {
                        const disabled = participants.some((p) => p.id === g.id && p.type === "group");
                        return (
                          <Pressable
                            key={`group-${g.id}`}
                            onPress={() => {
                              if (disabled) return;
                              setParticipants((prev) => mergeUnique(prev, [g]));
                              setQuery("");
                            }}
                            style={styles.resultRow}
                          >
                            <Ionicons
                              name="people-outline"
                              size={18}
                              color={disabled ? "#9CA3AF" : "#2563EB"}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={[styles.resultText, disabled && { color: "#9CA3AF" }]}>{g.name}</Text>
                            {disabled && <Text style={styles.badge}>추가됨</Text>}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* 선택된 참여자 (칩) */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {participants.map((p) => (
              <View
                key={p.type + p.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={
                    p.type === "group"
                      ? { fontWeight: "700", fontSize: 14, marginRight: 6, color: "#111827" }
                      : { fontSize: 14, marginRight: 6, color: "#111827" }
                  }
                >
                  {p.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setParticipants((prev) =>
                      prev.filter((x) => !(x.id === p.id && x.type === p.type))
                    )
                  }
                >
                  <Ionicons name="close-circle" size={18} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* 소요 시간 */}
          <SectionDivider />
          <Text style={styles.sectionTitle}>예상 소요 시간</Text>
          <View style={{ flexDirection: "row", alignItems: "center", columnGap: 8 }}>
            <Input
              keyboardType="numeric"
              value={duration.hours !== null ? String(duration.hours) : ""}
              placeholder="0"
              onChangeText={(t) => setDuration((d) => ({ ...d, hours: t ? parseInt(t, 10) : null }))}
              style={{ width: 80, textAlign: "center" }}
            />
            <Text style={{ color: "#111827", fontWeight: "600" }}>시간</Text>
            <Input
              keyboardType="numeric"
              value={duration.minutes !== null ? String(duration.minutes) : ""}
              placeholder="0"
              onChangeText={(t) => setDuration((d) => ({ ...d, minutes: t ? parseInt(t, 10) : null }))}
              style={{ width: 80, textAlign: "center" }}
            />
            <Text style={{ color: "#111827", fontWeight: "600" }}>분</Text>
          </View>
        </ScrollView>

        {/* 고정 하단 버튼 */}
        <View style={styles.footerBar}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              style={({ pressed }) => [
                styles.btnGhost,
                { backgroundColor: pressed ? "#F3F4F6" : "#fff" },
              ]}
              onPress={() => router.back()}
            >
              <Text style={{ color: "#111827", fontWeight: "700" }}>취소</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: pressed ? "#fb7185" : "#F43F5E" },
              ]}
              onPress={() => {
                if (!eventName.trim()) {
                  Alert.alert("이벤트 이름을 입력해주세요.");
                  return;
                }
                if (!startDate || !endDate) {
                  Alert.alert("날짜 범위를 선택해주세요.");
                  return;
                }
                if (isMulti) {
                  if (!repeatType) {
                    Alert.alert("주기를 선택해주세요.");
                    return;
                  }
                  if (repeatType === "custom" && !customInterval) {
                    Alert.alert("직접 입력 주기의 일 수를 입력해주세요.");
                    return;
                  }
                }
                if (participants.length === 0) {
                  Alert.alert("참여자를 한 명 이상 추가해주세요.");
                  return;
                }
                if (duration.hours === null && duration.minutes === null) {
                  Alert.alert("예상 소요 시간을 입력해주세요.");
                  return;
                }

                Alert.alert("저장 완료!");
                router.push("/(tabs)/newevent");
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>완료</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 친구/그룹 선택 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "#fff", borderRadius: 18, padding: 18, maxHeight: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>친구/그룹 선택</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={{ fontWeight: "700", marginBottom: 6 }}>친구</Text>
              {friends.length === 0 && <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>친구 없음</Text>}
              {friends.map((f) => {
                const isOn = selected.some((s) => s.id === f.id && s.type === "friend");
                return (
                  <Pressable
                    key={`friend-${f.id}`}
                    onPress={() =>
                      setSelected((prev) =>
                        isOn
                          ? prev.filter((p) => !(p.id === f.id && p.type === "friend"))
                          : [...prev, { id: f.id, name: f.name, type: "friend" as const }]
                      )
                    }
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}
                  >
                    <Ionicons
                      name={isOn ? "checkbox" : "square-outline"}
                      size={20}
                      color="#F43F5E"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 16 }}>{f.name}</Text>
                  </Pressable>
                );
              })}

              <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 6 }}>그룹</Text>
              {groups.length === 0 && <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>그룹 없음</Text>}
              {groups.map((g) => {
                const isOn = selected.some((s) => s.id === g.id && s.type === "group");
                return (
                  <Pressable
                    key={`group-${g.id}`}
                    onPress={() =>
                      setSelected((prev) =>
                        isOn
                          ? prev.filter((p) => !(p.id === g.id && p.type === "group"))
                          : [...prev, { id: g.id, name: g.name, type: "group" as const }]
                      )
                    }
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}
                  >
                    <Ionicons
                      name={isOn ? "checkbox" : "square-outline"}
                      size={20}
                      color="#2563EB"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 16 }}>{g.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 18 }}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: 16,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "600" }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={addSelectedMembers}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: 16,
                  backgroundColor: "#F43F5E",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>추가하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
    marginTop: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },

  datePill: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
  },
  datePillText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  /* 제안 리스트 */
  resultCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  resultHeader: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "700",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  resultText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  resultEmpty: {
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 6,
  },
  badge: {
    fontSize: 12,
    color: "#9CA3AF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F43F5E",
  },
});
