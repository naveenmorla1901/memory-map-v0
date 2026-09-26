import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import type { RootScreenProps } from '../../navigation/types';
import { useAuth } from '../../state/auth';
import { spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { validateNewPassword } from '../../utils/validation';

type Errors = { current?: string; next?: string; form?: string };

export function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const { user } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const nextRef = useRef<TextInput>(null);

  const submit = async () => {
    const problems: Errors = {
      current: current ? undefined : 'Enter your current password.',
      next: validateNewPassword(next, { email: user?.email, name: user?.name }) ?? (next === current ? 'Choose a password different from your current one.' : undefined),
    };
    setErrors(problems);
    if (problems.current || problems.next) return;
    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      toast({ kind: 'success', message: "Password changed. You've been signed out on your other devices." });
      navigation.goBack();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        setErrors({ current: error.field('current_password'), next: error.field('new_password') });
      } else {
        setErrors({ form: errorMessage(error) });
      }
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <Header title="Change password" />
      <View style={styles.body}>
        <TextField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          error={errors.current}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => nextRef.current?.focus()}
        />
        <TextField
          ref={nextRef}
          label="New password"
          value={next}
          onChangeText={setNext}
          error={errors.next}
          hint="At least 8 characters. Changing it signs you out everywhere else."
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {errors.form && (
          <Text variant="callout" color="danger">
            {errors.form}
          </Text>
        )}
        <Button title="Change password" onPress={submit} loading={busy} />
        <Button title="Forgot your current password?" variant="ghost" onPress={() => authApi.requestPasswordReset(user?.email ?? '').then(() => toast({ kind: 'success', message: `We sent a reset link to ${user?.email}.` })).catch((error) => toast({ kind: 'error', message: errorMessage(error) }))} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
});
