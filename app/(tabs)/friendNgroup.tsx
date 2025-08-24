import React, { useEffect, useState } from "react";
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
import { getAccessToken } from "../lib/api";

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
  useEffect(() => {
    const fetchFriends = async () => {
      const token = await getAccessToken();
      console.log("보내는 토큰:", token);
      if (!token) {
        console.warn("토큰 없음: 로그인 필요");
        return;
      }

      try {
        const res = await fetch("https://api.ldh.monster/api/friends/list", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          const text = await res.text(); // HTML 에러 페이지일 수 있음
          throw new Error(`서버 오류: ${res.status}\n${text}`);
        }

        const data = await res.json();
        setFriends(data.friends); // 프론트 상태에 저장
      } catch (error) {
        console.error("친구 목록 불러오기 실패:", error);
      }
    };

    fetchFriends();
  }, []);

  const router = useRouter();

  // 친구/그룹 데이터
  const [groups, setGroups] = useState<GroupItem[]>([
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


  // 그룹 추가
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("실패", "그룹명을 입력해주세요.");
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert("실패", "멤버를 최소 1명 선택해주세요.");
      return;
    }

    try {
    const token = await getAccessToken();
    const response = await fetch("https://api.ldh.monster/api/friends/groupadd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        name: newGroupName,
        memberIds: selectedMembers, // ["u1", "u2", ...]
      }),
    });

    if (!response.ok) {
      throw new Error("그룹 저장 실패");
    }

    const result = await response.json();

    // 서버에서 저장된 그룹 정보 반환 시 사용
    const newGroup: GroupItem = {
      id: result.groupId, // 서버에서 생성된 ID
      name: newGroupName,
      members: friends.filter((f) => selectedMembers.includes(f.uid)),
    };

    setGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setSelectedMembers([]);
    setShowAddGroupModal(false);
    Alert.alert("성공", "새 그룹이 추가되었습니다.");
  } catch (error) {
    console.error("그룹 저장 오류:", error);
    Alert.alert("실패", "그룹 저장 중 문제가 발생했습니다.");
  }
};


  // 그룹 나가기
  const handleLeaveGroup = (groupId: string) => {
    Alert.alert("그룹 나가기", "정말 이 그룹을 나가시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "나가기",
        style: "destructive",
        onPress: () => {
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
          setSelectedGroup(null);
        },
      },
    ]);
  };

  // 친구 추가
  const handleAddFriend = async () => {
    if (!newFriendEmail.trim()) {
      Alert.alert("실패", "이메일을 입력해주세요.");
      return;
    }

    const exists = friends.find((f) => f.email === newFriendEmail);
    if (exists) {
      Alert.alert("실패", "이미 등록된 친구입니다.");
      return;
    }

    const token = await getAccessToken();
    console.log("토큰:", token);

    if (!token) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch("https://api.ldh.monster/api/friends/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendEmail: newFriendEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("오류", data.message || "친구 추가 실패");
        return;
      }

      const addedFriend = data.friend;

      setFriends((prev) => [...prev, addedFriend]);
      setNewFriendEmail("");
      setShowAddFriendModal(false);
      Alert.alert("성공", `${addedFriend.name}님을 친구로 추가했어요!`);
    } catch (error) {
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    }
  };


  // 친구 삭제
  const handleDeleteFriend = (friendId: string) => {
    Alert.alert("친구 삭제", "정말 이 친구를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            // 백엔드에 삭제 요청
            const token = await getAccessToken();
            await fetch(`https://api.ldh.monster/api/friends/${friendId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },

            });

            // 프론트 상태에서도 제거
            setFriends((prev) => prev.filter((f) => f.uid !== friendId));
            setSelectedFriend(null);
          } catch (error) {
            Alert.alert("오류", "친구 삭제 중 문제가 발생했어요.");
            console.error("삭제 실패:", error);
          }
        },
      }
    ]);
  };

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
