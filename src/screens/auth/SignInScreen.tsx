import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ApiError, errorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import type { RootScreenProps } from '../../navigation/types';
import { usePendingShare } from '../../state/pendingShare';
import { motion, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { validateEmail } from '../../utils/validation';
import { PendingShareNotice } from './PendingShareNotice';

export function SignInScreen({ navigation, route }: RootScreenProps<'SignIn'>) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const pendingShare = usePendingShare();

  const submit = async () => {
    const next = { email: validateEmail(email), password: password ? undefined : 'Enter your password.' };
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(true);
    try {
      await authApi.signIn(email, password);
      // The navigator swaps to the signed-in screens on its own.
    } catch (error) {
      setErrors(error instanceof ApiError && error.status === 401 ? { form: 'Incorrect email or password.' } : { form: errorMessage(error) });
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} padded={false}>
      <Header />
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.titles}>
          <Text variant="title">Welcome back</Text>
          <Text variant="body" color="textSecondary">
            Sign in to see your map.
          </Text>
        </Animated.View>

        {pendingShare && <PendingShareNotice />}

        <Animated.View entering={FadeInDown.delay(80).duration(motion.normal)} style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email || errors.form) setErrors({});
            }}
            error={errors.email}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
            testID="sign-in-email"
          />
          <TextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password || errors.form) setErrors({});
            }}
            error={errors.password ?? errors.form}
            icon="lock-closed-outline"
            password
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="sign-in-password"
          />
          <Button
            title="Forgot password?"
            variant="ghost"
            size="sm"
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgotPassword', { email })}
          />
        </Animated.View>

        <Button title="Sign in" onPress={submit} loading={busy} testID="sign-in-submit" />
        <Button title="New here? Create an account" variant="ghost" onPress={() => navigation.replace('SignUp')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
  titles: { gap: spacing.xs },
  form: { gap: spacing.lg },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm },
});
