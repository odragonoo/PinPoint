import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, firestore } from '../lib/firebase';


export default function editProfileScreen() {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

    
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


  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    setLocalAvatarUri(imageUri); // Preview only
  }
};



const uploadAvatarToFirebase = async (uri: string) => {
  if (!auth.currentUser) return;

  const response = await fetch(uri);
  const blob = await response.blob();

  const fileRef = ref(storage, `avatars/${auth.currentUser.uid}`);
  await uploadBytes(fileRef, blob);

  const downloadURL = await getDownloadURL(fileRef);
  setAvatar(downloadURL); // Set to input state
};


const uploadToCloudinary = async (uri: string): Promise<string | null> => {
  const cloudName = 'dsgvp6swh';
  const uploadPreset = 'PinPoint';

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);
  formData.append('upload_preset', uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary upload failed:', data);
      return null;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};




    const handleSave = async () => {
  const user = auth.currentUser;
  if (!user) return;

  let finalAvatarUrl = avatar;

  if (localAvatarUri) {
    const uploadedUrl = await uploadToCloudinary(localAvatarUri);
    if (uploadedUrl) {
      finalAvatarUrl = uploadedUrl;
      setAvatar(uploadedUrl);
    } else {
      alert('Image upload failed.');
      return;
    }
  }

  const docRef = doc(firestore, 'users', user.uid);

  try {
    await updateDoc(docRef, {
      name,
      bio,
      avatar: finalAvatarUrl,
    });
    alert('Success, Profile updated!');
    router.back();
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
            <TouchableOpacity onPress={pickImage}>
  {localAvatarUri || avatar ? (
    <Image
      source={{ uri: localAvatarUri || avatar }}
      style={styles.avatarImage}
    />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Ionicons name="images-outline" size={32} color="gray" />
    </View>
  )}
</TouchableOpacity>

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
    },
    avatarImage: {
  width: 200,
  height: 200,
  borderRadius: 100,
  alignSelf: 'center',
  marginBottom: 20,
},
avatarPlaceholder: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#ccc',
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',
  marginBottom: 20,
},


});