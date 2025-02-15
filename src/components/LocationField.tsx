//src/components/LocationField.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { LocationType } from '../types/location';

interface LocationFieldProps {
  location: Partial<LocationType>;
  onFieldChange: (field: keyof LocationType, value: string) => void;
}

const LocationField: React.FC<LocationFieldProps> = ({ location, onFieldChange }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={location.name}
        onChangeText={(value) => onFieldChange('name', value)}
        placeholder="Location Name"
      />
      <TextInput
        style={styles.input}
        value={location.address}
        onChangeText={(value) => onFieldChange('address', value)}
        placeholder="Address"
      />
      <TextInput
        style={styles.input}
        value={location.category}
        onChangeText={(value) => onFieldChange('category', value)}
        placeholder="Category"
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={location.description}
        onChangeText={(value) => onFieldChange('description', value)}
        placeholder="Description"
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    marginBottom: 5,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default LocationField;
