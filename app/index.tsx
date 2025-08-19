import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResponseType } from 'expo-auth-session/build/AuthRequest.types';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
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

  const getRequestSettings = () => {
    if (Platform.OS === 'web') {
      return {
        clientId: '968643572251-2kuauukl3ja1ltr00vuigkk2qvu7bd5j.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        responseType: ResponseType.IdToken,
      }
    }
    else {
      return {
        clientId: '968643572251-2kuauukl3ja1ltr00vuigkk2qvu7bd5j.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        responseType: ResponseType.Code,
        redirectUri: "https://api.ldh.monster/api/auth/googleCallback",
        usePKCE: false,
      }
    }
  }
  const [request, response, promptAsync] = Google.useAuthRequest(getRequestSettings());
  console.log(JSON.stringify(request));
  

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

  // 로그인 응답 처리 (앱)
  useEffect(() => {
    if (Platform.OS === 'web') 
      return;
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      // console.log('Received URL:', url);
      
      const { queryParams } = Linking.parse(url);

      if (!queryParams)
        return;

      console.log('Auth code: ', queryParams.code);
      console.log('State: ', queryParams.state);

      if (typeof queryParams.code !== 'string')
        return;
      if (typeof queryParams.state !== 'string')
        return;

      const code = queryParams.code;
      try {
        const res = await fetch('https://api.ldh.monster/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `type=app&code=${encodeURIComponent(code)}`,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`서버 오류: ${res.status} ${text}`);
        }

        const data = await res.json();

        await saveSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email: data.email,
          uid: data.uid,
        });

        router.replace('/calendar');
      } catch (error) {
        console.error(error);
        Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
    return () => subscription.remove();
  }, [])

  // 로그인 응답 처리 (웹)
  useEffect(() => {
    if (Platform.OS !== 'web')
      return;

    const handleLogin = async () => {
      //alert(JSON.stringify(response));
      if (response?.type !== 'success') return;
      const idToken = response.params.id_token;
      if (!idToken) {
        Alert.alert('로그인 실패', 'ID 토큰을 가져오지 못했습니다.');
        return;
      }

      try {
        const res = await fetch('https://api.ldh.monster/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `type=web&code=${encodeURIComponent(idToken)}`,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`서버 오류: ${res.status} ${text}`);
        }

        const data = await res.json();

        await saveSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email: data.email,
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
