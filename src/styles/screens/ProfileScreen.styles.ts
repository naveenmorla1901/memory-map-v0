import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  nameText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: spacing.md,
    width: 24,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  menuValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  settingSwitch: {
    marginLeft: spacing.sm,
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  signOutText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});