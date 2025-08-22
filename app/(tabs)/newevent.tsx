import { View, Text, Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";

export default function AddEventScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "이벤트 추가" }} />

      <Text style={styles.label}>이벤트의 종류를 선택해주세요</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/components/onetime")}
      >
        <Text style={styles.buttonText}>일회성</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/components/multitime")}
      >
        <Text style={styles.buttonText}>다회성</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 18, fontWeight: "600", marginBottom: 40 },
  button: {
    width: "80%",
    padding: 20,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F45F62",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
