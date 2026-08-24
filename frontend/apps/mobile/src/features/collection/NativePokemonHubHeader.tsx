import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  onViewChange,
}: Props) => (
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
          {selected ? <View style={[styles.activeUnderline, { backgroundColor: textColor }]} /> : null}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 2,
  },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  tabText: { fontSize: 11, fontWeight: '800' },
  tabSubtext: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  activeUnderline: {
    position: 'absolute',
    bottom: -10,
    width: 100,
    height: 6,
    borderRadius: 3,
  },
});
