import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeCombatEntry } from '../features/tools/nativeBattleModels';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

type Props = { assetBaseUrl: string; entry: NativeCombatEntry; metricLabel: string; rank: number; onPress?: () => void };
const uri = (base: string, value: string | null) => { if (!value) return undefined; try { return new URL(value, base).toString(); } catch { return undefined; } };
export const NativeCombatRankingCard = ({ assetBaseUrl, entry, metricLabel, rank, onPress }: Props) => {
  const light = useNativeColorScheme() === 'light';
  return <Pressable accessibilityLabel={`Rank ${rank}, ${entry.name}`} accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, light && styles.cardLight, pressed && styles.pressed]}>
    <View style={[styles.rank, rank <= 3 && styles.rankTop]}><Text style={styles.rankText}>{rank}</Text></View>
    <View style={styles.stage}>{entry.imageUri ? <Image resizeMode="contain" source={{ uri: uri(assetBaseUrl, entry.imageUri) }} style={styles.image} /> : null}{entry.maxKind ? <Image resizeMode="contain" source={{ uri: uri(assetBaseUrl, `/images/${entry.maxKind}.png`) }} style={styles.maxIcon} /> : null}</View>
    <View style={styles.copy}><Text numberOfLines={2} style={[styles.name, light && styles.textLight]}>{entry.name}</Text><Text numberOfLines={1} style={[styles.moves, light && styles.mutedLight]}>{entry.fastMove?.name ?? 'Fast Move'} · {entry.chargedMove?.name ?? 'Charged Move'}</Text><Text style={[styles.metric, light && styles.accentLight]}>{metricLabel}: {entry.score.toFixed(1)}</Text></View>
    <Text style={[styles.cp, light && styles.blueLight]}>CP {entry.cp.toLocaleString()}</Text>
  </Pressable>;
};
const styles = StyleSheet.create({
  card: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#34434b', borderRadius: 14, padding: 9, backgroundColor: '#151b20' }, cardLight: { borderColor: '#c1cdd3', backgroundColor: '#fff' }, pressed: { opacity: .72 }, rank: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#29343a' }, rankTop: { backgroundColor: '#795916' }, rankText: { color: '#fff', fontSize: 13, fontWeight: '900' }, stage: { width: 74, height: 80, alignItems: 'center', justifyContent: 'center' }, image: { width: '92%', height: '92%' }, maxIcon: { position: 'absolute', right: 0, top: 0, width: 23, height: 23 }, copy: { minWidth: 0, flex: 1 }, name: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900' }, textLight: { color: '#14232a' }, moves: { marginTop: 3, color: '#9aa8af', fontSize: 9.5 }, mutedLight: { color: '#64757d' }, metric: { marginTop: 6, color: '#39caa0', fontSize: 11, fontWeight: '900' }, accentLight: { color: '#08766b' }, cp: { alignSelf: 'flex-start', color: '#299cf5', fontSize: 9, fontWeight: '900' }, blueLight: { color: '#005bb5' },
});
