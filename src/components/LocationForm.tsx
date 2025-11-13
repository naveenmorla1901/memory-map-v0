import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Keyboard,
  Alert,
  Animated,
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
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    category: initialData.category || '',
    address: initialData.address || '',
    notes: initialData.notes || '',
    isFavorite: initialData.isFavorite || false,
    notifyRadius: initialData.notifyRadius?.toString() || '1.0',
    notifyEnabled: initialData.notifyEnabled || false,
  });

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.75)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate in when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }

    const radius = parseFloat(formData.notifyRadius);
    if (isNaN(radius) || radius <= 0) {
      newErrors.notifyRadius = 'Please enter a valid radius';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        ...initialData as LocationType,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isFavorite: formData.isFavorite,
        notifyEnabled: formData.notifyEnabled,
        notifyRadius: parseFloat(formData.notifyRadius),
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        savedAt: initialData.savedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.75,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.overlay, { paddingBottom: insets.bottom, opacity: fadeAnim }]}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          disabled={isSaving}
        >
          <View style={styles.closeButtonContainer}>
            <Ionicons name="close-circle" size={32} color={isSaving ? "#ccc" : "#666"} />
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
            <Text style={styles.label}>
              Location Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter location name"
              placeholderTextColor="#999"
              editable={!isSaving}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.addressText}>{formData.address}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
              placeholder="e.g., Home, Work, Restaurant"
              placeholderTextColor="#999"
              editable={!isSaving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notification Radius (km)</Text>
            <TextInput
              style={[styles.input, errors.notifyRadius && styles.inputError]}
              value={formData.notifyRadius}
              onChangeText={(text) => {
                // Allow only numbers and decimal point
                const cleaned = text.replace(/[^0-9.]/g, '');
                setFormData(prev => ({ ...prev, notifyRadius: cleaned }));
                if (errors.notifyRadius) setErrors(prev => ({ ...prev, notifyRadius: '' }));
              }}
              keyboardType="decimal-pad"
              placeholder="e.g., 1.0"
              placeholderTextColor="#999"
              editable={!isSaving}
            />
            {errors.notifyRadius && <Text style={styles.errorText}>{errors.notifyRadius}</Text>}
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Enable Notifications</Text>
            <Switch
              value={formData.notifyEnabled}
              onValueChange={(value) => setFormData(prev => ({ ...prev, notifyEnabled: value }))}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={formData.notifyEnabled ? "#f4f3f4" : "#f4f3f4"}
              disabled={isSaving}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Add to Favorites</Text>
            <Switch
              value={formData.isFavorite}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isFavorite: value }))}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={formData.isFavorite ? "#f4f3f4" : "#f4f3f4"}
              disabled={isSaving}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Location' : 'Save Location'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Animated.View>
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
  required: {
    color: '#FF4B55',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF4B55',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#FF4B55',
    fontSize: 12,
    marginTop: 4,
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
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    minHeight: 52,
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB3B6',
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationForm;