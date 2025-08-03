import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
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

export default function LoginScreen() {
  const router = useRouter();
  const logoY = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '968643572251-2kuauukl3ja1ltr00vuigkk2qvu7bd5j.apps.googleusercontent.com',
    androidClientId: '968643572251-jupjisf0ht3cin2mhuosp5ie7jhivjl2.apps.googleusercontent.com',
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  });

  // 로딩 시 애니메이션 실행
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
      if (!idToken) return;

      try {
        const res = await fetch('https://api.ldh.monster/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `type=${Platform.OS}&code=${encodeURIComponent(idToken)}`,
        });

        if (!res.ok) throw new Error('서버 오류');

        const data = await res.json();

        // 로그인 성공 기록 저장
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // 캘린더 화면으로 이동
        router.replace('/calendar');
      } catch (err) {
        Alert.alert('로그인 실패', '서버와 통신 중 오류가 발생했습니다.');
      }
    };

    handleLogin();
  }, [response]);

  // 로그인 버튼 클릭 시
  const handlePress = async () => {
    try {
      const saved = await AsyncStorage.getItem('isLoggedIn');

      if (saved === 'true') {
        // 로그인 기록 있음 → 바로 캘린더로
        router.replace('/calendar');
      } else {
        // 로그인 기록 없음 → 구글 로그인 시도
        promptAsync();
      }
    } catch (e) {
      Alert.alert('에러', '로그인 상태를 확인할 수 없습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoY }] }]}>
        <Image
          source={require('../assets/images/daypick-logo.png')}
          style={styles.logo}
        />
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handlePress}
          disabled={!request}
        >
          <Text style={styles.buttonText}>구글 계정으로 로그인</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 200,
  },
  googleButton: {
    backgroundColor: '#F45F62',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
