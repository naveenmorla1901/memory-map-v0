import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { validateEmail, validateName } from '../../utils/validation';

export function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const changed = name.trim() !== user?.name || email.trim().toLowerCase() !== user?.email;

  const submit = async () => {
    const next = { name: validateName(name), email: validateEmail(email) };
    setErrors(next);
    if (next.name || next.email) return;
    setBusy(true);
    try {
      await authApi.updateProfile({ name: name.trim(), email: email.trim() });
      toast({ kind: 'success', message: 'Profile updated' });
      navigation.goBack();
    } catch (error) {
      if (error instanceof ApiError && (error.field('email') || error.field('name'))) {
        setErrors({ name: error.field('name'), email: error.field('email') });
      } else {
        setErrors({ form: errorMessage(error) });
      }
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <Header title="Edit profile" />
      <View style={styles.body}>
        <TextField label="Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" autoComplete="name" textContentType="name" />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          hint="You sign in with this email."
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        {errors.form && (
          <Text variant="callout" color="danger">
            {errors.form}
          </Text>
        )}
        <Button title="Save" onPress={submit} loading={busy} disabled={!changed} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
});
