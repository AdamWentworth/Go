import { Pressable, StyleSheet, Text, View } from 'react-native';

export type NativeCollectionSection = 'tags' | 'pokemon' | 'wishlist';

type NativeCollectionTabsProps = {
  activeSection: NativeCollectionSection;
  pokemonCount: number;
  onOpenTags: () => void;
  onOpenPokemon: () => void;
  onOpenWishlist: () => void;
};

const tabs: {
  key: NativeCollectionSection;
  label: string;
}[] = [
  { key: 'tags', label: 'Tags' },
  { key: 'pokemon', label: 'Pokémon' },
  { key: 'wishlist', label: 'Wishlist' },
];

export const NativeCollectionTabs = ({
  activeSection,
  pokemonCount,
  onOpenTags,
  onOpenPokemon,
  onOpenWishlist,
}: NativeCollectionTabsProps) => {
  const handlers: Record<NativeCollectionSection, () => void> = {
    tags: onOpenTags,
    pokemon: onOpenPokemon,
    wishlist: onOpenWishlist,
  };

  return (
    <View accessibilityRole="tablist" style={styles.tabs} testID="native-collection-tabs">
      {tabs.map((tab) => {
        const selected = tab.key === activeSection;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.key}
            onPress={handlers[tab.key]}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
            {tab.key === 'pokemon' ? (
              <Text style={[styles.count, selected && styles.labelSelected]}>
                ({pokemonCount.toLocaleString()})
              </Text>
            ) : null}
            {selected ? <View style={styles.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    minHeight: 58,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
    backgroundColor: '#111111',
  },
  tab: {
    minHeight: 58,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabPressed: { opacity: 0.72 },
  label: {
    color: '#8e9aa6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  count: {
    marginTop: 1,
    color: '#8e9aa6',
    fontSize: 10,
    fontWeight: '800',
  },
  labelSelected: { color: '#ffffff' },
  underline: {
    position: 'absolute',
    bottom: 0,
    width: '72%',
    height: 5,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
});
