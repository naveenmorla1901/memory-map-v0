import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionStore } from '../api/session';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { motion, radii, spacing } from '../theme/tokens';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { extractInstagramUrl } from '../utils/instagram';
import { ShareFlow } from './ShareFlow';

interface OverlayAppProps {
  /** Whatever the share sheet handed over (a URL or text containing one). */
  shared: string | null | undefined;
  onClose: () => void;
  /** Open the main app at a deep link path, e.g. "share?url=…". */
  openApp: (path: string) => void;
  /**
   * 'sheet': we own the whole (transparent) screen and draw the dimmed
   * backdrop and a bottom card - Android. 'embedded': the host already sized
   * and dimmed the view - the iOS share extension.
   */
  presentation: 'sheet' | 'embedded';
}

/** The small "save this reel" UI that appears on top of Instagram. */
export function OverlayApp(props: OverlayAppProps) {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider preference="system">
          <OverlayFrame {...props} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function OverlayFrame({ shared, onClose, openApp, presentation }: OverlayAppProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const card = (
    <View style={[styles.card, { backgroundColor: colors.background, paddingBottom: presentation === 'sheet' ? insets.bottom : 0 }]}>
      <OverlayContent shared={shared} onClose={onClose} openApp={openApp} />
    </View>
  );

  if (presentation === 'embedded') return <View style={styles.flex}>{card}</View>;

  return (
    <View style={styles.flex}>
      <Animated.View entering={FadeIn.duration(motion.normal)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }]}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(20).stiffness(180)} style={[styles.sheet, { height: Math.min(640, height * 0.82) }]}>
        {card}
      </Animated.View>
    </View>
  );
}

type SessionState = 'checking' | 'signedIn' | 'signedOut';

function OverlayContent({ shared, onClose, openApp }: Omit<OverlayAppProps, 'presentation'>) {
  const [session, setSession] = useState<SessionState>('checking');
  const url = extractInstagramUrl(shared);

  useEffect(() => {
    sessionStore.load().then((value) => setSession(value ? 'signedIn' : 'signedOut'));
  }, []);

  if (!url) {
    return (
      <Message
        icon="link-outline"
        title="That's not a reel link"
        message="Share an Instagram reel or post to save the places in it."
        primary={{ title: 'Close', onPress: onClose }}
      />
    );
  }
  if (session === 'checking') return null;
  if (session === 'signedOut') {
    return (
      <Message
        icon="person-circle-outline"
        title="Sign in to save places"
        message="Open Memory Map to sign in - we'll pick up this reel right after."
        primary={{ title: 'Open Memory Map', onPress: () => openApp(`share?url=${encodeURIComponent(url)}`) }}
        secondary={{ title: 'Not now', onPress: onClose }}
      />
    );
  }
  return (
    <ShareFlow
      url={url}
      onClose={onClose}
      savedAction={{
        title: 'Open Memory Map',
        onPress: (places) => openApp(places.length === 1 ? `place/${places[0].id}` : 'map'),
      }}
    />
  );
}

function Message({
  icon,
  title,
  message,
  primary,
  secondary,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  primary: { title: string; onPress: () => void };
  secondary?: { title: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.message}>
      <View style={[styles.messageIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="callout" color="textSecondary" align="center">
        {message}
      </Text>
      <View style={styles.messageActions}>
        <Button title={primary.title} onPress={primary.onPress} />
        {secondary && <Button title={secondary.title} variant="ghost" onPress={secondary.onPress} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: { flex: 1, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, overflow: 'hidden', paddingTop: spacing.xs },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  messageIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  messageActions: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
});
