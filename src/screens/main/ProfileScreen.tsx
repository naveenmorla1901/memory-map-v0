//src/screens/main/ProfileScreens.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { BackendTest } from '../../components/BackendTest';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const renderInfoItem = (icon: string, label: string, value: string) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={24} color="#FF4B55" style={styles.infoIcon} />
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{label}</Text>
        <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
          />
          <Text style={[styles.name, isDarkMode && styles.darkText]}>Anna Avetisyan</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          {renderInfoItem('calendar', 'Birthday', 'May 8, 1990')}
          {renderInfoItem('call', 'Phone', '+1 818 123 4567')}
          {renderInfoItem('logo-instagram', 'Instagram', '@anna_avetisyan')}
          {renderInfoItem('mail', 'Email', 'anna@example.com')}
          {renderInfoItem('lock-closed', 'Password', '********')}
        </View>
        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>Enable Notifications</Text>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={setIsNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={isNotificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={isDarkMode ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>
        <BackendTest />
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  darkText: {
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#FF4B55',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  signOutButtonText: {
    color: '#FF4B55',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

