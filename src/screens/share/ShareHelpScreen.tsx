import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { RootScreenProps } from '../../navigation/types';
import { useSettings } from '../../state/settings';
import { useTheme } from '../../theme/ThemeProvider';
import { IconName } from '../../theme/categories';
import { motion, radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'logo-instagram',
    title: 'Open a reel in Instagram',
    body: 'Any reel or post that shows a restaurant, beach, viewpoint - anywhere you want to go.',
  },
  {
    icon: 'paper-plane-outline',
    title: 'Tap Share',
    body:
      Platform.OS === 'ios'
        ? 'Tap the paper plane, then scroll the row of apps to the end and tap More. Pick Memory Map. (Tap Edit there to pin it to the front for next time.)'
        : 'Tap the paper plane, then "Share to…" (or More). Pick Memory Map. Long-press it to pin it for next time.',
  },
  {
    icon: 'sparkles',
    title: 'We find the places',
    body: 'Memory Map reads the reel and finds the places it mentions on the map. If it can\'t tell, search for the place in a second.',
  },
  {
    icon: 'bookmark',
    title: 'Save - and keep scrolling',
    body: "Tap Save and you're back in Instagram. Everything's waiting on your map.",
  },
];

export function ShareHelpScreen({ navigation }: RootScreenProps<'ShareHelp'>) {
  const { colors } = useTheme();
  const { update } = useSettings();

  return (
    <Screen scroll padded={false}>
      <Header title="Save from Instagram" leading="close" />
      <View style={styles.body}>
        {STEPS.map((step, index) => (
          <Animated.View key={step.title} entering={FadeInDown.delay(index * 90).duration(motion.normal)} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.number, { backgroundColor: colors.primary }]}>
                <Ionicons name={step.icon} size={20} color={colors.onPrimary} />
              </View>
              {index < STEPS.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>
            <View style={styles.stepText}>
              <Text variant="micro" color="primary">
                STEP {index + 1}
              </Text>
              <Text variant="subheading">{step.title}</Text>
              <Text variant="callout" color="textSecondary">
                {step.body}
              </Text>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(STEPS.length * 90).duration(motion.normal)} style={[styles.tip, { backgroundColor: colors.surface }]}>
          <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
          <Text variant="callout" color="textSecondary" style={styles.flex}>
            Don't see Memory Map in the share sheet? Tap <Text variant="callout" style={styles.bold}>Copy link</Text> instead, then paste it into the search bar on the map.
          </Text>
        </Animated.View>

        <Button
          title="Got it"
          onPress={() => {
            update({ seenShareTips: true });
            navigation.goBack();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  step: { flexDirection: 'row', gap: spacing.lg },
  rail: { alignItems: 'center' },
  number: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginTop: spacing.xs, borderRadius: 1, minHeight: 20 },
  stepText: { flex: 1, gap: spacing.xs, paddingBottom: spacing.md },
  tip: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, alignItems: 'flex-start' },
});
