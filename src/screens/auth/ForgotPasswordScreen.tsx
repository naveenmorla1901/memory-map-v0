import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { errorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import type { RootScreenProps } from '../../navigation/types';
import { motion, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { validateEmail } from '../../utils/validation';

export function ForgotPasswordScreen({ navigation, route }: RootScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <Header leading="close" />
        <Animated.View entering={FadeIn.duration(motion.normal)} style={styles.flex}>
          <EmptyState
            icon="mail-outline"
            title="Check your email"
            message={`If ${email.trim()} has an account, we've sent it a link to choose a new password. It can take a minute to arrive - check your spam folder too.`}
            action={{ title: 'Back to sign in', onPress: () => navigation.navigate('SignIn', { email }) }}
            secondaryAction={{ title: 'Use a different email', onPress: () => setSent(false) }}
          />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard padded={false}>
      <Header />
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.titles}>
          <Text variant="title">Reset your password</Text>
          <Text variant="body" color="textSecondary">
            Enter the email you signed up with and we'll send you a link to choose a new one.
          </Text>
        </Animated.View>
        <TextField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(undefined);
          }}
          error={error}
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={submit}
          autoFocus
        />
        <Button title="Send reset link" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
  titles: { gap: spacing.sm },
});
