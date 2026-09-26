import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ApiError, errorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import type { RootScreenProps } from '../../navigation/types';
import { stopNearbyAlerts } from '../../nearby/nearby';
import { usePlaces } from '../../state/places';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { haptics } from '../../ui/haptics';
import { Header } from '../../ui/Header';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { pluralize } from '../../utils/format';

export function DeleteAccountScreen(_props: RootScreenProps<'DeleteAccount'>) {
  const { colors } = useTheme();
  const { places } = usePlaces();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    haptics.warning();
    setBusy(true);
    try {
      await authApi.deleteAccount(password);
      await stopNearbyAlerts();
      // Signed out: the navigator returns to the welcome screen.
    } catch (err) {
      setError(err instanceof ApiError && err.field('password') ? err.field('password') : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <Header title="Delete account" />
      <View style={styles.body}>
        <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <Text variant="callout" style={styles.flex}>
            This permanently deletes your account{places.length ? ` and ${pluralize(places.length, 'saved place')}` : ''}. It can't be undone.
          </Text>
        </View>
        <Text variant="body" color="textSecondary">
          Enter your password to confirm. You'll be signed out on every device.
        </Text>
        <TextField
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(undefined);
          }}
          error={error}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Button title="Delete my account" variant="danger" onPress={submit} loading={busy} testID="delete-account-submit" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
  warning: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radii.md, alignItems: 'center' },
});
