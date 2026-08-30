import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import { NativeRaidBossSetupPanel } from '../components/tools/NativeRaidBossSetupPanel';
import { NativeRaidRankingCard } from '../components/tools/NativeRaidRankingCard';
import { NativeRaidSettingsPanel } from '../components/tools/NativeRaidSettingsPanel';
import { NativeRaidTypeFilter } from '../components/tools/NativeRaidTypeFilter';
import {
  buildNativeRaidAttackers,
  buildNativeRaidBosses,
  DEFAULT_NATIVE_RAID_SETTINGS,
  type NativeRaidSettings,
  type NativeRosterScope,
} from '../features/tools/nativeBattleModels';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { NativeUiIcon } from '../components/NativeUiIcon';

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  error?: string | null;
  instances?: Record<string, PokemonInstance>;
  isLoading?: boolean;
  onBack: () => void;
  onMethodology: () => void;
  onOpenPokemon: (variantId: string) => void;
  onRetry: () => void;
  signedIn: boolean;
};
type ViewMode = 'rankings' | 'boss';
type RankingMetric = 'cp' | 'dps' | 'edps' | 'er' | 'tdo';
type SortDirection = 'ascending' | 'descending';

const absoluteUri = (base: string, value: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};

export const NativeRaidScreen = ({
  assetBaseUrl,
  catalog,
  error = null,
  instances = {},
  isLoading = false,
  onBack: _onBack,
  onMethodology,
  onOpenPokemon,
  onRetry,
  signedIn,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const [view, setView] = useState<ViewMode>('rankings');
  const [scope, setScope] = useState<NativeRosterScope>(signedIn ? 'owned' : 'catalog');
  const [selectedType, setSelectedType] = useState('');
  const [query, setQuery] = useState('');
  const [bossId, setBossId] = useState('');
  const [bossQuery, setBossQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('edps');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [settings, setSettings] = useState<NativeRaidSettings>(DEFAULT_NATIVE_RAID_SETTINGS);
  const [observedDodgeSuccessRate, setObservedDodgeSuccessRate] = useState<number | null>(null);
  const effectiveSettings = useMemo<NativeRaidSettings>(() => ({
    ...settings,
    dodgeSuccessRate: observedDodgeSuccessRate ?? settings.dodgeSuccessRate,
  }), [observedDodgeSuccessRate, settings]);
  const bosses = useMemo(() => buildNativeRaidBosses(catalog), [catalog]);
  const selectedBoss = bosses.find((boss) => boss.id === bossId) ?? bosses[0] ?? null;
  const bossSuggestions = useMemo(() => {
    const normalized = bossQuery.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return bosses.filter((boss) => `${boss.name} ${boss.pokemon.pokedex_number}`.toLocaleLowerCase().includes(normalized)).slice(0, 6);
  }, [bossQuery, bosses]);
  const ownedCount = useMemo(() => Object.values(instances).filter((instance) => instance.is_caught && !instance.disabled).length, [instances]);
  const effectiveScope = signedIn ? scope : 'catalog';

  const rankings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const rows = buildNativeRaidAttackers({
      boss: view === 'boss' ? selectedBoss : null,
      catalog,
      instances,
      requiredType: view === 'rankings' ? selectedType : '',
      scope: effectiveScope,
      settings: effectiveSettings,
    }).filter((entry) => !normalizedQuery || [
      entry.name,
      entry.fastMove?.name,
      entry.chargedMove?.name,
      ...entry.types,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)));
    if (view === 'rankings') {
      const metricValue = (entry: typeof rows[number]) => {
        if (rankingMetric === 'cp') return entry.cp;
        if (rankingMetric === 'dps') return entry.dps;
        if (rankingMetric === 'tdo') return entry.tdo;
        if (rankingMetric === 'er') return entry.er;
        return entry.score;
      };
      rows.sort((left, right) => (
        (metricValue(right) - metricValue(left)) * (sortDirection === 'descending' ? 1 : -1)
      ));
    }
    return rows.slice(0, 100);
  }, [catalog, effectiveScope, effectiveSettings, instances, query, rankingMetric, selectedBoss, selectedType, sortDirection, view]);

  const customSettingCount = [
    settings.attackerLevel !== DEFAULT_NATIVE_RAID_SETTINGS.attackerLevel,
    settings.friendship !== 'none',
    settings.megaAllyBonus !== 'none',
    settings.partyPower !== 'none',
    settings.partyPower !== 'none' && settings.partyPowerStrategy !== 'immediate',
    view === 'boss' && settings.dodgeStrategy !== 'none',
    view === 'boss' && settings.bossMovesetMode !== 'expected',
    view === 'boss' && settings.shadowBossMode !== 'normal',
    settings.relobbySeconds !== DEFAULT_NATIVE_RAID_SETTINGS.relobbySeconds,
    Boolean(settings.weatherBoostedType),
  ].filter(Boolean).length;

  const switchView = (next: ViewMode) => {
    setView(next);
    setExpandedId(null);
    setQuery('');
  };
  const selectBoss = (id: string) => {
    setBossId(id);
    setBossQuery('');
    setExpandedId(null);
  };
  const selectRankingMetric = (metric: RankingMetric) => {
    if (rankingMetric === metric) {
      setSortDirection((current) => current === 'descending' ? 'ascending' : 'descending');
      return;
    }
    setRankingMetric(metric);
    setSortDirection('descending');
  };

  const productHeader = (
    <View style={styles.productHeader}>
      <Image
        accessibilityElementsHidden
        resizeMode="contain"
        source={{ uri: absoluteUri(assetBaseUrl, '/images/btn_raid.png') }}
        style={styles.productIcon}
      />
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, light && styles.accentLight]}>BATTLE PLANNING</Text>
        <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Raid Planner</Text>
        <Text style={[styles.lead, light && styles.mutedLight]}>Rank attackers, prepare counters, and build teams for current raid bosses.</Text>
      </View>
    </View>
  );

  const modeTabs = (
    <View accessibilityRole="tablist" style={[styles.modeTabs, light && styles.panelLight]}>
      {([['rankings', 'Attacker rankings'], ['boss', 'Boss counters']] as const).map(([value, label]) => (
        <Pressable
          aria-selected={view === value}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === value }}
          key={value}
          onPress={() => switchView(value)}
          style={[styles.modeButton, view === value && styles.modeActive]}
        >
          <NativeUiIcon color={view === value ? '#06120f' : light ? '#172124' : '#ecf5f4'} name={value === 'rankings' ? 'chart' : 'target'} size={14} />
          <Text style={[styles.modeText, light && styles.textLight, view === value && styles.modeTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const roster = (
    <View accessibilityLabel="Raid attacker roster" style={[styles.roster, light && styles.panelLight]}>
      {([['catalog', 'ALL POKÉMON'], ['owned', `MY POKÉMON${effectiveScope === 'owned' ? `   ${ownedCount}` : ''}`]] as const).map(([value, label]) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: value === 'owned' && !signedIn, selected: effectiveScope === value }}
          disabled={value === 'owned' && !signedIn}
          key={value}
          onPress={() => setScope(value)}
          style={[
            styles.rosterButton,
            light && styles.controlLight,
            effectiveScope === value && styles.rosterActive,
            value === 'owned' && !signedIn && styles.disabled,
          ]}
        >
          <View style={styles.iconLabelRow}>
            <NativeUiIcon color={effectiveScope === value ? '#071410' : light ? '#172124' : '#edf6f5'} name={value === 'catalog' ? 'catalog' : 'trainers'} size={14} />
            <Text style={[styles.rosterText, light && styles.textLight, effectiveScope === value && styles.rosterTextActive]}>{label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const toolbar = (
    <View style={styles.toolbar}>
      <Text style={[styles.fieldLabel, light && styles.mutedLight]}>{view === 'boss' ? 'COUNTER SEARCH' : 'ATTACKER SEARCH'}</Text>
      <TextInput
        accessibilityLabel={view === 'boss' ? 'Search raid counters' : 'Search raid rankings'}
        onChangeText={setQuery}
        placeholder="Pokémon, type, or move"
        placeholderTextColor={light ? '#708183' : '#809294'}
        style={[styles.search, light && styles.inputLight]}
        value={query}
      />
      <View style={styles.toolbarActions}>
        <View accessibilityLabel="Result detail" style={[styles.movesetTabs, light && styles.controlLight]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: settings.bestOnly }}
            onPress={() => setSettings((current) => ({ ...current, bestOnly: true }))}
            style={[styles.movesetButton, settings.bestOnly && styles.movesetActive]}
          >
            <Text style={[styles.movesetText, light && styles.textLight, settings.bestOnly && styles.movesetTextActive]}>BEST MOVESET</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !settings.bestOnly }}
            onPress={() => setSettings((current) => ({ ...current, bestOnly: false }))}
            style={[styles.movesetButton, !settings.bestOnly && styles.movesetActive]}
          >
            <Text style={[styles.movesetText, light && styles.textLight, !settings.bestOnly && styles.movesetTextActive]}>ALL MOVESETS</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel={`Ranking settings${customSettingCount ? `, ${customSettingCount} custom settings` : ''}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: settingsOpen }}
          onPress={() => setSettingsOpen((current) => !current)}
          style={[styles.settingsButton, light && styles.controlLight, settingsOpen && styles.settingsActive]}
        >
          <View style={styles.iconLabelRow}>
            <NativeUiIcon color={light ? '#172124' : '#edf6f5'} name="filters" size={14} />
            <Text style={[styles.settingsText, light && styles.textLight]}>SETTINGS{customSettingCount ? ` ${customSettingCount}` : ''} {settingsOpen ? '⌃' : '⌄'}</Text>
          </View>
        </Pressable>
      </View>
      {settingsOpen ? (
        <NativeRaidSettingsPanel
          includeBossControls={view === 'boss'}
          includeShadowControls={view === 'boss'}
          onChange={setSettings}
          settings={settings}
        />
      ) : null}
      {view === 'rankings' ? (
        <View accessibilityLabel="Ranking metric" style={[styles.metricSort, light && styles.controlLight]}>
          {([['edps', 'eDPS'], ['dps', 'DPS'], ['tdo', 'TDO'], ['er', 'ER'], ['cp', 'CP']] as const).map(([metric, label]) => {
            const selected = rankingMetric === metric;
            return (
              <Pressable
                accessibilityLabel={`Sort by ${label}${selected ? `, currently ${sortDirection}` : ''}`}
                accessibilityRole="button"
                key={metric}
                onPress={() => selectRankingMetric(metric)}
                style={[styles.metricSortButton, selected && styles.metricSortActive]}
              >
                <Text style={[styles.metricSortText, light && styles.textLight, selected && styles.metricSortTextActive]}>{label}</Text>
                <Text style={[styles.metricSortIcon, selected && styles.metricSortTextActive]}>{selected ? sortDirection === 'descending' ? '⌄' : '⌃' : '↕'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );

  const bossPicker = view === 'boss' ? (
    <View style={styles.bossSection}>
      {selectedBoss ? (
        <View style={[styles.selectedBoss, light && styles.panelLight]}>
          <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, selectedBoss.imageUri) }} style={styles.selectedBossImage} />
          <View style={styles.bossSummaryCopy}>
            <Text style={[styles.eyebrow, light && styles.accentLight]}>RAID BOSS</Text>
            <Text style={[styles.bossTitle, light && styles.textLight]}>{selectedBoss.name}</Text>
            <Text style={[styles.bossMeta, light && styles.mutedLight]}>{selectedBoss.tier.shortLabel} · #{String(selectedBoss.pokemon.pokedex_number).padStart(4, '0')}</Text>
          </View>
        </View>
      ) : null}
      <TextInput
        accessibilityLabel="Find boss"
        onChangeText={setBossQuery}
        placeholder="Search raid bosses"
        placeholderTextColor={light ? '#708183' : '#809294'}
        style={[styles.search, styles.bossSearch, light && styles.inputLight]}
        value={bossQuery}
      />
      {bossQuery.trim() ? (
        <View accessibilityLabel="Raid boss suggestions" style={[styles.bossSuggestions, light && styles.panelLight]}>
          {bossSuggestions.length > 0 ? bossSuggestions.map((boss) => (
            <Pressable
              accessibilityLabel={`Select ${boss.name} raid boss`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedBoss?.id === boss.id }}
              key={boss.id}
              onPress={() => selectBoss(boss.id)}
              style={[styles.bossSuggestion, selectedBoss?.id === boss.id && styles.bossSuggestionActive]}
            >
              <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, boss.imageUri) }} style={styles.bossSuggestionImage} />
              <Text numberOfLines={1} style={[styles.bossSuggestionName, light && styles.textLight]}>{boss.name}</Text>
              <Text style={[styles.bossSuggestionNumber, light && styles.mutedLight]}>#{String(boss.pokemon.pokedex_number).padStart(4, '0')}</Text>
            </Pressable>
          )) : <Text style={[styles.noBosses, light && styles.mutedLight]}>No matching raid boss found.</Text>}
        </View>
      ) : null}
    </View>
  ) : null;

  const heading = view === 'boss'
    ? `Best counters${selectedBoss ? ` vs ${selectedBoss.name}` : ''}`
    : selectedType
      ? `Top ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} attackers`
      : effectiveScope === 'owned'
        ? 'Your top raid attackers'
        : 'Top raid attackers';

  const header = (
    <View style={styles.headerStack}>
      {productHeader}
      {modeTabs}
      {roster}
      {view === 'rankings' ? <NativeRaidTypeFilter assetBaseUrl={assetBaseUrl} onChange={setSelectedType} selectedType={selectedType} /> : bossPicker}
      <View style={styles.leaderboardHeading}>
        <Text style={[styles.resultsTitle, light && styles.textLight]}>{heading}</Text>
        <Pressable accessibilityLabel="How raid rankings work" accessibilityRole="button" onPress={onMethodology} style={[styles.info, light && styles.controlLight]}>
          <Text style={[styles.infoText, light && styles.accentLight]}>ⓘ</Text>
        </Pressable>
      </View>
      {toolbar}
      {view === 'boss' && selectedBoss ? <NativeRaidBossSetupPanel assetBaseUrl={assetBaseUrl} boss={selectedBoss} key={selectedBoss.id} onObservedDodgeRateChange={setObservedDodgeSuccessRate} scores={rankings} /> : null}
      {isLoading ? <View style={styles.state}><ActivityIndicator color="#2fd6d0" /><Text style={[styles.stateCopy, light && styles.mutedLight]}>Loading battle data…</Text></View> : null}
      {error ? (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.errorTitle}>Raid Planner unavailable</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-raid-screen">
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 96 }}
        data={rankings}
        keyExtractor={(entry) => entry.id}
        ListHeaderComponent={header}
        ListEmptyComponent={!isLoading && !error ? (
          <View style={[styles.empty, light && styles.emptyLight]}>
            <Text style={[styles.emptyTitle, light && styles.textLight]}>No compatible attackers</Text>
            <Text style={[styles.stateCopy, light && styles.mutedLight]}>{effectiveScope === 'owned' ? 'No caught attackers match the current filters. Add level, IV, CP, and move details to improve personalized rankings.' : 'Try another boss, type, or search.'}</Text>
          </View>
        ) : null}
        renderItem={({ item, index }) => (
          <NativeRaidRankingCard
            assetBaseUrl={assetBaseUrl}
            entry={item}
            expanded={expandedId === item.id}
            onOpenPokemon={() => onOpenPokemon(`${item.pokemonId}-default`)}
            onToggle={() => setExpandedId((current) => current === item.id ? null : item.id)}
            primaryMetric={view === 'rankings' ? rankingMetric : 'dps'}
            rank={index + 1}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071011' },
  rootLight: { backgroundColor: '#f8fff9' },
  textLight: { color: '#142629' },
  mutedLight: { color: '#617476' },
  accentLight: { color: '#08766b' },
  panelLight: { borderColor: '#b8cccc', backgroundColor: '#fff' },
  controlLight: { borderColor: '#b8c8c8', backgroundColor: '#fff' },
  inputLight: { borderColor: '#b8c8c8', color: '#142629', backgroundColor: '#fff' },
  headerStack: { gap: 8, marginBottom: 8 },
  productHeader: { minHeight: 114, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#294749', paddingHorizontal: 3, paddingBottom: 9 },
  back: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435758', borderRadius: 18, backgroundColor: '#172122' },
  backText: { marginTop: -4, color: '#fff', fontSize: 34 },
  productIcon: { width: 48, height: 48, transform: [{ translateY: -7 }] },
  headerCopy: { minWidth: 0, flex: 1, transform: [{ translateY: -7 }] },
  eyebrow: { color: '#69ded7', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#fff', fontSize: 27, fontWeight: '900', letterSpacing: -.6 },
  lead: { marginTop: 2, color: '#a9bbbb', fontSize: 11.5, lineHeight: 16 },
  modeTabs: { flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#355153', borderRadius: 14, padding: 4, backgroundColor: '#101819' },
  modeButton: { flex: 1, minHeight: 34, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  modeActive: { backgroundColor: '#2fd6d0' },
  modeIcon: { color: '#d5e5e5', fontSize: 11, fontWeight: '900' },
  modeText: { color: '#d5e5e5', fontSize: 10.5, fontWeight: '900' },
  modeTextActive: { color: '#071214' },
  roster: { flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: '#355153', borderRadius: 13, padding: 5, backgroundColor: '#101819' },
  rosterButton: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435758', borderRadius: 999, backgroundColor: '#1b2526' },
  rosterActive: { borderColor: '#2fd6d0', backgroundColor: '#45dbc4' },
  rosterText: { color: '#e6f1f1', fontSize: 9.5, fontWeight: '900' },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rosterTextActive: { color: '#071214' },
  disabled: { opacity: .45 },
  toolbar: { gap: 7 },
  fieldLabel: { color: '#a3b5b6', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  search: { minHeight: 39, borderWidth: 1, borderColor: '#455a5c', borderRadius: 999, paddingHorizontal: 14, color: '#fff', backgroundColor: '#101819', fontSize: 13, fontWeight: '700' },
  toolbarActions: { flexDirection: 'row', gap: 6 },
  metricSort: { minHeight: 43, flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#355052', borderRadius: 11, padding: 4, backgroundColor: '#101819' },
  metricSortButton: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 8 },
  metricSortActive: { backgroundColor: '#42d5c6' },
  metricSortText: { color: '#b9c9ca', fontSize: 8, fontWeight: '900' },
  metricSortIcon: { color: '#809294', fontSize: 8, fontWeight: '900' },
  metricSortTextActive: { color: '#06191a' },
  movesetTabs: { minWidth: 0, flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#3b5052', borderRadius: 999, padding: 3, backgroundColor: '#101819' },
  movesetButton: { minWidth: 0, flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 4 },
  movesetActive: { backgroundColor: '#45dbc4' },
  movesetText: { color: '#d5e5e5', fontSize: 8.5, fontWeight: '900' },
  movesetTextActive: { color: '#071214' },
  settingsButton: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: '#455a5c', borderRadius: 999, paddingHorizontal: 10, backgroundColor: '#1a2324' },
  settingsActive: { borderColor: '#2fd6d0' },
  settingsText: { color: '#e2eeee', fontSize: 8.5, fontWeight: '900' },
  leaderboardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 3 },
  resultsTitle: { minWidth: 0, flex: 1, color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
  info: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3e5557', borderRadius: 22, backgroundColor: '#162122' },
  infoText: { color: '#52ded5', fontSize: 16, fontWeight: '900' },
  bossSection: { gap: 7 },
  selectedBoss: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#355153', borderRadius: 13, padding: 9, backgroundColor: '#101819' },
  selectedBossImage: { width: 72, height: 72 },
  bossSummaryCopy: { minWidth: 0, flex: 1 },
  bossTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  bossMeta: { marginTop: 3, color: '#9badae', fontSize: 9.5, fontWeight: '800' },
  bossSearch: { marginTop: 0 },
  bossSuggestions: { gap: 3, borderWidth: 1, borderColor: '#355153', borderRadius: 12, padding: 5, backgroundColor: '#101819' },
  bossSuggestion: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, paddingHorizontal: 7 },
  bossSuggestionActive: { backgroundColor: '#174d47' },
  bossSuggestionImage: { width: 40, height: 40 },
  bossSuggestionName: { minWidth: 0, flex: 1, color: '#fff', fontSize: 11, fontWeight: '900' },
  bossSuggestionNumber: { color: '#95a8a9', fontSize: 8.5, fontWeight: '800' },
  noBosses: { padding: 10, color: '#9badae', fontSize: 10, textAlign: 'center' },
  state: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  stateCopy: { color: '#a3b5b6', fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
  error: { gap: 7, borderWidth: 1, borderColor: '#df5770', borderRadius: 12, padding: 13, backgroundColor: '#39151e' },
  errorTitle: { color: '#ffd8df', fontSize: 15, fontWeight: '900' },
  errorCopy: { color: '#ffb8c4', fontSize: 12 },
  retry: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', borderRadius: 999, paddingHorizontal: 14, backgroundColor: '#df5770' },
  retryText: { color: '#fff', fontWeight: '900' },
  empty: { alignItems: 'center', gap: 5, marginTop: 3, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3d5556', borderRadius: 12, padding: 25, backgroundColor: '#101819' },
  emptyLight: { borderColor: '#a9c2c2', backgroundColor: '#fff' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
