//src/components/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  fetchSuggestions?: (query: string) => Promise<string[]>;
  onOutsideClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, fetchSuggestions, onOutsideClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (fetchSuggestions && searchQuery.length > 2) {
        fetchSuggestions(searchQuery).then(setSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = () => {
      onOutsideClick();
    };

    return () => {};
  }, [onOutsideClick]);

  const handleSearch = () => {
    onSearch(searchQuery);
    setSuggestions([]);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    onSearch(suggestion);
    setSuggestions([]);
  };

  return (
    <View ref={containerRef} style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search for a location"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length === 0) {
              setSuggestions([]);
            }
          }}
          onSubmitEditing={handleSearch}
          onBlur={onOutsideClick}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(item)}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#FF4B55',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  suggestionsList: {
    backgroundColor: '#fff',
    borderRadius: 5,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SearchBar;

