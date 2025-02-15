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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationType } from '../types/location';

interface LocationFormProps {
  initialData: Partial<LocationType>;
  onSave: (data: LocationType) => void;
  onClose: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    category: initialData.category || '',
    address: initialData.address || '',
    notes: initialData.notes || '',
    isFavorite: initialData.isFavorite || false,
    notifyRadius: '1.0',
    notifyEnabled: false,
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
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Save Location</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
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
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationForm;