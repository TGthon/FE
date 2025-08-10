import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_EMAIL_KEY = 'userEmail';
const USER_ID_KEY = 'userId';

async function saveSession(data: {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  uid?: number;
}) {
  await AsyncStorage.setItem(ACCESS_KEY, data.accessToken);
  if (data.refreshToken) await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);
  if (data.email) await AsyncStorage.setItem(USER_EMAIL_KEY, data.email);
  if (typeof data.uid !== 'undefined') await AsyncStorage.setItem(USER_ID_KEY, String(data.uid)); // ✅
}

async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

type GoogleIdPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const logoY = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '968643572251-2kuauukl3ja1ltr00vuigkk2qvu7bd5j.apps.googleusercontent.com',
    androidClientId: '968643572251-jupjisf0ht3cin2mhuosp5ie7jhivjl2.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  // 로딩 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoY, {
        toValue: -120,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 로그인 응답 처리
  useEffect(() => {
    const handleLogin = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params.id_token;
      if (!idToken) {
        Alert.alert('로그인 실패', 'ID 토큰을 가져오지 못했습니다.');
        return;
      }

      const payload = jwtDecode<GoogleIdPayload>(idToken);
      const email = payload.email;
      if (!email) {
        Alert.alert('로그인 실패', '이메일을 가져오지 못했습니다.');
        return;
      }

      try {
        const res = await fetch('https://api.ldh.monster/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `type=none&code=${encodeURIComponent(email)}`,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`서버 오류: ${res.status} ${text}`);
        }

        const data = await res.json();

        await saveSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email,
          uid: data.uid,
        });

        router.replace('/calendar');
      } catch (error) {
        console.error(error);
        Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    };

    handleLogin();
  }, [response]);

  // 로그인 버튼 클릭 시
  const handlePress = async () => {
    const token = await getAccessToken();
    if (token) {
      router.replace('/calendar');
    } else {
      await promptAsync();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoY }] }]}>
        <Image source={require('../assets/images/daypick-logo.png')} style={styles.logo} />
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity style={styles.googleButton} onPress={handlePress} disabled={!request}>
          <Text style={styles.buttonText}>구글 계정으로 로그인</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logo: { width: 180, height: 180, marginBottom: 10 },
  buttonContainer: { position: 'absolute', bottom: 200 },
  googleButton: {
    backgroundColor: '#F45F62',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
