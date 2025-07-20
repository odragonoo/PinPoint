import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../lib/firebase';

export default function bugReportScreen() {
    const navigation = useNavigation();
    const [bugMessage, setBugMessage] = useState('');
    
    const submitBug = async () => {
        if (!bugMessage.trim()) {
        Alert.alert('Please describe the issue.');
        return;
        }

        try {
            const user = auth.currentUser;
            await addDoc(collection(db, 'bugReports'), {
                message: bugMessage,
                userId: user?.uid || 'anonymous',   
                timestamp: new Date(),
            });
            Alert.alert('Thank you!', 'Bug report submitted.');
            setBugMessage('');
            navigation.goBack();
        } catch (error) {
            console.error('Error sending bug report:', error);
            Alert.alert('Submission failed.');
        }
    };

    return (
        <LinearGradient colors={['#0D47A1', '#1976D2']} style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#FFA726" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report a Bug</Text>
            <View style={{ width: 28 }} />
        </View>

        <View style={styles.form}>
            <TextInput
            style={styles.input}
            multiline
            placeholder="Describe the bug..."
            placeholderTextColor="#ccc"
            value={bugMessage}
            onChangeText={setBugMessage}
            />
            <TouchableOpacity style={styles.submitButton} onPress={submitBug}>
            <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerTitle: {
        color: '#FFA726',
        fontSize: 24,
        fontWeight: 'bold',
    },
        form: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    icon: {
        marginRight: 14,
    },
    itemText: {
        color: 'white',
        fontSize: 16,
        flex: 1,
    },
    container: {
        paddingTop: 80,
        paddingHorizontal: 20,
        flex: 1,
        backgroundColor: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
        submitButton: {
        backgroundColor: '#FFA726',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#0D47A1',
        fontWeight: 'bold',
        fontSize: 16,
    },
});