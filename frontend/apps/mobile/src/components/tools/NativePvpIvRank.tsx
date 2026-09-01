import { useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PokemonInstance } from "@pokemongonexus/shared-contracts/instances";
import type {
  BasePokemon,
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
} from "@pokemongonexus/shared-contracts/pokemon";
import createPokemonVariants from "@pokemongonexus/app-core/pokemon-variants";
import {
  buildPvPIvPokemonOptions,
  type PvPIvPokemonOption,
} from "@pokemongonexus/app-core/pvp-iv-pokemon";
import {
  buildPvPIvRankings,
  rankPvPIvSpread,
} from "@pokemongonexus/app-core/pvp-iv-rank";
import {
  buildOwnedPvPIvRoster,
  rankOwnedPvPIvEntries,
  type OwnedPvPIvEntry,
} from "@pokemongonexus/app-core/pvp-iv-roster";
import { NativeUiIcon } from "../NativeUiIcon";

type IvField = "attack" | "defense" | "stamina";
type Scope = "catalog" | "owned";

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  cpLimit: number | null;
  instances: Record<string, PokemonInstance>;
  isLoading: boolean;
  league: PokemonPvPLeagueKey;
  light: boolean;
  rankings: PokemonPvPRankingEntry[];
  scope: Scope;
  setScope: (scope: Scope) => void;
  signedIn: boolean;
};

