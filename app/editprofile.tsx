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
        <Button title="Save" onPress={handleSave} />
        </View>
    );
}

const styles = StyleSheet.create({
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
});