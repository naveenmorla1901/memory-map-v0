import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const savedScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  filterButton: {
    padding: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDistance: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    width: 50,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  itemAddress: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  itemCategory: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  editContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 5,
  },
  buttonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
});