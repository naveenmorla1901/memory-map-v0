import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Pin } from '../../map/Pin';
import type { RootScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';

const PINS = [
  { category: 'food', left: '18%', top: '30%', delay: 350 },
  { category: 'beach', left: '62%', top: '18%', delay: 600 },
  { category: 'viewpoint', left: '42%', top: '56%', delay: 850 },
  { category: 'cafe', left: '74%', top: '58%', delay: 1100 },
] as const;

const STEPS = [
  { icon: 'logo-instagram', text: 'See a place you love in a reel' },
  { icon: 'share-outline', text: 'Share it to Memory Map' },
  { icon: 'map', text: 'It lands on your map' },
] as const;

export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const { colors, isDark } = useTheme();

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.heroWrap}>
        <LinearGradient
          colors={isDark ? ['#2A1418', '#15151A'] : ['#FFE3E5', '#FFF6EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* A stylized map: roads and a river drawn with plain views. */}
          <View style={[styles.road, { top: '38%', transform: [{ rotate: '-8deg' }], backgroundColor: isDark ? '#FFFFFF14' : '#FFFFFFCC' }]} />
          <View style={[styles.road, { top: '66%', transform: [{ rotate: '6deg' }], backgroundColor: isDark ? '#FFFFFF14' : '#FFFFFFCC' }]} />
          <View style={[styles.roadVertical, { left: '55%', backgroundColor: isDark ? '#FFFFFF10' : '#FFFFFFB3' }]} />
          <View style={[styles.river, { backgroundColor: isDark ? '#1E3A5A55' : '#BFE3F7' }]} />
          {PINS.map((pin) => (
            <Animated.View key={pin.category} entering={FadeIn.delay(pin.delay)} style={[styles.pin, { left: pin.left, top: pin.top }]}>
              <PinWithDelay category={pin.category} delay={pin.delay} />
            </Animated.View>
          ))}
        </LinearGradient>
      </Animated.View>

      <View style={styles.copy}>
        <Animated.View entering={FadeInDown.delay(200).duration(motion.slow)}>
          <Text variant="hero">Every place from every reel, on one map.</Text>
        </Animated.View>
        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <Animated.View key={step.text} entering={FadeInDown.delay(380 + index * 110).duration(motion.normal)} style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={step.icon} size={17} color={colors.primary} />
              </View>
              <Text variant="callout" color="textSecondary">
                {step.text}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(700).duration(motion.slow)} style={styles.actions}>
        <Button title="Create account" onPress={() => navigation.navigate('SignUp')} testID="welcome-sign-up" />
        <Button title="I already have an account" variant="ghost" onPress={() => navigation.navigate('SignIn')} testID="welcome-sign-in" />
      </Animated.View>
    </Screen>
  );
}

/** Mount the pin only when its turn comes, so its drop animation plays in sequence. */
function PinWithDelay({ category, delay }: { category: string; delay: number }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return visible ? <Pin category={category} /> : null;
}

const styles = StyleSheet.create({
  heroWrap: { flex: 1, maxHeight: 340, marginTop: spacing.md },
  hero: { flex: 1, borderRadius: radii.xl, overflow: 'hidden' },
  road: { position: 'absolute', left: -20, right: -20, height: 14, borderRadius: 7 },
  roadVertical: { position: 'absolute', top: -20, bottom: -20, width: 12, borderRadius: 6, transform: [{ rotate: '12deg' }] },
  river: { position: 'absolute', right: -40, bottom: -30, width: 180, height: 120, borderRadius: 90, transform: [{ rotate: '-20deg' }] },
  pin: { position: 'absolute', marginLeft: -32, marginTop: -64 },
  copy: { gap: spacing.xl, paddingTop: spacing.xxl },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actions: { marginTop: 'auto', paddingTop: spacing.xxl, gap: spacing.xs },
});
