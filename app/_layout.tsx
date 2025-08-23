import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { FriendProvider } from "./context/FriendContext";
import { GroupProvider } from "./context/GroupContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function Layout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={{ flex: 1, backgroundColor: '#fff' }}
        edges={['bottom']}
      >
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <FriendProvider>
            <GroupProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(event)" options={{ headerShown: false }} />
                <Stack.Screen name="calendarDetail" options={{ title: '일정 상세' }} />
                <Stack.Screen name="calendarNew" options={{ title: '새 일정' }} />
                <Stack.Screen name="calendarEdit" options={{ title: '일정 수정' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </GroupProvider>      
          </FriendProvider>
        </ThemeProvider>
      </SafeAreaView>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

