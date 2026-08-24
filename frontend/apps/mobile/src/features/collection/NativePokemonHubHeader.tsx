import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { CustomTagParent } from '@pokemongonexus/shared-contracts/users';

export type NativePokemonHubView = 'inventory' | 'pokemon' | 'wishlist';

type Props = {
  activeView: NativePokemonHubView;
  activeTag?: string | null;
  activeTagParent?: CustomTagParent | null;
  collectionCount: number;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
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
  scrollX,
  onViewChange,
}: Props) => {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(0, width - (HEADER_HORIZONTAL_PADDING * 2));
  const tabWidth = contentWidth / 3;
  const selectedIndex = activeView === 'inventory' ? 0 : activeView === 'pokemon' ? 1 : 2;
  const fallbackPosition = selectedIndex * tabWidth;
  const indicatorTranslateX = scrollX?.interpolate({
    inputRange: [0, Math.max(1, width * 2)],
    outputRange: [0, tabWidth * 2],
    extrapolate: 'clamp',
  }) ?? fallbackPosition;

  return (
    <View accessibilityRole="tablist" style={[styles.header, { backgroundColor }]}>
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
            style={styles.tab}
          >
            <Text style={[styles.tabText, { color: selected ? textColor : secondaryTextColor }]}>
              {label}
            </Text>
            {subtext ? (
              <Text style={[styles.tabSubtext, { color: selected ? textColor : secondaryTextColor }]}>
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
            left: HEADER_HORIZONTAL_PADDING + (tabWidth / 2) - (INDICATOR_WIDTH / 2),
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
        testID="native-pokemon-hub-indicator"
      />
    </View>
  );
};

const HEADER_HORIZONTAL_PADDING = 10;
const INDICATOR_WIDTH = 100;

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 2,
  },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  tabText: { fontSize: 11, fontWeight: '800' },
  tabSubtext: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    width: INDICATOR_WIDTH,
    height: 6,
    borderRadius: 3,
  },
});
