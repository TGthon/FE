import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

