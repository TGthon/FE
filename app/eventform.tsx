import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Image } from "react-native";
import { Stack, useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useState } from "react";
import { useFriends } from "./context/FriendContext";   // ✅ 친구목록 Context 사용
import { useGroups } from "./context/GroupContext"; 

export default function EventForm({ title, isMulti = false,}: { title: string; isMulti?:boolean; }) {
  const router = useRouter();
  const { friends } = useFriends(); // ✅ 전역 친구목록 불러오기
  const { groups } = useGroups();

  // 이벤트 이름
  const [eventName, setEventName] = useState("");

  // 날짜
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  //주기
  const [repeatType, setRepeatType] = useState<"weekly" | "biweekly" | "monthly" | "custom" | null>(null);
  const [customInterval, setCustomInterval] = useState<number | null>(null); // 며칠마다
  const [repeatCount, setRepeatCount] = useState<number | null>(null);       // 몇 번 반복

  // 참여자
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<{ id: string; name: string; type: "friend" | "group" }[]>([]);

  // 시간
  const [duration, setDuration] = useState<{ hours: number | null; minutes: number | null }>({
    hours: null,
    minutes: null,
  });

  // 날짜 포맷
  const formatDate = (d: Date | null) =>
    d ? d.toISOString().split("T")[0] : "날짜 선택";

// 검색 대상 = 친구 + 그룹
  const searchPool = [
    ...friends.map(f => ({ id: f.id, name: f.name, type: "friend" as const })),
    ...groups.map(g => ({ id: g.id, name: g.name, type: "group" as const })),
  ];

  // 필터링 (query 입력해야만 결과가 보임)
  const filtered = query.length > 0
    ? searchPool.filter(item =>
        item.name.includes(query) &&
        !participants.find(p => p.id === item.id && p.type === item.type)
      )
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen options={{ 
        title,
        headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12 }}>
              <Image
                source={require("../assets/images/arrow-left.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
          ),
        }} />

      {/* 스크롤 영역 */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* 이벤트 이름 */}
        <Text style={styles.label}>이벤트 이름</Text>
        <TextInput
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
          placeholder="이벤트 이름 입력"
          placeholderTextColor="#9CA3AF"
        />

        {/* 날짜 범위 */}
        <Text style={styles.label}>날짜 범위</Text>
        <View style={styles.row}>
          <Pressable style={styles.input} onPress={() => setStartPickerVisible(true)}>
            <Text>{formatDate(startDate)}</Text>
          </Pressable>

          <Text style={{ marginHorizontal: 8 }}>~</Text>

          <Pressable style={styles.input} onPress={() => setEndPickerVisible(true)}>
            <Text>{formatDate(endDate)}</Text>
          </Pressable>
        </View>

        {/* 모달 달력 */}
        <DateTimePickerModal
          isVisible={isStartPickerVisible}
          mode="date"
          onConfirm={(date: Date) => {
            setStartDate(date);
            setStartPickerVisible(false);
          }}
          onCancel={() => setStartPickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={isEndPickerVisible}
          mode="date"
          onConfirm={(date: Date) => {
            setEndDate(date);
            setEndPickerVisible(false);
          }}
          onCancel={() => setEndPickerVisible(false)}
        />

        {/* ✅ 다회성 이벤트에서만 주기 영역 */}
        {isMulti && (
          <>
            <Text style={styles.label}>주기</Text>
            <Text style={[{ marginBottom: 8 }, {color:"#9CA3AF"}]}>얼마나 자주 이벤트를 진행하실 예정인가요?</Text>

            {/* 반복 주기 선택 */}
            <View style={styles.row}>
              <Pressable style={[
                  styles.dropdown,
                  repeatType === "weekly" && { backgroundColor: "#F45F62" }
                ]} onPress={() => setRepeatType("weekly")}>
                <Text style={repeatType === "weekly" && { color: "#fff" }}> 매주</Text>
              </Pressable>
              <Pressable style={[
                  styles.dropdown,
                  repeatType === "biweekly" && { backgroundColor: "#F45F62" }
                ]} onPress={() => setRepeatType("biweekly")}>
                <Text style={repeatType === "biweekly" && { color: "#fff" }}>격주</Text>
              </Pressable>
              <Pressable style={[
                  styles.dropdown,
                  repeatType === "monthly" && { backgroundColor: "#F45F62" }
                ]} onPress={() => setRepeatType("monthly")}>
                <Text style={repeatType === "monthly" && { color: "#fff" }}>매달</Text>
              </Pressable>
              <Pressable style={[
                  styles.dropdown,
                  repeatType === "custom" && { backgroundColor: "#F45F62" }
                ]} onPress={() => setRepeatType("custom")}>
                <Text style={repeatType === "custom" && { color: "#fff" }}>직접 입력</Text>
              </Pressable>
            </View>

            {/* 직접 입력일 때만 노출 */}
            {repeatType === "custom" && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <TextInput
                  style={[styles.inputSmall, { flex: 0 }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={customInterval ? String(customInterval) : ""}
                  onChangeText={(t) => setCustomInterval(t ? parseInt(t) : null)}
                />
                <Text style={{ marginHorizontal: 6 }}>일마다</Text>
              </View>
            )}

            {/* 반복 횟수 */}
            <View style={[styles.row, { marginTop: 12 }]}>
              <TextInput
                style={[styles.inputSmall, { flex: 0 }]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={repeatCount ? String(repeatCount) : ""}
                onChangeText={(t) => setRepeatCount(t ? parseInt(t) : null)}
              />
              <Text style={{ marginLeft: 6 }}>번 반복</Text>
            </View>
          </>
        )}

        {/* 참여자 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.label}>참여자</Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF" }}>그룹 또는 친구에서 추가</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="이름 검색"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
        />

        {/* 검색 결과 (입력했을 때만) */}
        {filtered.map((item) => (
          <Pressable
            key={item.type + item.id}
            style={{ padding: 8 }}
            onPress={() => {
              setParticipants([...participants, item]);
              setQuery("");
            }}
          >
            <Text style={ item.type === "group"
              ? { fontWeight: "bold", fontSize: 16 }   // ✅ 그룹은 두꺼운 글씨
              : { fontSize: 16 }
            }>
              {item.name}
            </Text>
          </Pressable>
        ))}

        {/* 선택된 참여자 */}
        {participants.map((p, idx) => (
          <View
            key={p.type + p.id}
            style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}
          >
            {/* 앞에 X 아이콘 */}
            <Pressable
              onPress={() =>
                setParticipants((prev) => prev.filter((x) => !(x.id === p.id && x.type === p.type)))
              }
            >
              <Image
                source={require("../assets/images/x-icon.png")}
                style={{ width: 16, height: 16, marginRight: 6 }}
              />
            </Pressable>
            <Text style={ p.type === "group"
              ? { fontWeight: "bold", fontSize: 16 }   // ✅ 그룹은 두꺼운 글씨
              : { fontSize: 16 }
            }>
              {p.name}
            </Text>
          </View>
        ))}



        {/* 소요 시간 */}
        <Text style={styles.label}>예상 소요 시간</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.inputSmall, { color: "#9CA3AF" }]}
            keyboardType="numeric"
            value={duration.hours !== null ? String(duration.hours) : ""}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            onChangeText={(t) =>
              setDuration((d) => ({ ...d, hours: t ? parseInt(t) : null }))
            }
          />
          <Text>시간</Text>
          <TextInput
            style={[styles.inputSmall, { color: "#9CA3AF" }]}
            keyboardType="numeric"
            value={duration.minutes !== null ? String(duration.minutes) : ""}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            onChangeText={(t) =>
              setDuration((d) => ({ ...d, minutes: t ? parseInt(t) : null }))
            }
          />
          <Text>분</Text>
        </View>
      </ScrollView>

      {/* 고정 버튼 */}
      <View style={styles.footer}>
        <Pressable style={styles.cancel} onPress={() => router.back()}>
          <Text style={styles.footerText}>취소</Text>
        </Pressable>
        <Pressable 
          style={styles.confirm} 
          onPress={() => {
            if (!eventName.trim()) {
              alert("이벤트 이름을 입력해주세요.");
              return;
            }
            if (!startDate || !endDate) {
              alert("날짜 범위를 선택해주세요.");
              return;
            }
            if (participants.length === 0) {
              alert("참여자를 한 명 이상 추가해주세요.");
              return;
            }
            if (duration.hours === null && duration.minutes === null) {
              alert("예상 소요 시간을 입력해주세요.");
              return;
            }

          alert("저장 완료!");
          router.push("/(tabs)/newevent")
          }}>
          <Text style={[styles.footerText, { color: "#fff" }]}>완료</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  inputSmall: {
    width: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 6,
    textAlign: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  cancel: {
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F45F62",
  },
  confirm: {
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F45F62",
  },
  footerText: { fontSize: 16, fontWeight: "700" },
});
