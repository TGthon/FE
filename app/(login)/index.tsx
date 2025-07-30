import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const logoY = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;

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
    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoY }] }]}>
                <Image source={require('../../assets/images/daypick-logo.png')} style={styles.logo} />
            </Animated.View>
            <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
                <TouchableOpacity style={styles.googleButton} onPress={() => router.push('/(calendar)')}>
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