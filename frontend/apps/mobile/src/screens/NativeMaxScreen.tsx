import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { MaxBattleTier } from '@pokemongonexus/app-core/max-battle-simulation';
import { NativeCombatRankingCard } from '../components/NativeCombatRankingCard';
import { NativeMaxBattleSimulator } from '../components/tools/NativeMaxBattleSimulator';
import {
  buildNativeMaxRankings,
  buildNativeMaxRoleCandidates,
  buildNativeMaxVariants,
  NATIVE_BATTLE_TYPES,
  type NativeMaxRole,
  type NativeRosterScope,
} from '../features/tools/nativeBattleModels';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { NativeUiIcon } from '../components/NativeUiIcon';

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  error?: string | null;
  instances?: Record<string, PokemonInstance>;
  initialBossId?: string;
  initialDifficulty?: MaxBattleTier | null;
  initialRole?: NativeMaxRole;
  initialScope?: NativeRosterScope;
  initialSelectedType?: string;
  initialTrainerCount?: number | null;
  initialView?: MaxView;
  isLoading?: boolean;
  onBack: () => void;
  onOpenPokemon: (variantId: string) => void;
  onRetry: () => void;
  signedIn: boolean;
};
type MaxView = 'rankings' | 'bosses';

const absoluteUri = (base: string, value?: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};

const roleHeading = (role: NativeMaxRole, selectedType: string): string => {
  const type = selectedType
    ? `${selectedType.charAt(0).toUpperCase()}${selectedType.slice(1)}`
    : '';
  if (type && role === 'tank') return `Top tanks vs ${type}`;
  if (type && role === 'healing') return `Top healers vs ${type}`;
  if (role === 'damage') return `Top ${type ? `${type} ` : ''}damage dealers`;
  if (role === 'tank') return 'Top tanks';
  return 'Top healers';
};

const roleMetric = (role: NativeMaxRole): string => {
  if (role === 'damage') return 'Max output';
  if (role === 'tank') return 'Bulk';
  return 'Team sustain';
};

