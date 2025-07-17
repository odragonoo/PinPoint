import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { auth, firestore } from '../lib/firebase';

export default function editProfileScreen() {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            const currentUser = auth.currentUser;
        
            if (currentUser) {
                try {
                    const userDocRef = doc(firestore, 'users', currentUser.uid);
                    const userSnapshot = await getDoc(userDocRef);
            
                    if (userSnapshot.exists()) {
                        const data = userSnapshot.data();
                        setName(data.name || '');
                        setBio(data.bio || '');
                        setAvatar(data.avatar || '');
                    }
                } catch (error) {
                console.error('Error fetching user profile:', error);
                }
            }
        };
    
    fetchUserProfile();
    }, []);

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(firestore, 'users', user.uid);
        try {
        await updateDoc(docRef, {
            name,
            bio,
            avatar,
        });
        alert('Success, Profile updated!');
        router.back(); // Go back to the profile screen
        } catch (error) {
            alert('Error, Failed to update profile');
            console.error(error);
        }
    };

    return (
        <LinearGradient colors={['#0D47A1', '#1976D2']} style={styles.gradient}>
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Bio"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                />
                <TextInput
                    style={styles.input}
                    placeholder="Avatar URL"
                    value={avatar}
                    onChangeText={setAvatar}
                />
                <Button title="Save" onPress={handleSave}/>
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
    }
});