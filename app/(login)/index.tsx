import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const logoY = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    // 구글 로그인 훅 설정
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '968643572251-jupjisf0ht3cin2mhuosp5ie7jhivjl2.apps.googleusercontent.com',
        // androidClientId: '968643572251-jupjisf0ht3cin2mhuosp5ie7jhivjl2.apps.googleusercontent.com', // 필요시 추가
        // expoClientId: '968643572251-jupjisf0ht3cin2mhuosp5ie7jhivjl2.apps.googleusercontent.com', // 필요시 추가
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(logoY, {
                toValue: -120,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.exp)
            }),
            Animated.timing(buttonOpacity, {
                toValue: 1,
                duration: 600,
                delay: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // 구글 로그인 응답 처리
    useEffect(() => {
        if (response?.type === 'success') {
            const idToken = response.authentication?.idToken;
            if (idToken) {
                // 서버로 idToken 전송
                fetch('https://api.ldh.monster/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `type=android&code=${encodeURIComponent(idToken)}`,
                })
                .then(res => res.json())
                .then(data => {
                    // 로그인 성공 시 캘린더 화면으로 이동
                    router.push('/(calendar)');
                })
                .catch(err => {
                    Alert.alert('로그인 실패', '서버와 통신 중 오류가 발생했습니다.');
                });
            }
        }
    }, [response]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoY }] }]}>
                <Image source={require('../../assets/images/daypick-logo.png')} style={styles.logo} />
            </Animated.View>
            <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => promptAsync()}
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
        position:'absolute',
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