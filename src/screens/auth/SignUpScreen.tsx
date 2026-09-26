import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ApiError, errorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { LINKS } from '../../config';
import type { RootScreenProps } from '../../navigation/types';
import { usePendingShare } from '../../state/pendingShare';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { passwordStrength, validateEmail, validateName, validateNewPassword } from '../../utils/validation';
import { PendingShareNotice } from './PendingShareNotice';

type Errors = { name?: string; email?: string; password?: string; form?: string };

export function SignUpScreen({ navigation }: RootScreenProps<'SignUp'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const pendingShare = usePendingShare();

  const clear = (field: keyof Errors) => (errors[field] || errors.form) && setErrors({ ...errors, [field]: undefined, form: undefined });

  const submit = async () => {
    const next: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password, { email, name }),
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;
    setBusy(true);
    try {
      await authApi.register(name, email, password);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        setErrors({ name: error.field('name'), email: error.field('email'), password: error.field('password') });
      } else {
        setErrors({ form: errorMessage(error) });
      }
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <Header />
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.titles}>
          <Text variant="title">Create your map</Text>
          <Text variant="body" color="textSecondary">
            It's free, and takes a few seconds.
          </Text>
        </Animated.View>

        {pendingShare && <PendingShareNotice />}

        <Animated.View entering={FadeInDown.delay(80).duration(motion.normal)} style={styles.form}>
          <TextField
            label="Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clear('name');
            }}
            error={errors.name}
            icon="person-circle-outline"
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => emailRef.current?.focus()}
            testID="sign-up-name"
          />
          <TextField
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clear('email');
            }}
            error={errors.email}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="sign-up-email"
          />
          <View style={styles.passwordGroup}>
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clear('password');
              }}
              error={errors.password}
              hint={errors.password ? undefined : 'At least 8 characters.'}
              icon="lock-closed-outline"
              password
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              testID="sign-up-password"
            />
            {password.length > 0 && <StrengthMeter password={password} />}
          </View>
          {errors.form && (
            <Text variant="callout" color="danger" accessibilityLiveRegion="polite">
              {errors.form}
            </Text>
          )}
        </Animated.View>

        <Button title="Create account" onPress={submit} loading={busy} testID="sign-up-submit" />

        <Text variant="caption" color="textTertiary" align="center">
          By creating an account you agree to the{' '}
          <Text variant="caption" color="primary" onPress={() => WebBrowser.openBrowserAsync(LINKS.terms)} accessibilityRole="link">
            Terms
          </Text>{' '}
          and{' '}
          <Text variant="caption" color="primary" onPress={() => WebBrowser.openBrowserAsync(LINKS.privacy)} accessibilityRole="link">
            Privacy Policy
          </Text>
          .
        </Text>
        <Button title="Have an account? Sign in" variant="ghost" onPress={() => navigation.replace('SignIn', { email })} />
      </View>
    </Screen>
  );
}

const STRENGTH_LABELS = ['Too short', 'Okay', 'Good', 'Strong'];

function StrengthMeter({ password }: { password: string }) {
  const { colors } = useTheme();
  const strength = passwordStrength(password);
  const tints = [colors.danger, colors.warning, colors.success, colors.success];
  return (
    <View style={styles.meterRow} accessibilityLabel={`Password strength: ${STRENGTH_LABELS[strength]}`}>
      <View style={styles.meter}>
        {[1, 2, 3].map((segment) => (
          <Segment key={segment} active={strength >= segment} color={tints[strength]} empty={colors.border} />
        ))}
      </View>
      <Text variant="caption" style={{ color: tints[strength] }}>
        {STRENGTH_LABELS[strength]}
      </Text>
    </View>
  );
}

function Segment({ active, color, empty }: { active: boolean; color: string; empty: string }) {
  const style = useAnimatedStyle(() => ({ backgroundColor: withTiming(active ? color : empty, { duration: motion.normal }) }));
  return <Animated.View style={[styles.segment, style]} />;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
  titles: { gap: spacing.xs },
  form: { gap: spacing.lg },
  passwordGroup: { gap: spacing.sm },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginLeft: spacing.xxs },
  meter: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2 },
});
