import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { NativeCombatEntry } from '../../features/tools/nativeBattleModels';

type Props = {
  assetBaseUrl: string;
  entry: NativeCombatEntry;
  expanded: boolean;
  onOpenPokemon: () => void;
  onToggle: () => void;
  rank: number;
};

const uri = (base: string, value: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};

export const NativeRaidRankingCard = ({ assetBaseUrl, entry, expanded, onOpenPokemon, onToggle, rank }: Props) => {
  const light = useColorScheme() === 'light';
  return (
    <View style={[styles.card, light && styles.cardLight]}>
      <Pressable
        accessibilityLabel={`${expanded ? 'Hide' : 'Show'} all raid stats for ${entry.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.summary}
      >
        <View style={[styles.rank, rank <= 3 && styles.rankTop]}><Text style={styles.rankText}>{rank}</Text></View>
        <Image resizeMode="contain" source={{ uri: uri(assetBaseUrl, entry.imageUri) }} style={styles.image} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.name, light && styles.textLight]}>{entry.name}</Text>
          <Text numberOfLines={1} style={[styles.types, light && styles.mutedLight]}>{entry.types.join(' / ') || 'Unknown type'}</Text>
          {entry.rosterDetail ? <Text numberOfLines={1} style={styles.roster}>{entry.rosterDetail}</Text> : null}
        </View>
        <View style={styles.primaryMetric}>
          <Text style={styles.metricLabel}>eDPS</Text>
          <Text style={[styles.metricValue, light && styles.textLight]}>{entry.score.toFixed(1)}</Text>
          <Text style={[styles.expandHint, light && styles.mutedLight]}>{expanded ? '⌃' : '⌄'}</Text>
        </View>
      </Pressable>
      <View style={[styles.moves, light && styles.movesLight]}>
        <Text numberOfLines={1} style={[styles.move, light && styles.textLight]}>{entry.fastMove?.name ?? 'Fast Move'}</Text>
        <Text style={styles.dot}>•</Text>
        <Text numberOfLines={1} style={[styles.move, light && styles.textLight]}>{entry.chargedMove?.name ?? 'Charged Move'}</Text>
      </View>
      {expanded ? (
        <View style={[styles.details, light && styles.detailsLight]}>
          {[
            ['DPS', entry.dps.toFixed(1)], ['TDO', entry.tdo.toFixed(0)],
            ['ER', entry.er.toFixed(1)], ['CP', entry.cp.toLocaleString()],
          ].map(([label, value]) => (
            <View key={label} style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={[styles.statValue, light && styles.textLight]}>{value}</Text></View>
          ))}
          <Pressable accessibilityRole="button" onPress={onOpenPokemon} style={styles.openButton}>
            <Text style={styles.openButtonText}>Open Pokédex entry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#334c4e', borderRadius: 12, backgroundColor: '#11191a' },
  cardLight: { borderColor: '#bccdcd', backgroundColor: '#fff' },
  summary: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingTop: 7 },
  rank: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#2a3738' },
  rankTop: { backgroundColor: '#80601c' },
  rankText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  image: { width: 57, height: 57 },
  copy: { minWidth: 0, flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '900' },
  types: { marginTop: 1, color: '#9badad', fontSize: 8.5, fontWeight: '800', textTransform: 'capitalize' },
  roster: { marginTop: 3, color: '#5ed9cf', fontSize: 8.5, fontWeight: '800' },
  primaryMetric: { minWidth: 47, alignItems: 'flex-end' },
  metricLabel: { color: '#62ded5', fontSize: 7.5, fontWeight: '900' },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  expandHint: { color: '#91a2a3', fontSize: 12 },
  moves: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 31, marginHorizontal: 8, borderTopWidth: 1, borderTopColor: '#263b3c' },
  movesLight: { borderTopColor: '#d6e1e1' },
  move: { minWidth: 0, maxWidth: '44%', color: '#dce9e9', fontSize: 9.5, fontWeight: '800' },
  dot: { color: '#5ed9cf', fontSize: 9 },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#263b3c', padding: 9, backgroundColor: '#0d1415' },
  detailsLight: { borderTopColor: '#d6e1e1', backgroundColor: '#f2f7f7' },
  stat: { minWidth: 43 },
  statLabel: { color: '#829697', fontSize: 7, fontWeight: '900' },
  statValue: { color: '#fff', fontSize: 11, fontWeight: '900' },
  openButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#267f75' },
  openButtonText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
