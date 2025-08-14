import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function EventStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: '뒤로',
        animation: Platform.select({ ios: 'slide_from_right', android: 'slide_from_right' }),
        contentStyle: { backgroundColor: '#fff' },
      }}
    ></Stack>
  );
}
