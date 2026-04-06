import { StyleSheet } from 'react-native';

/**
 * Shared style patterns extracted from multiple components.
 * Import what you need — don't copy-paste these anywhere.
 *
 * @example
 * import { commonStyles } from '../../theme';
 * style={[commonStyles.xpBadge, myLocalStyle]}
 */
export const commonStyles = StyleSheet.create({
  // ─── XP Badge ────────────────────────────────────────────────────────────
  /** Row container: Sparkles icon + "+XX XP" text */
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',         // amber-50
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fef3c7',             // amber-100
    gap: 4,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',                   // amber-700
  },

  // ─── Section Header ──────────────────────────────────────────────────────
  /** Row containing a title + optional badge / action button */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',                   // stone-900
  },

  // ─── Empty State ─────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderStyle: 'dashed',
  },
  emptyIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',                   // amber-800
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#b45309',                   // amber-700
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Count Badge (small inline badge) ───────────────────────────────────
  countBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
});
