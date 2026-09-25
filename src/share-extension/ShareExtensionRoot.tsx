import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { close, openHostApp, Text, type InitialProps } from 'expo-share-extension';
import { colors } from '../styles/theme/colors';
import { extractInstagramUrl } from '../utils/instagramUrl';

/**
 * Root component of the iOS Share Extension target (a separate mini app,
 * with its own JS bundle - see index.share.js). This is what actually
 * renders as the small overlay on top of the host app (e.g. Instagram)
 * when the user taps "Memory Map" in the native share sheet.
 *
 * It intentionally does very little: the extension runs in its own
 * process without the main app's stored auth session, so it can't call
 * the (authenticated) analyze-reel endpoint itself. It just confirms what
 * was shared and hands off to the main app - via openHostApp, which
 * foregrounds Memory Map - to do the real extraction/search/save work in
 * ShareReviewScreen.
 */
export default function ShareExtensionRoot(props: InitialProps) {
  const [isHandingOff, setIsHandingOff] = React.useState(false);
  const instagramUrl = extractInstagramUrl(props.url) || extractInstagramUrl(props.text);

  const handleSave = () => {
    if (!instagramUrl) return;
    setIsHandingOff(true);
    openHostApp(`share?url=${encodeURIComponent(instagramUrl)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Memory Map</Text>

        {instagramUrl ? (
          <>
            <Text style={styles.subtitle} numberOfLines={2}>
              Save this reel's location?
            </Text>
            <Text style={styles.url} numberOfLines={1}>
              {instagramUrl}
            </Text>
          </>
        ) : (
          <Text style={styles.subtitle}>This doesn't look like an Instagram link.</Text>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={close} disabled={isHandingOff}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {instagramUrl && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isHandingOff}>
              {isHandingOff ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Location</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  url: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
