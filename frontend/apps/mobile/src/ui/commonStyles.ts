import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const commonStyles = StyleSheet.create({
  screenContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.type.title,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  caption: {
    color: theme.colors.textTertiary,
  },
  hint: {
    color: theme.colors.textSecondary,
  },
  error: {
    color: theme.colors.danger,
  },
  success: {
    color: theme.colors.success,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.type.subtitle,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    gap: 2,
  },
  rowSelected: {
    borderColor: theme.colors.selectedBorder,
    backgroundColor: theme.colors.selectedSurface,
  },
  rowTitle: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rowSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  pill: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.surfaceAlt,
  },
  pillSelected: {
    borderColor: theme.colors.selectedBorder,
    backgroundColor: theme.colors.selectedSurface,
  },
  pillText: {
    color: theme.colors.textTertiary,
    fontSize: theme.type.caption,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: theme.colors.selectedText,
  },
});

