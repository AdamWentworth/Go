import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { CustomTagParent } from '@pokemongonexus/shared-contracts/users';
import { collectionParityTokens } from '@pokemongonexus/shared-ui-tokens';

export type NativePokemonHubView = 'inventory' | 'pokemon' | 'wishlist';

export const resolveNativePokemonHubIndicatorMetrics = (
  width: number,
  pagePosition: number,
) => {
  const desktop = width >= 768;
  const horizontalPadding = desktop
    ? collectionParityTokens.header.horizontalPaddingWide
    : collectionParityTokens.header.horizontalPaddingNarrow;
  const contentWidth = Math.max(0, width - (horizontalPadding * 2));
  const tabWidth = contentWidth / 3;
  const indicatorWidth = Math.max(
    collectionParityTokens.header.underlineMinWidth,
    width * collectionParityTokens.header.underlineViewportRatio,
  );
  return {
    horizontalPadding,
    indicatorLeft: horizontalPadding + (tabWidth / 2) - (indicatorWidth / 2),
    indicatorTranslateX: Math.max(0, Math.min(2, pagePosition)) * tabWidth,
    indicatorWidth,
    tabWidth,
  };
};

type Props = {
  activeView: NativePokemonHubView;
  activeTag?: string | null;
  activeTagParent?: CustomTagParent | null;
  collectionCount: number;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  inactiveTextColor?: string;
  scrollX?: Animated.Value;
  onViewChange: (view: NativePokemonHubView) => void;
  selectionCount?: number;
  selectionBackgroundColor?: string;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  catalogOwner?: string | null;
  onReturnToContext?: () => void;
};

export const NativePokemonHubHeader = ({
  activeView,
  activeTag,
  activeTagParent = null,
  collectionCount,
  backgroundColor,
  textColor,
  secondaryTextColor,
  inactiveTextColor = secondaryTextColor,
  scrollX,
  onViewChange,
  selectionCount = 0,
  selectionBackgroundColor,
  onClearSelection,
  onSelectAll,
  catalogOwner = null,
  onReturnToContext,
}: Props) => {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const selectedIndex = activeView === 'inventory' ? 0 : activeView === 'pokemon' ? 1 : 2;
  const hasSelection = selectionCount > 0;
  const metrics = resolveNativePokemonHubIndicatorMetrics(width, selectedIndex);
  const indicatorTranslateX = scrollX?.interpolate({
    inputRange: [0, Math.max(1, width * 2)],
    outputRange: [0, metrics.tabWidth * 2],
    extrapolate: 'clamp',
  }) ?? metrics.indicatorTranslateX;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.header,
        {
          backgroundColor: hasSelection && selectionBackgroundColor
            ? selectionBackgroundColor
            : backgroundColor,
          paddingHorizontal: metrics.horizontalPadding,
        },
      ]}
    >
      {!hasSelection && catalogOwner ? (
        <View style={styles.catalogContext}>
          {onReturnToContext ? (
            <Pressable
              accessibilityLabel="Back to results"
              accessibilityRole="button"
              onPress={onReturnToContext}
              style={({ pressed }) => [
                styles.catalogBack,
                { borderColor: inactiveTextColor },
                pressed && styles.pressedTab,
              ]}
            >
              <Text style={[styles.catalogBackIcon, { color: textColor }]}>←</Text>
              {desktop ? (
                <Text style={[styles.catalogBackText, { color: textColor }]}>Back to results</Text>
              ) : null}
            </Pressable>
          ) : null}
          <View
            accessibilityLabel={`Viewing ${catalogOwner}'s catalog`}
            accessibilityRole="summary"
            style={styles.catalogOwner}
          >
            <Text style={[styles.catalogOwnerLabel, { color: inactiveTextColor }]}>Viewing catalog</Text>
            <Text numberOfLines={1} style={[styles.catalogOwnerName, { color: textColor }]}>
              {catalogOwner}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.controlsRow}>
        {([
          ['inventory', 'TAGS'],
          ['pokemon', 'POKÉMON'],
          ['wishlist', 'WISHLIST'],
        ] as const).map(([key, label]) => {
          const selectionAction = hasSelection && key !== 'pokemon';
          const selected = activeView === key;
          const tagBelongsHere = activeTag && (
            (key === 'inventory' && activeTagParent === 'caught')
            || (key === 'wishlist' && activeTagParent === 'wanted')
          );
          const subtext = tagBelongsHere
            ? `(${activeTag.toUpperCase()})`
            : key === 'pokemon' ? `(${collectionCount})` : null;
          return (
            <Pressable
              accessibilityRole={selectionAction ? 'button' : 'tab'}
              accessibilityState={selectionAction ? undefined : { selected }}
              key={key}
              onPress={() => {
                if (hasSelection && key === 'inventory') onClearSelection?.();
                else if (hasSelection && key === 'wishlist') onSelectAll?.();
                else onViewChange(key);
              }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressedTab]}
            >
              <Text style={[
                styles.tabText,
                desktop && styles.desktopTabText,
                { color: hasSelection || selected ? textColor : inactiveTextColor },
              ]}>
                {hasSelection && key === 'inventory'
                  ? 'X'
                  : hasSelection && key === 'wishlist'
                    ? 'SELECT ALL'
                    : label}
              </Text>
              {(!hasSelection || key === 'pokemon') && subtext ? (
                <Text style={[
                  styles.tabSubtext,
                  desktop && styles.desktopTabSubtext,
                  { color: selected ? textColor : inactiveTextColor },
                ]}>
                  {subtext}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeUnderline,
          {
            backgroundColor: textColor,
            left: metrics.indicatorLeft,
            width: metrics.indicatorWidth,
            transform: [{
              translateX: hasSelection ? metrics.tabWidth : indicatorTranslateX,
            }],
          },
        ]}
        testID="native-pokemon-hub-indicator"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'column',
    paddingTop: collectionParityTokens.header.paddingTop,
    paddingBottom: collectionParityTokens.header.paddingBottom,
    marginBottom: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: -4 },
    shadowOpacity: 0.36,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  controlsRow: { flexDirection: 'row', minHeight: 34 },
  catalogContext: {
    width: '100%',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: -5,
    marginBottom: 8,
  },
  catalogBack: {
    minWidth: 40,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  catalogBackIcon: { fontSize: 20, fontWeight: '900' },
  catalogBackText: { fontSize: 12, fontWeight: '800' },
  catalogOwner: {
    minWidth: 0,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  catalogOwnerLabel: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  catalogOwnerName: { flexShrink: 1, fontSize: 13, fontWeight: '900' },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  pressedTab: { opacity: 0.72 },
  tabText: { fontSize: collectionParityTokens.header.narrowLabelSize, fontWeight: '800' },
  tabSubtext: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  desktopTabText: { fontSize: collectionParityTokens.header.wideLabelSize },
  desktopTabSubtext: { fontSize: 16, lineHeight: 19 },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    height: collectionParityTokens.header.underlineHeight,
    borderRadius: collectionParityTokens.header.underlineRadius,
  },
});
