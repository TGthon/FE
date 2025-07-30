import { StyleSheet, Text, View } from "react-native";

export default function FriendsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Friends Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 20,
        color: '#333',
    },
});