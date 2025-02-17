import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationType } from '../types/location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationFormProps {
  initialData: Partial<LocationType>;
  onSave: (data: LocationType) => void;
  onClose: () => void;
  isEditMode?: boolean;
}

const LocationForm: React.FC<LocationFormProps> = ({
  initialData,
  onSave,
  onClose,
  isEditMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    category: initialData.category || '',
    address: initialData.address || '',
    notes: initialData.notes || '',
    isFavorite: initialData.isFavorite || false,
    notifyRadius: initialData.notifyRadius?.toString() || '1.0',
    notifyEnabled: initialData.notifyEnabled || false,
    customName: '',
    customDescription: '',
    customCategory: '',
  });

  const handleSave = () => {
    onSave({
      ...initialData as LocationType,
      name: formData.customName || formData.name,
      description: formData.customDescription || formData.description,
      category: formData.customCategory || formData.category,
      isFavorite: formData.isFavorite,
      notifyEnabled: formData.notifyEnabled,
      notifyRadius: parseFloat(formData.notifyRadius),
      notes: formData.notes,
      updatedAt: new Date().toISOString(),
      savedAt: initialData.savedAt || new Date().toISOString(),
    });
  };

  return (
    <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={styles.closeButtonContainer}>
            <Ionicons name="close-circle" size={32} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.dragHandle} />

        <ScrollView style={styles.formContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditMode ? 'Edit Location' : 'Save Location'}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location Name</Text>
            <TextInput
              style={styles.input}
              value={formData.customName || formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, customName: text }))}
              placeholder="Enter location name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.addressText}>{formData.address}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.customDescription || formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, customDescription: text }))}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.customCategory || formData.category}
              onChangeText={(text) => setFormData(prev => ({ ...prev, customCategory: text }))}
              placeholder="Enter category"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notification Radius (km)</Text>
            <TextInput
              style={styles.input}
              value={formData.notifyRadius}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notifyRadius: text }))}
              keyboardType="numeric"
              placeholder="Enter radius in kilometers"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Enable Notifications</Text>
            <Switch
              value={formData.notifyEnabled}
              onValueChange={(value) => setFormData(prev => ({ ...prev, notifyEnabled: value }))}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={formData.notifyEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Add to Favorites</Text>
            <Switch
              value={formData.isFavorite}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isFavorite: value }))}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={formData.isFavorite ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Update Location' : 'Save Location'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.75, // Takes up maximum 75% of screen height
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 1,
  },
  closeButtonContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 4,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF4B55',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationForm;