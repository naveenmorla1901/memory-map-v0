import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ApiError, errorMessage } from '../../api/client';
import { CategoryPicker } from '../../components/CategoryPicker';
import type { RootScreenProps } from '../../navigation/types';
import { usePlace, usePlaces } from '../../state/places';
import { CategoryKey } from '../../theme/categories';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Header } from '../../ui/Header';
import { PressableScale } from '../../ui/PressableScale';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';

interface Form {
  name: string;
  category: CategoryKey;
  notes: string;
  address: string;
  latitude: number;
  longitude: number;
}

export function EditPlaceScreen({ navigation, route }: RootScreenProps<'EditPlace'>) {
  const { colors } = useTheme();
  const toast = useToast();
  const { create, update } = usePlaces();
  const existing = usePlace(route.params.placeId ?? '');
  const draft = route.params.draft;
  const isNew = !route.params.placeId;

  const [initial] = useState<Form>(() => ({
    name: existing?.name ?? draft?.name ?? '',
    category: existing?.category ?? draft?.category ?? 'other',
    notes: existing?.notes ?? '',
    address: existing?.address ?? draft?.address ?? '',
    latitude: existing?.latitude ?? draft?.latitude ?? 0,
    longitude: existing?.longitude ?? draft?.longitude ?? 0,
  }));
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  // Set after a successful save; navigating happens in an effect so the
  // unsaved-changes guard below has already been switched off by then.
  const [exit, setExit] = useState<{ focusPlaceId?: string } | null>(null);

  // Coming back from "Adjust on map".
  const picked = route.params.picked;
  useEffect(() => {
    if (!picked) return;
    setForm((current) => ({
      ...current,
      latitude: picked.latitude,
      longitude: picked.longitude,
      address: picked.address || current.address,
      name: current.name.trim() && current.name !== 'Dropped pin' ? current.name : picked.name ?? current.name,
    }));
    navigation.setParams({ picked: undefined });
  }, [picked, navigation]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  usePreventRemove(dirty && !exit && !saving, ({ data }) => {
    Alert.alert('Discard changes?', "You haven't saved this place yet.", [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Give this place a name.' });
      return;
    }
    setSaving(true);
    setErrors({});
    const body = {
      name: form.name.trim(),
      category: form.category,
      notes: form.notes.trim(),
      address: form.address.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    };
    try {
      if (isNew) {
        const place = await create({ ...body, instagram_url: draft?.instagram_url });
        toast({ kind: 'success', message: `Saved ${place.name}` });
        setExit({ focusPlaceId: place.id });
      } else if (existing) {
        await update(existing.id, body);
        toast({ kind: 'success', message: 'Changes saved' });
        setExit({});
      }
    } catch (error) {
      setErrors(error instanceof ApiError && error.field('name') ? { name: error.field('name') } : { form: errorMessage(error) });
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!exit) return;
    if (exit.focusPlaceId) navigation.popTo('Tabs', { screen: 'Map', params: { focusPlaceId: exit.focusPlaceId } });
    else navigation.goBack();
  }, [exit, navigation]);

  return (
    <Screen scroll keyboard padded={false} footer={
      <View style={[styles.footer, { borderTopColor: colors.separator, backgroundColor: colors.background }]}>
        {errors.form && (
          <Text variant="caption" color="danger" align="center">
            {errors.form}
          </Text>
        )}
        <Button title={isNew ? 'Save place' : 'Save changes'} icon={isNew ? 'bookmark' : undefined} onPress={submit} loading={saving} disabled={!isNew && !dirty} testID="edit-save" />
      </View>
    }>
      <Header title={isNew ? 'New place' : 'Edit place'} leading="close" />
      <View style={styles.body}>
        <TextField
          label="Name"
          value={form.name}
          onChangeText={(value) => {
            set('name', value);
            if (errors.name) setErrors({});
          }}
          error={errors.name}
          placeholder="e.g. Blue Bottle Coffee"
          autoCapitalize="words"
          returnKeyType="done"
          selectTextOnFocus={form.name === 'Dropped pin'}
          testID="edit-name"
        />

        <View style={styles.group}>
          <Text variant="captionStrong" color="textSecondary" style={styles.label}>
            Category
          </Text>
          <CategoryPicker value={form.category} onChange={(value) => set('category', value)} />
        </View>

        <View style={styles.group}>
          <Text variant="captionStrong" color="textSecondary" style={styles.label}>
            Location
          </Text>
          <PressableScale
            onPress={() => navigation.navigate('PickLocation', { initial: { latitude: form.latitude, longitude: form.longitude }, mode: 'return' })}
            scaleTo={0.98}
            style={[styles.location, { backgroundColor: colors.surface }]}
            accessibilityLabel={`Location: ${form.address || 'no address'}. Adjust on map`}
          >
            <Ionicons name="location" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <Text variant="body" numberOfLines={2}>
                {form.address || `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`}
              </Text>
              <Text variant="caption" color="primary">
                Adjust on map
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </PressableScale>
        </View>

        <TextField
          label="Notes"
          value={form.notes}
          onChangeText={(value) => set('notes', value)}
          placeholder="What to order, best time to go, who recommended it…"
          multiline
          multilineHeight={110}
          maxLength={2000}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.sm },
  group: { gap: spacing.sm },
  label: { marginLeft: spacing.xxs },
  location: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.md },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