export const NativeMaxScreen = ({
  assetBaseUrl,
  catalog,
  error = null,
  instances = {},
  initialBossId = '',
  initialDifficulty = null,
  initialRole = 'damage',
  initialScope,
  initialSelectedType = '',
  initialTrainerCount = null,
  initialView = 'rankings',
  isLoading = false,
  onBack: _onBack,
  onOpenPokemon,
  onRetry,
  signedIn,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const [view, setView] = useState<MaxView>(initialView);
  const [scope, setScope] = useState<NativeRosterScope>(
    signedIn ? initialScope ?? 'owned' : 'catalog',
  );
  const [role, setRole] = useState<NativeMaxRole>(initialRole);
  const [selectedType, setSelectedType] = useState(initialSelectedType);
  const [query, setQuery] = useState('');
  const [bossId, setBossId] = useState(initialBossId);
  const [methodOpen, setMethodOpen] = useState(false);

  const maxCatalog = useMemo(
    () => catalog.filter((pokemon) => pokemon.max?.some((form) => Boolean(form.dynamax || form.gigantamax))),
    [catalog],
  );
  const bossVariants = useMemo(() => buildNativeMaxVariants(maxCatalog), [maxCatalog]);
  const selectedBoss = bossVariants.find((boss) => boss.variant_id === bossId)
    ?? bossVariants[0]
    ?? null;
  const effectiveScope = signedIn ? scope : 'catalog';
  const ownedCount = useMemo(
    () => Object.values(instances).filter((instance) => instance.is_caught && !instance.disabled && (instance.dynamax || instance.gigantamax || instance.crown)).length,
    [instances],
  );
  const candidates = useMemo(
    () => buildNativeMaxRoleCandidates({
      bossVariant: selectedBoss,
      catalog: maxCatalog,
      instances,
      scope: effectiveScope,
    }),
    [effectiveScope, instances, maxCatalog, selectedBoss],
  );
  const rankings = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const entries = buildNativeMaxRankings({
      bossVariant: view === 'bosses' ? selectedBoss : null,
      catalog: maxCatalog,
      instances,
      role,
      scope: effectiveScope,
      selectedType: view === 'rankings' ? selectedType : '',
    });
    return entries.filter((entry) => !normalized || [
      entry.name,
      entry.fastMove?.name,
      entry.chargedMove?.name,
      ...entry.types,
    ].some((value) => value?.toLocaleLowerCase().includes(normalized))).slice(0, 50);
  }, [effectiveScope, instances, maxCatalog, query, role, selectedBoss, selectedType, view]);

  const switchView = (next: MaxView) => {
    setView(next);
    setQuery('');
  };

  const productHeader = (
    <View style={styles.productHeader}>
      <Image
        accessibilityElementsHidden
        resizeMode="contain"
        source={{ uri: absoluteUri(assetBaseUrl, '/images/dynamax.png') }}
        style={styles.productIcon}
      />
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, light && styles.accentLight]}>POWER SPOT STRATEGY</Text>
        <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Max Battles</Text>
      </View>
      <Text style={[styles.countPill, light && styles.countPillLight]}>{bossVariants.length} Max-ready Pokémon</Text>
    </View>
  );

  const viewTabs = (
    <View accessibilityRole="tablist" style={[styles.viewTabs, light && styles.panelLight]}>
      {([['rankings', 'Max rankings'], ['bosses', 'Boss teams']] as const).map(([value, label]) => (
        <Pressable
          aria-selected={view === value}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === value }}
          key={value}
          onPress={() => switchView(value)}
          style={[styles.viewButton, view === value && styles.viewActive]}
        >
          <NativeUiIcon color={view === value ? '#06120f' : light ? '#172124' : '#ecf5f4'} name={value === 'rankings' ? 'chart' : 'target'} size={14} />
          <Text style={[styles.viewText, light && styles.textLight, view === value && styles.activeText]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const roster = (
    <View accessibilityLabel="Max Battle roster" style={[styles.roster, light && styles.panelLight]}>
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
            <Text style={[styles.rosterText, light && styles.textLight, effectiveScope === value && styles.activeText]}>{label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const roleTabs = (
    <View accessibilityLabel="Max Battle role" style={styles.roleTabs}>
      {([['damage', 'bolt', 'Damage'], ['tank', 'diamond', 'Tank'], ['healing', 'heart', 'Healing']] as const).map(([value, icon, label]) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: role === value }}
          key={value}
          onPress={() => setRole(value)}
          style={[styles.roleButton, light && styles.controlLight, role === value && styles.roleActive]}
        >
          <NativeUiIcon
            color={role === value ? '#ffd9e7' : light ? '#102829' : '#edf5f4'}
            name={icon}
            size={13}
          />
          <Text style={[styles.roleText, light && styles.textLight, role === value && styles.roleActiveText]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const typeFilter = view === 'rankings' ? (
    <View accessibilityLabel="Max Move type" style={[styles.typeDeck, light && styles.panelLight]}>
      <Text style={[styles.fieldLabel, light && styles.mutedLight]}>MAX MOVE TYPE</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: selectedType === '' }}
        onPress={() => setSelectedType('')}
        style={[styles.allTypes, selectedType === '' && styles.allTypesActive]}
      >
        <Text style={styles.allTypesText}>All types</Text>
      </Pressable>
      <View style={styles.typeGrid}>
        {NATIVE_BATTLE_TYPES.map((type) => {
          const selected = selectedType === type;
          return (
            <Pressable
              accessibilityLabel={type}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={type}
              onPress={() => setSelectedType(type)}
              style={[styles.typeButton, light && styles.typeButtonLight, selected && styles.typeActive]}
            >
              <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/types/${type}.png`) }} style={styles.typeIcon} />
            </Pressable>
          );
        })}
      </View>
    </View>
  ) : null;

  const bossPicker = view === 'bosses' ? (
    <View style={[styles.bossPicker, light && styles.panelLight]}>
      <Text style={[styles.fieldLabel, light && styles.mutedLight]}>MAX BOSS</Text>
      <ScrollView contentContainerStyle={styles.bossRail} horizontal showsHorizontalScrollIndicator={false}>
        {bossVariants.slice(0, 100).map((boss) => {
          const selected = selectedBoss?.variant_id === boss.variant_id;
          const maxKind = boss.variantType.includes('gigantamax') ? 'gigantamax' : 'dynamax';
          return (
            <Pressable
              accessibilityLabel={`Select ${boss.name} Max boss`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={boss.variant_id}
              onPress={() => setBossId(boss.variant_id)}
              style={[styles.bossCard, light && styles.cardLight, selected && styles.bossActive]}
            >
              <View style={styles.bossStage}>
                <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, boss.currentImage || boss.image_url) }} style={styles.bossImage} />
                <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, `/images/${maxKind}.png`) }} style={styles.maxIcon} />
              </View>
              <Text numberOfLines={2} style={[styles.bossName, light && styles.textLight, selected && styles.activeText]}>{boss.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  const heading = view === 'bosses' && selectedBoss
    ? `Top ${role === 'healing' ? 'healers' : role === 'tank' ? 'tanks' : 'damage picks'} vs ${selectedBoss.name}`
    : roleHeading(role, selectedType);
  const assumptions = effectiveScope === 'owned'
    ? 'Recorded level · recorded IVs · recorded Fast Move · unlocked Max Move levels'
    : 'Level 50 · 15/15/15 IVs · Max Moves Level 3';

  const resultsHeader = (
    <View style={[styles.resultsPanel, light && styles.panelLight]}>
      <View style={styles.resultsContext}>
        <Text style={[styles.fieldLabel, light && styles.accentLight]}>{view === 'bosses' ? 'ROLE ALTERNATIVES' : selectedType.toUpperCase() || 'ALL MAX POKÉMON'}</Text>
        <Text style={[styles.rankedPill, light && styles.rankedPillLight]}>{rankings.length} RANKED</Text>
      </View>
      <Text style={[styles.resultsTitle, light && styles.textLight]}>{heading}</Text>
      <Text style={[styles.assumptions, light && styles.mutedLight]}>{assumptions}</Text>
      <TextInput
        accessibilityLabel="Search Max rankings"
        onChangeText={setQuery}
        placeholder="Pokémon or move"
        placeholderTextColor={light ? '#718283' : '#829394'}
        style={[styles.search, light && styles.inputLight]}
        value={query}
      />
      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#42d6c8" />
          <Text style={[styles.stateCopy, light && styles.mutedLight]}>Preparing Max rankings…</Text>
        </View>
      ) : null}
      {error ? (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.errorTitle}>Max Battles unavailable</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : null}
      {!isLoading && !error && rankings.length === 0 ? (
        <View style={styles.resultsEmpty}>
          <Text style={[styles.emptyTitle, light && styles.textLight]}>No eligible Max Pokémon</Text>
          <Text style={[styles.stateCopy, light && styles.mutedLight]}>Try another role, type, boss, or roster.</Text>
        </View>
      ) : null}
    </View>
  );

  const header = (
    <View style={styles.headerStack}>
      {productHeader}
      {viewTabs}
      {roster}
      {view === 'rankings'
        ? <>{roleTabs}{typeFilter}</>
        : <>{bossPicker}{selectedBoss ? <NativeMaxBattleSimulator assetBaseUrl={assetBaseUrl} boss={selectedBoss} candidates={candidates} initialDifficulty={initialDifficulty} initialTrainerCount={initialTrainerCount} key={`${selectedBoss.variant_id}-${effectiveScope}`} rosterScope={effectiveScope} /> : null}{roleTabs}</>}
      {resultsHeader}
    </View>
  );

  const footer = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: methodOpen }}
      onPress={() => setMethodOpen((current) => !current)}
      style={styles.method}
    >
      <Text style={[styles.methodTitle, light && styles.textLight]}>▸  How Max roles are ranked</Text>
      {methodOpen ? (
        <Text style={[styles.methodCopy, light && styles.mutedLight]}>
          Damage uses Attack, active Max or G-Max power, STAB, and effectiveness. Tank uses effective bulk and boss pressure. Healing uses the active Max Spirit level and team recovery.
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-max-screen">
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 7, paddingTop: 3, paddingBottom: 96 }}
        data={rankings}
        keyExtractor={(entry) => entry.id}
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        ListEmptyComponent={null}
        renderItem={({ item, index }) => (
          <NativeCombatRankingCard
            assetBaseUrl={assetBaseUrl}
            entry={item}
            metricLabel={roleMetric(role)}
            onPress={() => onOpenPokemon(item.id)}
            rank={index + 1}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d0d' },
  rootLight: { backgroundColor: '#f8fff9' },
  textLight: { color: '#102829' },
  mutedLight: { color: '#617576' },
  accentLight: { color: '#08766b' },
  panelLight: { borderColor: '#9fb8b8', backgroundColor: '#f8fcfb' },
  controlLight: { borderColor: '#9fb2b2', backgroundColor: '#fff' },
  cardLight: { borderColor: '#a8bcbc', backgroundColor: '#fff' },
  inputLight: { borderColor: '#8ba2a3', color: '#102829', backgroundColor: '#fff' },
  activeText: { color: '#071110' },
  headerStack: { gap: 9 },
  productHeader: { minHeight: 106, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#2b4c4d', paddingHorizontal: 7, paddingBottom: 8 },
  back: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#405354', borderRadius: 17, backgroundColor: '#11191a' },
  backText: { marginTop: -4, color: '#fff', fontSize: 31, lineHeight: 34 },
  productIcon: { width: 42, height: 42, transform: [{ translateY: -8 }] },
  headerCopy: { minWidth: 0, flex: 1, transform: [{ translateY: -8 }] },
  eyebrow: { color: '#65ddd2', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 2, color: '#fff', fontSize: 25, lineHeight: 28, fontWeight: '900' },
  countPill: { alignSelf: 'flex-end', marginBottom: 2, borderWidth: 1, borderColor: '#d45b89', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, color: '#ffd9e7', fontSize: 7, fontWeight: '900' },
  countPillLight: { color: '#a9235b' },
  viewTabs: { flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#315253', borderRadius: 13, padding: 4, backgroundColor: '#0d1516' },
  viewButton: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  viewActive: { backgroundColor: '#44d7ca' },
  viewText: { color: '#aebdbc', fontSize: 11, fontWeight: '900' },
  viewIcon: { marginRight: 5, color: '#aebdbc', fontSize: 11, fontWeight: '900' },
  roster: { flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: '#315253', borderRadius: 9, padding: 5, backgroundColor: '#101919' },
  rosterButton: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435455', borderRadius: 999, backgroundColor: '#111919' },
  rosterActive: { borderColor: '#44d7ca', backgroundColor: '#44d7ca' },
  rosterText: { color: '#e7f1f0', fontSize: 10, fontWeight: '900' },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  disabled: { opacity: .42 },
  roleTabs: { flexDirection: 'row', gap: 6 },
  roleButton: { flex: 1, minHeight: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334849', borderRadius: 6, backgroundColor: '#101819' },
  roleActive: { borderColor: '#de5a8a', backgroundColor: '#401629' },
  roleActiveText: { color: '#ffd9e7' },
  roleText: { color: '#edf5f4', fontSize: 10, fontWeight: '900' },
  typeDeck: { gap: 8, borderWidth: 1, borderColor: '#315253', borderRadius: 8, padding: 11, backgroundColor: '#0f1819' },
  fieldLabel: { color: '#69d9cf', fontSize: 8, fontWeight: '900', letterSpacing: .5 },
  allTypes: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#ddc064' },
  allTypesActive: { backgroundColor: '#f0d370' },
  allTypesText: { color: '#111817', fontSize: 10, fontWeight: '900' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  typeButton: { width: '9.72%', minWidth: 31, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2f4546', borderRadius: 4, backgroundColor: '#131d1e' },
  typeButtonLight: { borderColor: '#aabcbc', backgroundColor: '#fff' },
  typeActive: { borderColor: '#f1d46f', backgroundColor: '#4a4224' },
  typeIcon: { width: '72%', height: '72%', resizeMode: 'contain' },
  bossPicker: { gap: 7, borderWidth: 1, borderColor: '#315253', borderRadius: 9, padding: 9, backgroundColor: '#0f1819' },
  bossRail: { gap: 7, paddingRight: 8 },
  bossCard: { width: 102, minHeight: 119, alignItems: 'center', borderWidth: 1, borderColor: '#344a4b', borderRadius: 8, padding: 6, backgroundColor: '#111b1c' },
  bossActive: { borderColor: '#43d7ca', backgroundColor: '#1c5a56' },
  bossStage: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  bossImage: { width: '92%', height: '92%' },
  maxIcon: { position: 'absolute', right: 0, top: 0, width: 22, height: 22 },
  bossName: { minHeight: 30, color: '#eef6f5', fontSize: 9, lineHeight: 12, fontWeight: '900', textAlign: 'center' },
  resultsPanel: { gap: 4, marginTop: 2, borderWidth: 1, borderColor: '#315253', borderRadius: 8, padding: 12, backgroundColor: '#0e1718' },
  resultsContext: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankedPill: { borderWidth: 1, borderColor: '#3b5c5d', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, color: '#a9c2c1', fontSize: 6.5, fontWeight: '900' },
  rankedPillLight: { color: '#526568' },
  resultsTitle: { color: '#fff', fontSize: 18, lineHeight: 21, fontWeight: '900' },
  assumptions: { color: '#9bb0af', fontSize: 8, lineHeight: 11 },
  search: { minHeight: 45, marginTop: 6, borderWidth: 1, borderColor: '#3b5152', borderRadius: 999, paddingHorizontal: 15, color: '#fff', backgroundColor: '#091112', fontSize: 13, fontWeight: '700' },
  state: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 15 },
  stateCopy: { color: '#9eb0af', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  error: { gap: 6, marginTop: 5, borderWidth: 1, borderColor: '#e45d77', borderRadius: 8, padding: 10, backgroundColor: '#39151e' },
  errorTitle: { color: '#ffd8df', fontSize: 13, fontWeight: '900' },
  errorCopy: { color: '#ffb8c4', fontSize: 10 },
  retry: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', borderRadius: 7, paddingHorizontal: 12, backgroundColor: '#df5770' },
  retryText: { color: '#fff', fontWeight: '900' },
  resultsEmpty: { minHeight: 176, alignItems: 'center', justifyContent: 'center', gap: 4 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  method: { gap: 6, minHeight: 43, justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#315253', paddingHorizontal: 8, paddingVertical: 10 },
  methodTitle: { color: '#c8dcda', fontSize: 10, fontWeight: '900' },
  methodCopy: { color: '#96aaa8', fontSize: 9, lineHeight: 14 },
});
