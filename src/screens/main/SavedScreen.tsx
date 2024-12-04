import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withTiming, useSharedValue } from 'react-native-reanimated';

const initialSavedLocations = [
  { id: '1', name: 'National Park', distance: '0.5 miles' },
  { id: '2', name: 'Land Slide', distance: '0.8 miles' },
  { id: '3', name: 'Market', distance: '1.1 miles' },
  { id: '4', name: 'Casino', distance: '1.5 miles' },
  { id: '5', name: 'Temple', distance: '20 miles' },
];

const LocationItem = React.memo(({ item, index }: { item: { id: string; name: string; distance: string }, index: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  React.useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, { damping: 10, stiffness: 100 });
    }, delay);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDistance}>{item.distance}</Text>
    </Animated.View>
  );
});

const SavedScreen = () => {
  const [savedLocations, setSavedLocations] = useState(initialSavedLocations);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = savedLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = useCallback(({ item, index }: { item: { id: string; name: string; distance: string }, index: number }) => (
    <LocationItem item={item} index={index} />
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredLocations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  list: {
    padding: 20,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDistance: {
    fontSize: 14,
    color: '#666',
  },
});

export default SavedScreen;
