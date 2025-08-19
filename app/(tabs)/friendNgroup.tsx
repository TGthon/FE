// app/(tabs)/friendNgroup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  Image,
  StyleSheet,
  Alert,
  TextInput
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import axios from "axios";

import { getAuth } from "firebase/auth";

const auth = getAuth();
const user = auth.currentUser;


type FriendItem = {
  id: string;
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

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");

  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: "g1",
      name: "경희녀들",
      event: "맛집 투어",
      members: [
        { id: "u1", name: "김서연", email: "test1@gmail.com", avatar: "https://via.placeholder.com/80" },
        { id: "u2", name: "이윤서", email: "test2@gmail.com", avatar: "https://via.placeholder.com/80" },
        { id: "u3", name: "황유나", email: "test3@gmail.com", avatar: "https://via.placeholder.com/80" },
      ],
    },
  ]);

  const [friends, setFriends] = useState<FriendItem[]>([
    { id: "u1", name: "김서연", email: "test1@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u2", name: "이윤서", email: "test2@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u3", name: "황유나", email: "test3@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u4", name: "김동희", email: "test4@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u5", name: "이동현", email: "test5@gmail.com", avatar: "https://via.placeholder.com/80" },
  ]);

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

    try {
      let response

      if (user) {
        response = await axios.post("http://localhost:3000/friends/add", {
          userEmail: user.email, // 로그인한 사용자 이메일을 동적으로 가져옴
          friendEmail: newFriendEmail,
        });
      }

      const addedFriend = response?.data?.friend;

      setFriends((prev) => [...prev, addedFriend]);
      setNewFriendEmail("");
      setShowAddFriendModal(false);
      Alert.alert("성공", `${addedFriend.name}님을 친구로 추가했어요!`);
    } catch (error: any) {
      Alert.alert("오류", error.response?.data?.message || "친구 추가 실패");
    }

    // 임시로 "존재한다"고 가정 (실제 서비스면 서버에서 확인 필요)
    const newFriend: FriendItem = {
      id: Date.now().toString(),
      name: newFriendEmail.split("@")[0], // 이메일 앞부분을 이름처럼 사용
      email: newFriendEmail,
      avatar: "https://via.placeholder.com/80",
    };

    setFriends((prev) => [...prev, newFriend]);
    setNewFriendEmail("");
    setShowAddFriendModal(false);
  };

  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);

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

  const handleDeleteFriend = (friendId: string) => {
    Alert.alert("친구 삭제", "정말 이 친구를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setFriends((prev) => prev.filter((f) => f.id !== friendId));
          setSelectedFriend(null);
        },
      },
    ]);
  };


  // 그룹 상세 팝업
  const GroupModal = () => (
    <Modal visible={!!selectedGroup} animationType="slide" transparent>
      {/* 바깥 회색 배경 */}
      <Pressable style={styles.overlay} onPress={() => setSelectedGroup(null)}>

        {/* 안쪽 박스 (닫힘 방지) */}
        <Pressable
          style={styles.modalBox}
          onPress={(e) => e.stopPropagation()}  // 👈 클릭 이벤트 전파 막기
        >
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
            <Pressable onPress={() => selectedGroup &&
              handleLeaveGroup(selectedGroup!.id)}>
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

          {/* 멤버 리스트 (2명씩 배치) */}
          <View style={styles.memberGrid}>
            {selectedGroup?.members.map((m) => (
              <Pressable
                key={m.id}
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


          {/* ✅ 새 이벤트 만들기 버튼 */}
          <Pressable
            style={styles.addEventBtn}
            onPress={() => {
              setSelectedGroup(null); // 팝업 닫고
              router.push("/(tabs)/newevent"); // 같은 폴더의 newevent.tsx 로 이동
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>새 이벤트 만들기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // 친구 상세 팝업
  const FriendModal = () => (
    <Modal visible={!!selectedFriend} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setSelectedFriend(null)}>
        <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedFriend?.name}</Text>
            <Pressable onPress={() => selectedFriend && handleDeleteFriend(selectedFriend!.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="black" />
            </Pressable>

          </View>

          {/* 이메일 */}
          <Text style={styles.subText}>{selectedFriend?.email}</Text>

          {/* 참여 이벤트 리스트 */}
          <View style={{ marginTop: 12 }}>
            {[
              { id: "2", title: "맛집 투어", date: "07-27 오전 1:00" },
              { id: "3", title: "스터디 모임", date: "07-29 오후 8:00" },
            ].map((ev) => (
              <Pressable
                key={ev.id}
                onPress={() => {
                  setSelectedFriend(null);
                  router.push({
                    pathname: "../(event)/event/[id]",
                    params: { id: ev.id, title: ev.title },
                  });
                }}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color="#6B7280"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontSize: 15, color: "#F45F62", fontWeight: "600" }}>
                  {ev.title} ({ev.date})
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ✅ 새 이벤트 만들기 버튼 */}
          <Pressable
            style={styles.addEventBtn}
            onPress={() => {
              setSelectedGroup(null); // 팝업 닫고
              router.push("/(tabs)/newevent"); // 같은 폴더의 newevent.tsx 로 이동
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>새 이벤트 만들기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      {/* 그룹 리스트 */}
      <Text style={styles.sectionTitle}>그룹</Text>
      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <Pressable style={styles.groupCard} onPress={() => setSelectedGroup(item)}>
            <View style={styles.groupPreview}>
              {item.members.slice(0, 4).map((m) => (
                <Image key={m.id} source={{ uri: m.avatar }} style={styles.avatarTiny} />
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

      {/* 친구 리스트 */}
      {/* <Text style={[styles.sectionTitle, { marginTop: 24 }]}>친구</Text> */}
      {/* <FlatList
        data={friends}
        renderItem={({ item }) => (
          <Pressable style={styles.friendCard} onPress={() => setSelectedFriend(item)}>
            <Image source={{ uri: item.avatar }} style={styles.avatarSmall} />
            <Text style={{ marginLeft: 12 }}>{item.name}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* 친구 리스트 + 친구추가 버튼 */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
        <Text style={styles.sectionTitle}>친구</Text>
        <Pressable
          style={styles.addFriendBtn}
          onPress={() => setShowAddFriendModal(true)}
        >
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
        keyExtractor={(item) => item.id}
      />


      {GroupModal()}
      {FriendModal()}

      {/* ✅ 친구추가 모달 */}
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
  sectionTitle: { fontSize: 18, fontWeight: "700" as const },
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