const absoluteUri = (base: string, value: string): string | undefined => {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const leagueLabel = (league: PokemonPvPLeagueKey): string =>
  league === "great"
    ? "Great League"
    : league === "ultra"
      ? "Ultra League"
      : "Master League";

const formatLevel = (level: number): string =>
  Number.isInteger(level) ? String(level) : level.toFixed(1);

const formatCurrentDetails = (entry: OwnedPvPIvEntry): string => {
  const details = [
    entry.cp == null ? null : `CP ${entry.cp.toLocaleString()}`,
    entry.level == null ? null : `Level ${formatLevel(entry.level)}`,
  ].filter((value): value is string => value != null);
  return details.length ? details.join(" · ") : "Current CP and level not recorded";
};

const IvStepper = ({
  field,
  label,
  light,
  onChange,
  value,
}: {
  field: IvField;
  label: string;
  light: boolean;
  onChange: (field: IvField, value: number) => void;
  value: number;
}) => (
  <View style={styles.stepper}>
    <Text style={[styles.stepperLabel, light && styles.mutedLight]}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable
        accessibilityLabel={`Decrease ${label} IV`}
        accessibilityRole="button"
        disabled={value <= 0}
        onPress={() => onChange(field, value - 1)}
        style={[styles.stepperButton, light && styles.controlLight, value <= 0 && styles.disabled]}
      >
        <Text style={[styles.stepperButtonText, light && styles.textLight]}>−</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={`${label} IV`}
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={(text) => onChange(field, Number(text) || 0)}
        selectTextOnFocus
        style={[styles.stepperInput, light && styles.inputLight]}
        value={String(value)}
      />
      <Pressable
        accessibilityLabel={`Increase ${label} IV`}
        accessibilityRole="button"
        disabled={value >= 15}
        onPress={() => onChange(field, value + 1)}
        style={[styles.stepperButton, light && styles.controlLight, value >= 15 && styles.disabled]}
      >
        <Text style={[styles.stepperButtonText, light && styles.textLight]}>+</Text>
      </Pressable>
    </View>
  </View>
);

export const NativePvpIvRank = ({
  assetBaseUrl,
  catalog,
  cpLimit,
  instances,
  isLoading,
  league,
  light,
  rankings,
  scope,
  setScope,
  signedIn,
}: Props) => {
  const [query, setQuery] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [ivs, setIvs] = useState({ attack: 0, defense: 15, stamina: 15 });
  const [bestBuddy, setBestBuddy] = useState(false);
  const deferredBestBuddy = useDeferredValue(bestBuddy);
  const deferredQuery = useDeferredValue(query);
  const variants = useMemo(
    () => createPokemonVariants(catalog),
    [catalog],
  );
  const pokemonOptions = useMemo(
    () => buildPvPIvPokemonOptions(variants),
    [variants],
  );
  const ownedRoster = useMemo(
    () => buildOwnedPvPIvRoster(pokemonOptions, variants, instances, rankings),
    [instances, pokemonOptions, rankings, variants],
  );
  const rankedOwnedEntries = useMemo(
    () => rankOwnedPvPIvEntries(
      ownedRoster.entries,
      league,
      deferredBestBuddy ? 51 : 50,
      cpLimit,
    ),
    [cpLimit, deferredBestBuddy, league, ownedRoster.entries],
  );
  const ownedOptions = useMemo(() => {
    const unique = new Map<string, PvPIvPokemonOption>();
    rankedOwnedEntries.forEach(({ entry }) => unique.set(entry.pokemon.id, entry.pokemon));
    return [...unique.values()];
  }, [rankedOwnedEntries]);
  const availableOptions = scope === "owned" ? ownedOptions : pokemonOptions;
  const selectedOption = selectedOptionId == null
    ? null
    : availableOptions.find((option) => option.id === selectedOptionId) ?? null;
  const deferredSelectedOption = useDeferredValue(selectedOption);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
  const matchingCatalog = useMemo(
    () => pokemonOptions
      .filter((option) =>
        !normalizedQuery ||
        option.name.toLocaleLowerCase().includes(normalizedQuery) ||
        String(option.pokedexNumber).includes(normalizedQuery),
      )
      .slice(0, 24),
    [normalizedQuery, pokemonOptions],
  );
  const matchingOwned = useMemo(
    () => rankedOwnedEntries.filter(({ entry }) => {
      return !normalizedQuery ||
        entry.pokemon.name.toLocaleLowerCase().includes(normalizedQuery) ||
        String(entry.nickname ?? "").toLocaleLowerCase().includes(normalizedQuery) ||
        String(entry.pokemon.pokedexNumber).includes(normalizedQuery);
    }),
    [normalizedQuery, rankedOwnedEntries],
  );
  const ivRankings = useMemo(
    () => deferredSelectedOption?.id === selectedOption?.id && deferredSelectedOption
      ? buildPvPIvRankings(
          {
            attack: deferredSelectedOption.attack,
            defense: deferredSelectedOption.defense,
            stamina: deferredSelectedOption.stamina,
          },
          league,
          deferredBestBuddy ? 51 : 50,
        )
      : [],
    [deferredBestBuddy, deferredSelectedOption, league, selectedOption?.id],
  );
  const rankedOwnedCopies = useMemo(() => {
    if (!selectedOption || scope !== "owned") return [];
    return rankedOwnedEntries
      .filter(({ entry }) => entry.pokemon.id === selectedOption.id)
      .map(({ entry }) => ({ entry, result: rankPvPIvSpread(ivRankings, entry.ivs) }))
      .filter((item): item is { entry: OwnedPvPIvEntry; result: NonNullable<ReturnType<typeof rankPvPIvSpread>> } => item.result != null)
      .sort((left, right) => (
        left.result.selected.rank - right.result.selected.rank ||
        left.entry.instanceId.localeCompare(right.entry.instanceId)
      ));
  }, [ivRankings, rankedOwnedEntries, scope, selectedOption]);
  const selectedOwnedCopy =
    rankedOwnedCopies.find(({ entry }) => entry.instanceId === selectedInstanceId) ??
    rankedOwnedCopies[0] ??
    null;
  const evaluatedIvs = scope === "owned" && selectedOwnedCopy
    ? selectedOwnedCopy.entry.ivs
    : ivs;
  const deferredEvaluatedIvs = useDeferredValue(evaluatedIvs);
  const result = useMemo(
    () => rankPvPIvSpread(ivRankings, deferredEvaluatedIvs),
    [deferredEvaluatedIvs, ivRankings],
  );
  const changeScope = (next: Scope) => {
    if (next === "owned" && !signedIn) return;
    setScope(next);
    setSelectedOptionId(null);
    setSelectedInstanceId(null);
    setQuery("");
  };
  const chooseCatalog = (option: PvPIvPokemonOption) => {
    setSelectedOptionId(option.id);
    setSelectedInstanceId(null);
    setQuery(option.name);
  };
  const chooseOwned = (entry: OwnedPvPIvEntry) => {
    setSelectedOptionId(entry.pokemon.id);
    setSelectedInstanceId(entry.instanceId);
    setQuery(entry.nickname || entry.pokemon.name);
  };
  const updateIv = (field: IvField, value: number) =>
    setIvs((current) => ({ ...current, [field]: Math.max(0, Math.min(15, Math.round(value))) }));
  const clearSelection = () => {
    setQuery("");
    setSelectedOptionId(null);
    setSelectedInstanceId(null);
  };

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.eyebrow, light && styles.accentLight]}>IV RANK</Text>
          <Text style={[styles.title, light && styles.textLight]}>Find the strongest IV spread for this league</Text>
        </View>
        <View style={[styles.leaguePill, light && styles.leaguePillLight]}>
          <Text style={[styles.leagueText, light && styles.accentLight]}>{leagueLabel(league)}</Text>
        </View>
      </View>

      <View style={[styles.scope, light && styles.panelLight]}>
        <Pressable accessibilityRole="button" onPress={() => changeScope("catalog")} style={[styles.scopeButton, scope === "catalog" && styles.scopeActive]}>
          <View style={styles.iconLabelRow}><NativeUiIcon color={scope === "catalog" ? '#071313' : light ? '#071d20' : '#f5ffff'} name="catalog" size={14} /><Text style={[styles.scopeText, light && styles.textLight, scope === "catalog" && styles.activeText]}>All Pokémon</Text></View>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!signedIn} onPress={() => changeScope("owned")} style={[styles.scopeButton, scope === "owned" && styles.scopeActive, !signedIn && styles.disabled]}>
          <View style={styles.iconLabelRow}><NativeUiIcon color={scope === "owned" ? '#071313' : light ? '#071d20' : '#f5ffff'} name="trainers" size={14} /><Text style={[styles.scopeText, light && styles.textLight, scope === "owned" && styles.activeText]}>My Pokémon{signedIn && !isLoading ? `  ${rankedOwnedEntries.length}` : ""}</Text></View>
        </Pressable>
      </View>

      {scope === "owned" ? (
        <Text accessibilityLiveRegion="polite" style={[styles.rosterSummary, light && styles.mutedLight]}>
          {isLoading && Object.keys(instances).length === 0
            ? "Loading your caught Pokémon…"
            : `${rankedOwnedEntries.length} eligible for ${leagueLabel(league)}${ownedRoster.completeCount > rankedOwnedEntries.length ? ` · ${ownedRoster.completeCount - rankedOwnedEntries.length} over cap hidden` : ""}${ownedRoster.incompleteCount > 0 ? ` · ${ownedRoster.incompleteCount} need appraisal IVs` : ""}`}
        </Text>
      ) : null}

      <View style={[styles.controls, light && styles.panelLight]}>
        <Text style={[styles.searchLabel, light && styles.accentLight]}>{scope === "owned" ? "YOUR POKÉMON" : "POKÉMON OR POKÉDEX NUMBER"}</Text>
        <View style={[styles.searchBox, light && styles.inputLight]}>
          <NativeUiIcon color={light ? '#4c7073' : '#9db6b8'} name="search" size={18} />
          <TextInput
            accessibilityLabel="Search IV Rank Pokémon"
            onChangeText={(value) => { setQuery(value); if (selectedOption) { setSelectedOptionId(null); setSelectedInstanceId(null); } }}
            placeholder={scope === "owned" ? "Search species or nickname" : "Search Pokémon"}
            placeholderTextColor="#7b9092"
            style={[styles.searchInput, light && styles.textLight]}
            value={query}
          />
          {query ? <Pressable accessibilityLabel="Clear IV Rank Pokémon" accessibilityRole="button" onPress={clearSelection}><Text style={[styles.clear, light && styles.mutedLight]}>×</Text></Pressable> : null}
        </View>

        {!selectedOption ? (
          <View style={styles.browser}>
            {scope === "owned" && !isLoading ? (
              <View style={styles.browserSummary}><Text style={[styles.searchLabel, light && styles.accentLight]}>APPRAISED POKÉMON</Text><Text style={[styles.summaryCopy, light && styles.mutedLight]}>Recommended order · {matchingOwned.length} shown</Text></View>
            ) : null}
            {isLoading && catalog.length === 0 ? (
              <View style={styles.loading}><ActivityIndicator color="#42d5c2" /><Text style={[styles.summaryCopy, light && styles.mutedLight]}>Loading the Pokémon catalog…</Text></View>
            ) : scope === "owned" && isLoading && Object.keys(instances).length === 0 ? (
              <View style={styles.loading}><ActivityIndicator color="#42d5c2" /><Text style={[styles.summaryCopy, light && styles.mutedLight]}>Loading your caught Pokémon…</Text></View>
            ) : (scope === "owned" ? matchingOwned : matchingCatalog).length ? (
              <View style={styles.optionGrid}>
                {scope === "owned"
                  ? matchingOwned.map((rankedEntry) => {
                      const { entry } = rankedEntry;
                      return <Pressable accessibilityLabel={`Check ${entry.nickname || entry.pokemon.name}, ${entry.pokemon.name}, IV ${entry.ivs.attack}/${entry.ivs.defense}/${entry.ivs.stamina}, ${entry.metaRank == null ? "not meta ranked" : `Meta rank ${entry.metaRank}`}, IV rank ${rankedEntry.ivRank}`} accessibilityRole="button" key={entry.instanceId} onPress={() => chooseOwned(entry)} style={[styles.option, light && styles.controlLight]}>
                        <Image fadeDuration={0} resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUrl) }} style={styles.optionImage} />
                        <View style={styles.optionCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(entry.pokemon.pokedexNumber).padStart(4, "0")} {entry.pokemon.name}</Text><Text numberOfLines={2} style={[styles.optionName, light && styles.textLight]}>{entry.nickname || entry.pokemon.name}{entry.favorite ? "  ★" : ""}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{formatCurrentDetails(entry)}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{entry.ivs.attack}/{entry.ivs.defense}/{entry.ivs.stamina} IV</Text><View style={styles.rankPills}><Text style={[styles.rankPill, entry.metaRank == null && styles.rankPillMuted]}>{entry.metaRank == null ? "Not ranked" : `Meta #${entry.metaRank}`}</Text><Text style={styles.rankPill}>IV #{rankedEntry.ivRank}</Text></View></View>
                      </Pressable>;
                    })
                  : matchingCatalog.map((option) => <Pressable accessibilityRole="button" key={option.id} onPress={() => chooseCatalog(option)} style={[styles.option, light && styles.controlLight]}>
                      <Image fadeDuration={0} resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, option.imageUrl) }} style={styles.optionImage} />
                      <View style={styles.optionCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(option.pokedexNumber).padStart(4, "0")}</Text><Text numberOfLines={2} style={[styles.optionName, light && styles.textLight]}>{option.name}</Text></View>
                    </Pressable>)}
              </View>
            ) : <Text style={[styles.empty, light && styles.mutedLight]}>{scope === "owned" ? "No appraised caught Pokémon match that search." : "No Pokémon match that search."}</Text>}
          </View>
        ) : (
          <>
            <View style={[styles.selected, light && styles.controlLight]}>
              <Image fadeDuration={0} resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, selectedOwnedCopy?.entry.imageUrl ?? selectedOption.imageUrl) }} style={styles.selectedImage} />
              <View style={styles.selectedCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(selectedOption.pokedexNumber).padStart(4, "0")}</Text><Text style={[styles.selectedName, light && styles.textLight]}>{selectedOption.name}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{selectedOption.types.join(" / ")}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{scope === "owned" ? `${rankedOwnedCopies.length} ${rankedOwnedCopies.length === 1 ? "caught copy" : "caught copies"} with complete IVs` : `${selectedOption.attack} ATK · ${selectedOption.defense} DEF · ${selectedOption.stamina} STA`}</Text></View>
            </View>
            {scope === "catalog" ? <View style={styles.ivInputs}>
              <Text style={[styles.searchLabel, light && styles.accentLight]}>APPRAISAL IVS</Text>
              <View style={styles.stepperGrid}>
                <IvStepper field="attack" label="Attack" light={light} onChange={updateIv} value={ivs.attack} />
                <IvStepper field="defense" label="Defense" light={light} onChange={updateIv} value={ivs.defense} />
                <IvStepper field="stamina" label="HP" light={light} onChange={updateIv} value={ivs.stamina} />
              </View>
            </View> : selectedOption ? (
              <View style={styles.copyBrowser}>
                <View style={styles.browserSummary}><Text style={[styles.searchLabel, light && styles.accentLight]}>YOUR COPIES</Text><Text style={[styles.summaryCopy, light && styles.mutedLight]}>Best IV rank first</Text></View>
                {rankedOwnedCopies.map(({ entry, result: copyResult }) => {
                  const active = selectedOwnedCopy?.entry.instanceId === entry.instanceId;
                  return <Pressable accessibilityLabel={`View ${entry.nickname || entry.pokemon.name}, IV Rank ${copyResult.selected.rank}`} accessibilityRole="button" key={entry.instanceId} onPress={() => setSelectedInstanceId(entry.instanceId)} style={[styles.copy, light && styles.controlLight, active && styles.copyActive]}>
                    <Image fadeDuration={0} resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUrl) }} style={styles.copyImage} />
                    <View style={styles.optionCopy}><Text style={[styles.optionName, light && styles.textLight]}>{entry.nickname || entry.pokemon.name}{entry.favorite ? "  ★" : ""}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{formatCurrentDetails(entry)}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{entry.ivs.attack}/{entry.ivs.defense}/{entry.ivs.stamina} IV</Text></View>
                    <Text style={styles.copyRank}>#{copyResult.selected.rank}</Text>
                  </Pressable>;
                })}
              </View>
            ) : null}
            <View style={styles.levelControls}>
              <Pressable accessibilityRole="button" disabled={!selectedOption} onPress={() => setBestBuddy(false)} style={[styles.levelButton, light && styles.controlLight, !bestBuddy && styles.levelActive]}><Text style={[styles.levelButtonText, light && styles.textLight, !bestBuddy && styles.activeText]}>Level 50</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={!selectedOption} onPress={() => setBestBuddy(true)} style={[styles.levelButton, light && styles.controlLight, bestBuddy && styles.levelActive]}><Text style={[styles.levelButtonText, light && styles.textLight, bestBuddy && styles.activeText]}>★ Best Buddy 51</Text></Pressable>
            </View>
          </>
        )}
      </View>

      {selectedOption && result ? <View accessibilityLiveRegion="polite" style={[styles.result, light && styles.panelLight]}>
        {scope === "owned" && selectedOwnedCopy ? <View style={[styles.resultContext, light && styles.controlLight]}><Text style={[styles.optionName, light && styles.textLight]}>{selectedOwnedCopy.entry.nickname || selectedOwnedCopy.entry.pokemon.name}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{selectedOwnedCopy.entry.ivs.attack}/{selectedOwnedCopy.entry.ivs.defense}/{selectedOwnedCopy.entry.ivs.stamina} IV · {formatCurrentDetails(selectedOwnedCopy.entry)}</Text></View> : null}
        <View style={styles.resultHero}>
          <View style={styles.rankBlock}><Text style={styles.topPercent}>TOP {Math.max(0.1, (result.selected.rank / result.total) * 100).toFixed(result.selected.rank / result.total < 0.01 ? 1 : 0)}%</Text><Text style={[styles.resultRank, light && styles.textLight]}>#{result.selected.rank}</Text><Text style={[styles.resultOf, light && styles.mutedLight]}>of {result.total.toLocaleString()}</Text></View>
          <View style={styles.productBlock}><Text style={[styles.productLabel, light && styles.mutedLight]}>STAT PRODUCT</Text><Text style={styles.productValue}>{result.selected.statProductPercent.toFixed(2)}%</Text></View>
        </View>
        <View style={styles.statGrid}>{[["Level", formatLevel(result.selected.level)], ["CP", result.selected.cp.toLocaleString()], ["Attack", result.selected.battleAttack.toFixed(1)], ["Defense", result.selected.battleDefense.toFixed(1)], ["HP", String(result.selected.battleHp)]].map(([label, value]) => <View key={label} style={styles.stat}><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text><Text style={[styles.statValue, light && styles.textLight]}>{value}</Text></View>)}</View>
        <View style={[styles.best, light && styles.bestLight]}><View><Text style={[styles.productLabel, light && styles.mutedLight]}>RANK 1 SPREAD</Text><Text style={[styles.bestIvs, light && styles.textLight]}>{result.best.attack}/{result.best.defense}/{result.best.stamina}</Text></View><Text style={[styles.bestMeta, light && styles.mutedLight]}>Level {formatLevel(result.best.level)} · CP {result.best.cp.toLocaleString()}</Text></View>
        <Text style={[styles.nearbyTitle, light && styles.accentLight]}>NEARBY RANKS</Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}><View style={styles.table}>{result.nearby.map((spread) => <View key={`${spread.attack}-${spread.defense}-${spread.stamina}`} style={[styles.tableRow, spread.rank === result.selected.rank && styles.tableSelected]}><Text style={[styles.tableRank, light && styles.textLight]}>#{spread.rank}</Text><Text style={[styles.tableIvs, light && styles.textLight]}>{spread.attack}/{spread.defense}/{spread.stamina}</Text><Text style={[styles.tableMeta, light && styles.mutedLight]}>Lv {formatLevel(spread.level)} · CP {spread.cp.toLocaleString()}</Text><Text style={styles.tableProduct}>{spread.statProductPercent.toFixed(2)}%</Text></View>)}</View></ScrollView>
      </View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 8 },
  heading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10, paddingHorizontal: 3 },
  eyebrow: { color: "#8fc6cb", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  accentLight: { color: "#08766b" },
  title: { maxWidth: 275, marginTop: 2, color: "#f5ffff", fontSize: 17, lineHeight: 21, fontWeight: "900" },
  textLight: { color: "#071d20" }, mutedLight: { color: "#4c7073" },
  leaguePill: { borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  leaguePillLight: { borderColor: "#7dbdb9", backgroundColor: "#f8ffff" },
  leagueText: { color: "#42d5c2", fontSize: 9, fontWeight: "900" },
  scope: { flexDirection: "row", gap: 5, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 5, backgroundColor: "#101516" },
  iconLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  panelLight: { borderColor: "#b2d2d2", backgroundColor: "#fff" },
  scopeButton: { minWidth: 0, flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  scopeActive: { backgroundColor: "#42d5c2" }, scopeText: { color: "#f5ffff", fontSize: 11, fontWeight: "900" }, activeText: { color: "#071313" },
  rosterSummary: { paddingHorizontal: 7, color: "#9db6b8", fontSize: 9.5, lineHeight: 14, textAlign: "center" },
  disabled: { opacity: 0.45 },
  controls: { gap: 8, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 9, backgroundColor: "#151a1b" },
  searchLabel: { color: "#8fc6cb", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  searchBox: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 12, backgroundColor: "#101516" },
  inputLight: { borderColor: "#8dc3c3", backgroundColor: "#fbffff" }, searchIcon: { color: "#9db6b8", fontSize: 22 }, searchInput: { minWidth: 0, flex: 1, minHeight: 43, color: "#f5ffff", fontSize: 14 }, clear: { color: "#9db6b8", fontSize: 23 },
  browser: { gap: 6 }, browserSummary: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, summaryCopy: { color: "#9db6b8", fontSize: 9, fontWeight: "700" },
  loading: { minHeight: 80, alignItems: "center", justifyContent: "center", gap: 8 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  option: { width: "49.2%", minHeight: 67, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 5, backgroundColor: "#1d2425" },
  controlLight: { borderColor: "#c4dada", backgroundColor: "#f7fbfb" }, optionImage: { width: 48, height: 48 }, optionCopy: { minWidth: 0, flex: 1 }, optionNumber: { color: "#9db6b8", fontSize: 8, fontWeight: "700" }, optionName: { color: "#f5ffff", fontSize: 10, fontWeight: "900" }, optionMeta: { color: "#9db6b8", fontSize: 8 }, empty: { paddingVertical: 24, color: "#9db6b8", fontSize: 11, textAlign: "center" },
  rankPills: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 3 },
  rankPill: { borderRadius: 999, paddingHorizontal: 4, paddingVertical: 2, color: "#071313", backgroundColor: "#42d5c2", fontSize: 6.5, fontWeight: "900", overflow: "hidden" },
  rankPillMuted: { color: "#c5d4d4", backgroundColor: "#526264" },
  selected: { minHeight: 79, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 7, backgroundColor: "#1d2425" }, selectedImage: { width: 65, height: 65 }, selectedCopy: { minWidth: 0, flex: 1 }, selectedName: { color: "#f5ffff", fontSize: 16, fontWeight: "900" },
  ivInputs: { gap: 6 }, stepperGrid: { flexDirection: "row", gap: 5 }, stepper: { minWidth: 0, flex: 1 }, stepperLabel: { marginBottom: 4, color: "#9db6b8", fontSize: 8, fontWeight: "900", textTransform: "uppercase" }, stepperControls: { flexDirection: "row", gap: 3 }, stepperButton: { width: 31, minHeight: 39, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 6, backgroundColor: "#101516" }, stepperButtonText: { color: "#f5ffff", fontSize: 18, fontWeight: "900" }, stepperInput: { minWidth: 0, flex: 1, minHeight: 39, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 6, color: "#f5ffff", backgroundColor: "#101516", fontSize: 15, fontWeight: "900", textAlign: "center" },
  copyBrowser: { gap: 5 },
  copy: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 6, backgroundColor: "#1d2425" },
  copyActive: { borderColor: "#42d5c2", backgroundColor: "rgba(66,213,194,0.08)" },
  copyImage: { width: 47, height: 47 },
  copyRank: { minWidth: 44, color: "#42d5c2", fontSize: 17, fontWeight: "900", textAlign: "right" },
  levelControls: { flexDirection: "row", gap: 5 }, levelButton: { minWidth: 0, flex: 1, minHeight: 39, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, backgroundColor: "#101516" }, levelActive: { borderColor: "#42d5c2", backgroundColor: "#42d5c2" }, levelButtonText: { color: "#f5ffff", fontSize: 10, fontWeight: "900" },
  result: { gap: 10, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 10, backgroundColor: "#151a1b" }, resultContext: { gap: 2, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 7, backgroundColor: "#1d2425" }, resultHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rankBlock: { flexDirection: "row", alignItems: "baseline", gap: 6 }, topPercent: { color: "#071313", backgroundColor: "#42d5c2", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: "900" }, resultRank: { color: "#f5ffff", fontSize: 32, fontWeight: "900" }, resultOf: { color: "#9db6b8", fontSize: 9 }, productBlock: { alignItems: "flex-end" }, productLabel: { color: "#9db6b8", fontSize: 8, fontWeight: "900" }, productValue: { color: "#42d5c2", fontSize: 20, fontWeight: "900" },
  statGrid: { flexDirection: "row", gap: 4 }, stat: { minWidth: 0, flex: 1, borderLeftWidth: 2, borderColor: "#54a9ef", paddingLeft: 5 }, statLabel: { color: "#9db6b8", fontSize: 7, fontWeight: "800" }, statValue: { color: "#f5ffff", fontSize: 11, fontWeight: "900" },
  best: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderColor: "rgba(242,202,88,0.38)", borderRadius: 6, padding: 8, backgroundColor: "rgba(242,202,88,0.07)" }, bestLight: { backgroundColor: "#fff9e6" }, bestIvs: { color: "#f5ffff", fontSize: 14, fontWeight: "900" }, bestMeta: { color: "#9db6b8", fontSize: 9, fontWeight: "700" }, nearbyTitle: { color: "#8fc6cb", fontSize: 9, fontWeight: "900" }, table: { gap: 4 }, tableRow: { minWidth: 315, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(141,192,194,0.2)", borderRadius: 5, padding: 7 }, tableSelected: { borderColor: "#42d5c2", backgroundColor: "rgba(66,213,194,0.08)" }, tableRank: { width: 35, color: "#f5ffff", fontSize: 10, fontWeight: "900" }, tableIvs: { width: 58, color: "#f5ffff", fontSize: 10, fontWeight: "900" }, tableMeta: { flex: 1, color: "#9db6b8", fontSize: 9 }, tableProduct: { color: "#42d5c2", fontSize: 9, fontWeight: "900" },
});
