import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const locationFormStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.xl,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  formContainer: {
    maxHeight: '100%',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});