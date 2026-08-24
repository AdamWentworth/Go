import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeCollectionRow } from './collectionModel';

type NativePokemonGridCardProps = {
  item: NativeCollectionRow;
  columnCount: number;
  onOpen: (instanceId: string) => void;
};

const statusPresentation = {
  caught: { accent: '#2a94ff', glow: 'rgba(42, 148, 255, 0.18)', label: 'Caught' },
  trade: { accent: '#41c77a', glow: 'rgba(65, 199, 122, 0.19)', label: 'For Trade' },
  wanted: { accent: '#ff526b', glow: 'rgba(255, 82, 107, 0.19)', label: 'Wanted' },
} as const;

export const NativePokemonGridCard = ({
  item,
  columnCount,
  onOpen,
}: NativePokemonGridCardProps) => {
  const status = statusPresentation[item.status];
  const compact = columnCount >= 6;

  return (
    <View style={[styles.cell, { width: `${100 / columnCount}%` }]}>
      <Pressable
        accessibilityHint={`${status.label} Pokémon`}
        accessibilityLabel={`Open ${item.name}`}
        accessibilityRole="button"
        onPress={() => onOpen(item.id)}
        style={({ pressed }) => [
          styles.card,
          compact && styles.cardCompact,
          pressed && styles.cardPressed,
        ]}
        testID={`native-collection-card-${item.id}`}
      >
        <View style={styles.cpRow}>
          <Text
            accessibilityElementsHidden={item.cp == null}
            numberOfLines={1}
            style={[styles.cp, item.cp == null && styles.cpPlaceholder, compact && styles.metaCompact]}
          >
            {item.cp == null ? 'CP 000' : `CP ${item.cp.toLocaleString()}`}
          </Text>
          {item.favorite ? (
            <Text accessibilityLabel="Favorite" style={[styles.priorityStar, styles.favoriteStar]}>★</Text>
          ) : null}
          {item.mostWanted ? (
            <Text accessibilityLabel="Most Wanted" style={[styles.priorityStar, styles.mostWantedStar]}>★</Text>
          ) : null}
        </View>

        <View style={[styles.imageStage, compact && styles.imageStageCompact]}>
          <View style={[styles.statusGlow, { backgroundColor: status.glow }]} />
          {item.locationBackgroundUri ? (
            <Image
              accessibilityElementsHidden
              resizeMode="cover"
              source={{ uri: item.locationBackgroundUri }}
              style={styles.locationBackdrop}
            />
          ) : null}
          {item.luckyBackdropUri ? (
            <Image
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: item.luckyBackdropUri }}
              style={styles.luckyBackdrop}
            />
          ) : null}
          {item.imageUri ? (
            <Image
              accessibilityLabel={item.name}
              resizeMode="contain"
              source={{ uri: item.imageUri }}
              style={styles.pokemonImage}
            />
          ) : (
            <Text style={styles.imageFallback}>#{item.pokemonId}</Text>
          )}
          {item.maxBadgeUri ? (
            <Image
              accessibilityLabel={item.name.includes('Gigantamax') ? 'Gigantamax' : 'Dynamax'}
              resizeMode="contain"
              source={{ uri: item.maxBadgeUri }}
              style={styles.maxBadge}
            />
          ) : null}
        </View>

        <View style={styles.dexRow}>
          <Text style={[styles.dexNumber, compact && styles.metaCompact]}>
            #{item.pokedexNumber}
          </Text>
          {item.typeIconUris.map((icon, index) => (
            <Image
              accessibilityElementsHidden
              key={`${item.id}-type-${index}`}
              resizeMode="contain"
              source={{ uri: icon }}
              style={[styles.typeIcon, compact && styles.typeIconCompact]}
            />
          ))}
        </View>
        <Text numberOfLines={3} style={[styles.name, compact && styles.nameCompact]}>
          {item.name}
        </Text>
        <View style={[styles.statusLine, { backgroundColor: status.accent }]} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: { paddingHorizontal: 4, paddingBottom: 9 },
  card: {
    minHeight: 158,
    alignItems: 'stretch',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingTop: 3,
    paddingBottom: 5,
    backgroundColor: '#111111',
  },
  cardCompact: { minHeight: 148 },
  cardPressed: { opacity: 0.68, transform: [{ scale: 0.975 }] },
  cpRow: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cp: { flex: 1, color: '#f1f5f9', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  cpPlaceholder: { opacity: 0 },
  priorityStar: { marginLeft: 2, fontSize: 17, lineHeight: 19 },
  favoriteStar: { color: '#ffd000' },
  mostWantedStar: { color: '#ff7047' },
  imageStage: {
    width: '76%',
    maxWidth: 105,
    aspectRatio: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStageCompact: { width: '72%', maxWidth: 94 },
  statusGlow: {
    position: 'absolute',
    top: '16%',
    right: '8%',
    bottom: '6%',
    left: '8%',
    borderRadius: 999,
  },
  locationBackdrop: {
    position: 'absolute',
    top: '4%',
    right: '1%',
    bottom: '1%',
    left: '1%',
    width: '98%',
    height: '95%',
    borderRadius: 999,
    opacity: 0.9,
  },
  luckyBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.82,
  },
  pokemonImage: { width: '100%', height: '100%' },
  imageFallback: { color: '#8b98a5', fontWeight: '800' },
  maxBadge: {
    position: 'absolute',
    top: '7%',
    right: '3%',
    width: '29%',
    height: '29%',
  },
  dexRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dexNumber: { color: '#a6b0ba', fontSize: 10, fontWeight: '700' },
  typeIcon: { width: 10, height: 10 },
  typeIconCompact: { width: 9, height: 9 },
  name: {
    minHeight: 32,
    paddingHorizontal: 1,
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'center',
  },
  nameCompact: { minHeight: 29, fontSize: 10, lineHeight: 12 },
  metaCompact: { fontSize: 9 },
  statusLine: {
    width: 26,
    height: 2,
    alignSelf: 'center',
    marginTop: 3,
    borderRadius: 999,
    opacity: 0.86,
  },
});
