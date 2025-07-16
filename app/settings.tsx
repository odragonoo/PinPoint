import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../lib/firebase';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleSwitch = () => setNotificationsEnabled(prev => !prev);
  const handleSignOut = async () => {
      try {
        await signOut(auth);
        router.replace('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

  return (
    <LinearGradient
      colors={['#0D47A1', '#1976D2']}
      style={styles.gradient}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFA726" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section: Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsItem icon="person-outline" text="Edit Profile" onPress={() => router.push('/editprofile')}/>
        <SettingsItem icon="key-outline" text="Change Password" onPress={() => alert('Change password tapped')}/>
        <SettingsItem icon="exit-outline" text="Logout" onPress={() => handleSignOut}/>

        {/* Section: General */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>General</Text>
        <SettingsItemWithSwitch
          icon="notifications-outline"
          text="Notifications"
          value={notificationsEnabled}
          onValueChange={toggleSwitch}
        />
        <SettingsItem icon="bug-outline" text="Report a Bug" onPress={() => alert('Report Bug tapped')}/>
      </ScrollView>
    </LinearGradient>
  );
}

function SettingsItem({icon, text, onPress,}: {
  icon: any;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress}>
      <Ionicons name={icon} size={22} color="white" style={styles.icon} />
      <Text style={styles.itemText}>{text}</Text>
      <Ionicons name="chevron-forward" size={20} color="white" />
    </TouchableOpacity>
  );
}


function SettingsItemWithSwitch({
  icon,
  text,
  value,
  onValueChange,
}: {
  icon: any;
  text: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <Ionicons name={icon} size={22} color="white" style={styles.icon} />
      <Text style={styles.itemText}>{text}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ccc', true: '#FFD54F' }}
        thumbColor="#fff"
      />
    </View>
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
});
