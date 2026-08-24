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
}: Props) => {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const selectedIndex = activeView === 'inventory' ? 0 : activeView === 'pokemon' ? 1 : 2;
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
          backgroundColor,
          paddingHorizontal: metrics.horizontalPadding,
        },
      ]}
    >
      {([
        ['inventory', 'TAGS'],
        ['pokemon', 'POKÉMON'],
        ['wishlist', 'WISHLIST'],
      ] as const).map(([key, label]) => {
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
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={key}
            onPress={() => onViewChange(key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressedTab]}
          >
            <Text style={[styles.tabText, desktop && styles.desktopTabText, { color: selected ? textColor : inactiveTextColor }]}>
              {label}
            </Text>
            {subtext ? (
              <Text style={[styles.tabSubtext, desktop && styles.desktopTabSubtext, { color: selected ? textColor : inactiveTextColor }]}>
                {subtext}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeUnderline,
          {
            backgroundColor: textColor,
            left: metrics.indicatorLeft,
            width: metrics.indicatorWidth,
            transform: [{ translateX: indicatorTranslateX }],
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
    flexDirection: 'row',
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
