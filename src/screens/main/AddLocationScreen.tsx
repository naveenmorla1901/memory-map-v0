import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addLocationStyles } from '../../styles/screens/AddLocationScreen.styles';
import { colors } from '../../styles/theme/colors';
import { LocationService } from '../../services/LocationService';

const categories = ['Home', 'Work', 'Restaurant', 'Shopping', 'Entertainment', 'Other'];

export default function AddLocationScreen({ navigation, route }: { navigation: any; route: any }) {
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [notificationRadius, setNotificationRadius] = useState('1.0');
  const [isFavorite, setIsFavorite] = useState(false);

  const coordinates = route.params?.coordinates;

  const handleSave = async () => {
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    if (!coordinates) {
      Alert.alert('Error', 'Location coordinates are required');
      return;
    }

    try {
      const newLocation = {
        name: locationName,
        address,
        description,
        category: category || 'Other',
        coordinates,
        isInstagramSource: false,
        isFavorite,
        notifyEnabled: enableNotifications,
        notifyRadius: parseFloat(notificationRadius),
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await LocationService.saveLocation(newLocation);
      Alert.alert('Success', 'Location saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const isFormValid = locationName.trim() && coordinates;

  return (
    <SafeAreaView style={addLocationStyles.container}>
      <View style={addLocationStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={addLocationStyles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={addLocationStyles.title}>Add New Location</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={!isFormValid}
          style={[
            addLocationStyles.submitButton,
            !isFormValid && addLocationStyles.disabledButton
          ]}
        >
          <Text style={addLocationStyles.submitButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={addLocationStyles.form}>
        <View style={addLocationStyles.formGroup}>
          <Text style={addLocationStyles.label}>Location Name*</Text>
          <TextInput
            style={addLocationStyles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter location name"
          />
        </View>

        <View style={addLocationStyles.formGroup}>
          <Text style={addLocationStyles.label}>Address</Text>
          <TextInput
            style={addLocationStyles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
          />
        </View>

        <View style={addLocationStyles.formGroup}>
          <Text style={addLocationStyles.label}>Description</Text>
          <TextInput
            style={[addLocationStyles.input, addLocationStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={addLocationStyles.formGroup}>
          <Text style={addLocationStyles.label}>Category</Text>
          <View style={addLocationStyles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  addLocationStyles.categoryChip,
                  category === cat && addLocationStyles.selectedCategoryChip
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    addLocationStyles.categoryChipText,
                    category === cat && addLocationStyles.selectedCategoryChipText
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={addLocationStyles.switchContainer}>
          <Text style={addLocationStyles.switchLabel}>Add to Favorites</Text>
          <Switch
            value={isFavorite}
            onValueChange={setIsFavorite}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={addLocationStyles.switchContainer}>
          <View style={{ flex: 1 }}>
            <Text style={addLocationStyles.switchLabel}>Enable Notifications</Text>
          </View>
          <Switch
            value={enableNotifications}
            onValueChange={setEnableNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {enableNotifications && (
          <View style={addLocationStyles.formGroup}>
            <Text style={addLocationStyles.label}>Notification Radius (km)</Text>
            <TextInput
              style={[addLocationStyles.input, addLocationStyles.radiusInput]}
              value={notificationRadius}
              onChangeText={setNotificationRadius}
              keyboardType="numeric"
              placeholder="1.0"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
