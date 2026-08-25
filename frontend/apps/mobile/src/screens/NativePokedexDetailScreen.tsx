import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { NativePokedexEntry } from '../features/tools/nativePokedexModel';

type Props = {
  assetBaseUrl: string;
  entry: NativePokedexEntry | null;
  onAdd: () => void;
  onBack: () => void;
  pokemon: BasePokemon | null;
  signedIn: boolean;
};

const absoluteUri = (base: string, value: string | null): string | null => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

export const NativePokedexDetailScreen = ({ assetBaseUrl, entry, onAdd, onBack, pokemon, signedIn }: Props) => {
  const light = useColorScheme() === 'light';
  if (!entry || !pokemon) {
    return <View style={[styles.centered, light && styles.rootLight]}><Text style={[styles.title, light && styles.textLight]}>Pokémon unavailable</Text><Pressable onPress={onBack} style={styles.primary}><Text style={styles.primaryText}>Back to Pokédex</Text></Pressable></View>;
  }
  const stats = [['Attack', pokemon.attack], ['Defense', pokemon.defense], ['Stamina', pokemon.stamina], ['CP 40', pokemon.cp40], ['CP 50', pokemon.cp50]] as const;
  return (
    <ScrollView contentContainerStyle={styles.content} style={[styles.root, light && styles.rootLight]}>
      <View style={styles.topbar}><Pressable accessibilityLabel="Back to Pokédex" onPress={onBack} style={[styles.back, light && styles.backLight]}><Text style={[styles.backText, light && styles.textLight]}>‹</Text></Pressable><Text style={[styles.topTitle, light && styles.textLight]}>Pokédex entry</Text><View style={styles.back} /></View>
      <View style={[styles.hero, light && styles.cardLight]}>
        <Text style={styles.dex}>#{String(entry.pokedexNumber).padStart(4, '0')}</Text>
        <View style={styles.imageStage}>
          {entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUri) ?? undefined }} style={styles.image} /> : null}
          {entry.maxKind ? <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${entry.maxKind}.png`) ?? undefined }} style={styles.maxIcon} /> : null}
          {entry.registered ? <View style={styles.registered}><Text style={styles.registeredText}>✓ Registered</Text></View> : null}
        </View>
        <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>{entry.name}</Text>
        <Text style={[styles.meta, light && styles.mutedLight]}>Generation {pokemon.generation} · {pokemon.rarity || 'Pokémon'}</Text>
        <View style={styles.types}>{entry.typeIconUris.map((uri) => <Image key={uri} source={{ uri: absoluteUri(assetBaseUrl, uri) ?? undefined }} style={styles.type} />)}</View>
      </View>
      <View style={[styles.card, light && styles.cardLight]}><Text style={styles.eyebrow}>BASE STATS</Text><View style={styles.stats}>{stats.map(([label, value]) => <View key={label} style={[styles.stat, light && styles.statLight]}><Text style={styles.statValue}>{Number(value || 0).toLocaleString()}</Text><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text></View>)}</View></View>
      <View style={[styles.card, light && styles.cardLight]}><Text style={styles.eyebrow}>AVAILABILITY</Text><Text style={[styles.body, light && styles.mutedLight]}>Released {pokemon.date_available || 'date unavailable'}</Text><Text style={[styles.body, light && styles.mutedLight]}>Shiny {pokemon.shiny_available ? `available since ${pokemon.date_shiny_available || 'release'}` : 'not available'}</Text><Text style={[styles.body, light && styles.mutedLight]}>{pokemon.moves?.length ?? 0} known moves · {pokemon.costumes?.length ?? 0} costumes · {pokemon.megaEvolutions?.length ?? 0} Mega forms</Text></View>
      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.primary}><Text style={styles.primaryText}>{signedIn ? 'Add or manage this Pokémon' : 'Sign in to add this Pokémon'} →</Text></Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' }, content: { flexGrow: 1, gap: 12, padding: 14, paddingBottom: 44 }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, backgroundColor: '#090d12' }, textLight: { color: '#14232a' }, mutedLight: { color: '#586b74' },
  topbar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 22, backgroundColor: '#171d22' }, backLight: { borderColor: '#c1ccd2', backgroundColor: '#fff' }, backText: { marginTop: -4, color: '#fff', fontSize: 38 }, topTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  hero: { alignItems: 'center', borderWidth: 1, borderColor: '#34424a', borderRadius: 18, padding: 16, backgroundColor: '#171d21' }, cardLight: { borderColor: '#c2cdd3', backgroundColor: '#fff' }, dex: { color: '#299cf5', fontSize: 12, fontWeight: '900' }, imageStage: { width: '78%', maxWidth: 380, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, image: { width: '94%', height: '94%' }, maxIcon: { position: 'absolute', right: '8%', top: '8%', width: '22%', height: '22%', resizeMode: 'contain' }, registered: { position: 'absolute', left: '4%', bottom: '2%', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#176aa9' }, registeredText: { color: '#fff', fontSize: 10, fontWeight: '900' }, title: { color: '#fff', fontSize: 29, fontWeight: '900', textAlign: 'center' }, meta: { marginTop: 4, color: '#9ca9b0', fontSize: 12 }, types: { flexDirection: 'row', gap: 8, marginTop: 9 }, type: { width: 28, height: 28 },
  card: { gap: 8, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 15, backgroundColor: '#171d21' }, eyebrow: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, stat: { minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10, padding: 10, backgroundColor: '#11171b' }, statLight: { backgroundColor: '#eef4f7' }, statValue: { color: '#299cf5', fontSize: 18, fontWeight: '900' }, statLabel: { color: '#94a2aa', fontSize: 10, fontWeight: '800' }, body: { color: '#b2bec5', fontSize: 13, lineHeight: 19 },
  primary: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 18, backgroundColor: '#168ced' }, primaryText: { color: '#fff', fontWeight: '900' },
});
