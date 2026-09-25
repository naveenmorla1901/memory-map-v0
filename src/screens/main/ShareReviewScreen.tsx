import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import LocationForm from '../../components/LocationForm';
import { InstagramService, ExtractedLocation } from '../../services/InstagramService';
import { LocationService } from '../../services/LocationService';
import { LocationType } from '../../types/location';
import { colors } from '../../styles/theme/colors';

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

type Step =
  | { kind: 'loading' }
  | { kind: 'extracted'; locations: ExtractedLocation[] }
  | { kind: 'manual'; reason?: string }
  | { kind: 'resolving' }
  | { kind: 'form'; candidate: LocationType }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const ShareReviewScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { url } = route.params as { url: string };
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    analyze();
  }, [url]);

  const analyze = async () => {
    setStep({ kind: 'loading' });
    try {
      const result = await InstagramService.analyzeReel(url);
      if (result.status === 'new' && result.locations.length > 0) {
        setStep({ kind: 'extracted', locations: result.locations });
      } else {
        setStep({
          kind: 'manual',
          reason: result.status === 'manual_required' ? result.reason : undefined,
        });
      }
    } catch (error) {
      console.error('Error analyzing reel:', error);
      setStep({ kind: 'error', message: 'Could not reach the server. Check your connection.' });
    }
  };

  const buildCandidate = (params: {
    name: string;
    address?: string;
    category?: string;
    coordinates: { latitude: number; longitude: number };
  }): LocationType => ({
    id: 'temp-' + Date.now().toString(),
    name: params.name,
    address: params.address || '',
    coordinates: params.coordinates,
    category: params.category || 'Uncategorized',
    description: '',
    isInstagramSource: true,
    instagramUrl: url,
    notes: '',
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSelectExtracted = async (location: ExtractedLocation) => {
    if (location.coordinates) {
      setStep({
        kind: 'form',
        candidate: buildCandidate({
          name: location.name,
          category: location.category,
          coordinates: location.coordinates,
        }),
      });
      return;
    }

    // Gemini only extracts the name/type from the caption, not coordinates -
    // geocode it with the same search the rest of the app already uses.
    setStep({ kind: 'resolving' });
    try {
      const results = await LocationService.searchLocations(location.name);
      if (results.length === 0) {
        Alert.alert(
          'Not found',
          `Couldn't find a map location for "${location.name}". Try searching manually instead.`
        );
        setStep({ kind: 'extracted', locations: [] });
        return;
      }
      setStep({
        kind: 'form',
        candidate: buildCandidate({
          name: location.name,
          address: results[0].address,
          category: location.category,
          coordinates: results[0].coordinates,
        }),
      });
    } catch (error) {
      console.error('Error geocoding extracted location:', error);
      Alert.alert('Error', 'Could not search for that location. Please try again.');
      setStep({ kind: 'extracted', locations: [] });
    }
  };

  const handleManualSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    try {
      const results = await LocationService.searchLocations(query);
      setSearchSuggestions(
        results.map((result) => ({
          id: result.id,
          name: result.name,
          address: result.address,
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
        }))
      );
    } catch (error) {
      console.error('Manual search error:', error);
      setSearchSuggestions([]);
    }
  };

  const handleSelectSearchResult = (result: { name: string; address: string; latitude: number; longitude: number }) => {
    setStep({
      kind: 'form',
      candidate: buildCandidate({
        name: result.name,
        address: result.address,
        coordinates: { latitude: result.latitude, longitude: result.longitude },
      }),
    });
  };

  const handleSave = async (data: LocationType) => {
    try {
      await LocationService.saveLocation(data);
      setStep({ kind: 'success' });
    } catch (error) {
      console.error('Error saving shared location:', error);
      Alert.alert('Error', 'Failed to save this location. Please try again.');
    }
  };

  const goToManual = () => setStep({ kind: 'manual' });

  const renderBody = () => {
    switch (step.kind) {
      case 'loading':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>Reading this reel...</Text>
          </View>
        );

      case 'extracted':
        return (
          <View style={styles.flexFill}>
            <Text style={styles.heading}>What did we find?</Text>
            <Text style={styles.subheading}>Tap a place to save it.</Text>
            <FlatList
              data={step.locations}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultRow} onPress={() => handleSelectExtracted(item)}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    {!!item.category && <Text style={styles.resultSubtitle}>{item.category}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.linkButton} onPress={goToManual}>
              <Text style={styles.linkButtonText}>Can't find it? Search manually</Text>
            </TouchableOpacity>
          </View>
        );

      case 'manual':
        return (
          <View style={styles.flexFill}>
            {step.reason && (
              <View style={styles.noticeBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.noticeText}>
                  Couldn't read this reel's caption automatically. Search for the location instead.
                </Text>
              </View>
            )}
            <SearchBar onSearch={handleManualSearch} onSelectLocation={handleSelectSearchResult} suggestions={searchSuggestions} />
          </View>
        );

      case 'resolving':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>Finding it on the map...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.statusText}>Saved!</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.statusText}>{step.message}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={analyze}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={goToManual}>
              <Text style={styles.linkButtonText}>Add manually instead</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save from Instagram</Text>
        <View style={styles.closeButton} />
      </View>

      {renderBody()}

      {step.kind === 'form' && (
        <LocationForm
          initialData={step.candidate}
          onSave={handleSave}
          onClose={() => setStep({ kind: 'extracted', locations: [] })}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  flexFill: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statusText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    color: colors.text.primary,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  linkButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ShareReviewScreen;
