import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  Image,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { apiDeleteJSON, apiGetJSON, apiPostJSON, getAccessToken } from "../lib/api";

type FriendItem = {
  uid: string;
  name: string;
  email?: string;
  avatar?: string;
};

type GroupItem = {
  id: string;
  name: string;
  event?: string;
  members: FriendItem[];
};

export default function FriendNGroupScreen() {
  const router = useRouter();

  // 서버 데이터
  const [groups, setGroups] = useState<GroupItem[]>([
    // 필요 없으면 초기 더미는 비워도 됩니다.
    {
      id: "g1",
      name: "경희녀들",
      event: "맛집 투어",
      members: [
        { uid: "1", name: "김서연", email: "test1@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
        { uid: "2", name: "이윤서", email: "test2@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
        { uid: "3", name: "황유나", email: "test3@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
      ],
    },
  ]);
  const [friends, setFriends] = useState<FriendItem[]>([
    { uid: "1", name: "김서연", email: "test1@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
    { uid: "2", name: "이윤서", email: "test2@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
    { uid: "3", name: "황유나", email: "test3@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
    { uid: "4", name: "김동희", email: "test4@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
    { uid: "5", name: "이동현", email: "test5@gmail.com", avatar: "https://api.ldh.monster/images/default.jpg" },
  ]);

  // 모달 상태
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);

  /** ───────────── 데이터 로더 (포커스마다 실행) ───────────── */
  const loadFriends = useCallback(async () => {
    try {
      const data = await apiGetJSON<any>("/api/friends/list");
      const next = (data?.friends ?? []).map((f: any) => ({
        uid: String(f.uid),
        name: String(f.name ?? ""),
        email: f.email,
        avatar: f.picture || "https://api.ldh.monster/images/default.jpg",
      })) as FriendItem[];
      setFriends(next);
    } catch (error) {
      console.error("친구 목록 불러오기 실패:", error);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiGetJSON<any>("/api/group/grouplist");
      const grouplist = (data?.grouplist ?? []).map((group: any) => ({
        id: String(group.id),
        name: String(group.name ?? ""),
        event: group.event ?? undefined,
        // 서버가 멤버를 내려주지 않으면 빈 배열
        members: Array.isArray(group.members)
          ? group.members.map((m: any) => ({
              uid: String(m.uid),
              name: String(m.name ?? ""),
              email: m.email,
              avatar: m.picture || "https://api.ldh.monster/images/default.jpg",
            }))
          : [],
      })) as GroupItem[];
      setGroups(grouplist);
    } catch (error) {
      console.error("그룹 목록 불러오기 실패:", error);
    }
  }, []);

  // 화면에 들어올 때마다 최신 데이터로 갱신
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await Promise.all([loadFriends(), loadGroups()]);
      })();
      return () => {
        active = false;
      };
    }, [loadFriends, loadGroups])
  );

  /** ───────────── 액션들 ───────────── */

  // 그룹 추가
  const handleAddGroup = useCallback(async () => {
    if (!newGroupName.trim()) {
      Alert.alert("실패", "그룹명을 입력해주세요.");
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert("실패", "멤버를 최소 1명 선택해주세요.");
      return;
    }

    try {
      const result = await apiPostJSON<any>("/api/group/groupadd", {
        name: newGroupName,
        memberIds: selectedMembers,
      });

      // 임시로 로컬 추가
      const newGroup: GroupItem = {
        id: String(result?.groupId ?? Date.now()),
        name: newGroupName,
        members: friends.filter((f) => selectedMembers.includes(f.uid)),
      };
      setGroups((prev) => [newGroup, ...prev]);

      // 서버가 정리한 최신 상태로 다시 동기화
      await loadGroups();

      setNewGroupName("");
      setSelectedMembers([]);
      setShowAddGroupModal(false);
      Alert.alert("성공", "새 그룹이 추가되었습니다.");
    } catch (error) {
      console.error("그룹 저장 오류:", error);
      Alert.alert("실패", "그룹 저장 중 문제가 발생했습니다.");
    }
  }, [friends, newGroupName, selectedMembers, loadGroups]);

  // 그룹 나가기 (서버 API가 있다면 여기서 호출 후 loadGroups() 호출)
  const handleLeaveGroup = useCallback((groupId: string) => {
    Alert.alert("그룹 나가기", "정말 이 그룹을 나가시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "나가기",
        style: "destructive",
        onPress: async () => {
          // 로컬 즉시 반영
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
          setSelectedGroup(null);
          // TODO: await apiPostJSON('/api/group/leave', { groupId })
          // await loadGroups();
        },
      },
    ]);
  }, []);

  // 친구 추가
  const handleAddFriend = useCallback(async () => {
    if (!newFriendEmail.trim()) {
      Alert.alert("실패", "이메일을 입력해주세요.");
      return;
    }
    if (friends.find((f) => f.email === newFriendEmail)) {
      Alert.alert("실패", "이미 등록된 친구입니다.");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    try {
      const data = await apiPostJSON<any>("https://api.ldh.monster/api/friends/add", {
        friendEmail: newFriendEmail,
      });

      const addedFriend: FriendItem = {
        uid: String(data.friend.uid),
        name: String(data.friend.name ?? ""),
        email: data.friend.email,
        avatar: data.friend.picture || "https://api.ldh.monster/images/default.jpg",
      };

      // 로컬 즉시 반영
      setFriends((prev) => [addedFriend, ...prev]);

      // 서버 최신 상태로 재동기화
      await loadFriends();

      setNewFriendEmail("");
      setShowAddFriendModal(false);
      Alert.alert("성공", `${addedFriend.name}님을 친구로 추가했어요!`);
    } catch (error) {
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    }
  }, [friends, newFriendEmail, loadFriends]);

  // 친구 삭제
  const handleDeleteFriend = useCallback((friendId: string) => {
    Alert.alert("친구 삭제", "정말 이 친구를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDeleteJSON<any>(`https://api.ldh.monster/api/friends/${friendId}`);
            // 로컬 즉시 반영
            setFriends((prev) => prev.filter((f) => f.uid !== friendId));
            setSelectedFriend(null);
            // 서버 최신 상태로 재동기화
            await loadFriends();
          } catch (error) {
            Alert.alert("오류", "친구 삭제 중 문제가 발생했어요.");
            console.error("삭제 실패:", error);
          }
        },
      },
    ]);
  }, [loadFriends]);

  /** ───────────── 모달들 ───────────── */

  // 그룹 상세 팝업
  const GroupModal = () => (
    <Modal visible={!!selectedGroup} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setSelectedGroup(null)}>
        <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
            <Pressable onPress={() => selectedGroup && handleLeaveGroup(selectedGroup.id)}>
              <MaterialCommunityIcons name="exit-to-app" size={24} color="black" />
            </Pressable>
          </View>

          {/* 이벤트 이름 → 상세 페이지 이동 */}
          {selectedGroup?.event && (
            <Pressable
              onPress={() => {
                setSelectedGroup(null);
                router.push({
                  pathname: "../(event)/event/[id]",
                  params: { id: "2", title: selectedGroup.event },
                });
              }}
            >
              <Text style={[styles.subText, { color: "#F45F62", textDecorationLine: "underline" }]}>
                {selectedGroup.event}
              </Text>
            </Pressable>
          )}

          {/* 멤버 리스트 */}
          <View style={styles.memberGrid}>
            {selectedGroup?.members.map((m) => (
              <Pressable
                key={m.uid}
                style={styles.memberItem}
                onPress={() => {
                  setSelectedFriend(m);
                  setSelectedGroup(null);
                }}
              >
                <Image source={{ uri: m.avatar }} style={styles.avatarSmall} />
                <Text style={{ marginLeft: 8 }}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // 친구 상세 팝업
  const FriendModal = () => (
    <Modal visible={!!selectedFriend} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setSelectedFriend(null)}>
        <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedFriend?.name}</Text>
            <Pressable onPress={() => selectedFriend && handleDeleteFriend(selectedFriend.uid)}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="black" />
            </Pressable>
          </View>
          <Text style={styles.subText}>{selectedFriend?.email}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // 그룹 추가 모달
  const GroupAddModal = () => (
    <Modal visible={showAddGroupModal} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setShowAddGroupModal(false)}>
        <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>그룹 추가</Text>

          <TextInput
            style={styles.input}
            placeholder="그룹명 입력"
            value={newGroupName}
            onChangeText={setNewGroupName}
          />

          <ScrollView style={{ maxHeight: 200, marginVertical: 12 }}>
            {friends.map((f) => (
              <Pressable
                key={f.uid}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
                onPress={() => {
                  setSelectedMembers((prev) =>
                    prev.includes(f.uid) ? prev.filter((id) => id !== f.uid) : [...prev, f.uid]
                  );
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    marginRight: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: "#9CA3AF",
                    backgroundColor: selectedMembers.includes(f.uid) ? "#2563EB" : "transparent",
                  }}
                />
                <Text>{f.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.addEventBtn} onPress={handleAddGroup}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>그룹 만들기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      {/* 그룹 리스트 + 추가 버튼 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionTitle}>그룹</Text>
        <Pressable style={styles.addFriendBtn} onPress={() => setShowAddGroupModal(true)}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>그룹 추가</Text>
        </Pressable>
      </View>
      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <Pressable style={styles.groupCard} onPress={() => setSelectedGroup(item)}>
            <View style={styles.groupPreview}>
              {item.members.slice(0, 4).map((m) => (
                <Image key={m.uid} source={{ uri: m.avatar }} style={styles.avatarTiny} />
              ))}
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
              {item.event && <Text style={styles.subText}>{item.event}</Text>}
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* 친구 리스트 + 추가 버튼 */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
        <Text style={styles.sectionTitle}>친구</Text>
        <Pressable style={styles.addFriendBtn} onPress={() => setShowAddFriendModal(true)}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>친구 추가</Text>
        </Pressable>
      </View>
      <FlatList
        data={friends}
        renderItem={({ item }) => (
          <Pressable style={styles.friendCard} onPress={() => setSelectedFriend(item)}>
            <Image source={{ uri: item.avatar }} style={styles.avatarSmall} />
            <Text style={{ marginLeft: 12 }}>{item.name}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.uid}
      />

      {GroupModal()}
      {FriendModal()}
      {GroupAddModal()}

      {/* 기존 친구추가 모달 */}
      <Modal visible={showAddFriendModal} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setShowAddFriendModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>친구 추가</Text>
            <TextInput
              style={styles.input}
              placeholder="Gmail 입력"
              value={newFriendEmail}
              onChangeText={setNewFriendEmail}
              keyboardType="email-address"
            />
            <Pressable style={styles.addEventBtn} onPress={handleAddFriend}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>추가하기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  subText: { color: "#6B7280", fontSize: 14, marginTop: 4 },
  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  memberItem: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  groupPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 50,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarTiny: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 1,
  },
  addEventBtn: {
    marginTop: 16,
    backgroundColor: "#F45F62",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addFriendBtn: {
    backgroundColor: "#F45F62",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
});
