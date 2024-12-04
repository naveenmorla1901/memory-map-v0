import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dummyData = [
  { id: '1', location: 'Location 1', image: 'https://via.placeholder.com/150' },
  { id: '2', location: 'Location 2', image: 'https://via.placeholder.com/150' },
  { id: '3', location: 'Location 3', image: 'https://via.placeholder.com/150' },
];

export default function InstagramScreen() {
  const [extractedLocations, setExtractedLocations] = useState(dummyData);

  const renderItem = ({ item }: { item: { id: string; location: string; image: string } }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.location}>{item.location}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Extracted Locations</Text>
      <FlatList
        data={extractedLocations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
  },
  item: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  location: {
    fontSize: 18,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FF4B55',
    padding: 10,
    borderRadius: 5,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

