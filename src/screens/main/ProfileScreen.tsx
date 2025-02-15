import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { profileStyles } from '../../styles/screens/ProfileScreen.styles';
import { colors } from '../../styles/theme/colors';

const ProfileScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const handleSignOut = () => {
    // Add sign out logic here
  };

  const renderMenuItem = (
    icon: string,
    text: string,
    onPress?: () => void,
    value?: string | JSX.Element
  ) => (
    <TouchableOpacity 
      style={profileStyles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={profileStyles.menuIcon}>
        <Ionicons name={icon} size={24} color={colors.text.secondary} />
      </View>
      <Text style={profileStyles.menuText}>{text}</Text>
      {value && (
        typeof value === 'string' ? (
          <Text style={profileStyles.menuValue}>{value}</Text>
        ) : (
          value
        )
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={profileStyles.container}>
      <View style={profileStyles.header}>
        <View style={profileStyles.avatarContainer}>
          <Ionicons 
            name="person-circle-outline" 
            size={80} 
            color={colors.primary}
          />
        </View>
        <Text style={profileStyles.nameText}>John Doe</Text>
        <Text style={profileStyles.emailText}>john.doe@example.com</Text>
      </View>

      <ScrollView style={profileStyles.content}>
        <View style={profileStyles.section}>
          <View style={profileStyles.sectionHeader}>
            <Text style={profileStyles.sectionTitle}>Settings</Text>
          </View>
          
          {renderMenuItem(
            'notifications-outline',
            'Notifications',
            undefined,
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={profileStyles.settingSwitch}
            />
          )}
          
          {renderMenuItem(
            'moon-outline',
            'Dark Mode',
            undefined,
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={profileStyles.settingSwitch}
            />
          )}
          
          {renderMenuItem(
            'location-outline',
            'Location Tracking',
            undefined,
            <Switch
              value={locationTrackingEnabled}
              onValueChange={setLocationTrackingEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={profileStyles.settingSwitch}
            />
          )}
          
          {renderMenuItem(
            'sync-outline',
            'Auto Sync',
            undefined,
            <Switch
              value={autoSyncEnabled}
              onValueChange={setAutoSyncEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={profileStyles.settingSwitch}
            />
          )}
        </View>

        <View style={profileStyles.section}>
          <View style={profileStyles.sectionHeader}>
            <Text style={profileStyles.sectionTitle}>Account</Text>
          </View>
          {renderMenuItem('person-outline', 'Edit Profile', () => {})}
          {renderMenuItem('key-outline', 'Change Password', () => {})}
          {renderMenuItem('shield-outline', 'Privacy Settings', () => {})}
        </View>

        <View style={profileStyles.section}>
          <View style={profileStyles.sectionHeader}>
            <Text style={profileStyles.sectionTitle}>About</Text>
          </View>
          {renderMenuItem('information-circle-outline', 'Help & Support', () => {})}
          {renderMenuItem('document-text-outline', 'Terms of Service', () => {})}
          {renderMenuItem('shield-checkmark-outline', 'Privacy Policy', () => {})}
        </View>

        <TouchableOpacity 
          style={profileStyles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={profileStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;