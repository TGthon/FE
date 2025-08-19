import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable, Image } from 'react-native';

export default function EventStackLayout() {
    const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: '뒤로',
        animation: Platform.select({ ios: 'slide_from_right', android: 'slide_from_right' }),
        contentStyle: { backgroundColor: '#fff' },
        headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12, marginLeft: 8,}}
            >
                <Image
                    source={require('../../assets/images/arrow-left.png')}
                    style={{ width: 12, height: 24, resizeMode: 'contain' }}
                    resizeMode="contain"
                />
            </Pressable>
        ),
      }}
    ></Stack>
  );
}
