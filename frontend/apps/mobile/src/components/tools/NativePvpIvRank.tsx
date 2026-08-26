import { useMemo, useState } from "react";
import {
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
} from "@pokemongonexus/shared-contracts/pokemon";
import { calculateNativePvpIvSummary } from "../../features/tools/nativePvpModel";
import {
  buildNativePvpIvPokemonOptions,
  nativePvpIvOptionImage,
  resolveNativePvpIvOptionForInstance,
  type NativePvpIvPokemonOption,
} from "../../features/tools/nativePvpIvPokemon";

type IvField = "attack" | "defense" | "stamina";
type Scope = "catalog" | "owned";

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  instances: Record<string, PokemonInstance>;
  league: PokemonPvPLeagueKey;
  light: boolean;
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
  instances,
  league,
  light,
  scope,
  setScope,
  signedIn,
}: Props) => {
  const [query, setQuery] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [ivs, setIvs] = useState({ attack: 0, defense: 15, stamina: 15 });
  const [bestBuddy, setBestBuddy] = useState(false);
  const pokemonById = useMemo(
    () => new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon])),
    [catalog],
  );
  const pokemonOptions = useMemo(
    () => buildNativePvpIvPokemonOptions(catalog),
    [catalog],
  );
  const owned = useMemo(
    () => Object.entries(instances)
      .flatMap(([sourceKey, instance]) => {
        const pokemon = pokemonById.get(instance.pokemon_id);
        if (
          !pokemon ||
          !instance.is_caught ||
          instance.disabled ||
          instance.is_mega ||
          instance.mega ||
          instance.attack_iv == null ||
          instance.defense_iv == null ||
          instance.stamina_iv == null
        ) return [];
        const option = resolveNativePvpIvOptionForInstance(instance, pokemon, pokemonOptions);
        if (!option) return [];
        return [{
          id: String(instance.instance_id || sourceKey),
          instance,
          option,
        }];
      })
      .sort((left, right) =>
        left.option.pokedexNumber - right.option.pokedexNumber ||
        left.option.name.localeCompare(right.option.name),
      ),
    [instances, pokemonById, pokemonOptions],
  );
  const selectedOption = selectedOptionId == null
    ? null
    : pokemonOptions.find((option) => option.id === selectedOptionId) ?? null;
  const selectedInstance = selectedInstanceId == null
    ? null
    : owned.find((entry) => entry.id === selectedInstanceId)?.instance ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
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
    () => owned.filter(({ instance, option }) => {
      return !normalizedQuery ||
        option.name.toLocaleLowerCase().includes(normalizedQuery) ||
        String(instance.nickname ?? "").toLocaleLowerCase().includes(normalizedQuery) ||
        String(option.pokedexNumber).includes(normalizedQuery);
    }),
    [normalizedQuery, owned],
  );
  const evaluatedAttack = selectedInstance ? Number(selectedInstance.attack_iv) : ivs.attack;
  const evaluatedDefense = selectedInstance ? Number(selectedInstance.defense_iv) : ivs.defense;
  const evaluatedStamina = selectedInstance ? Number(selectedInstance.stamina_iv) : ivs.stamina;
  const result = useMemo(
    () => selectedOption
      ? calculateNativePvpIvSummary(
          selectedOption.evaluationPokemon,
          { attack: evaluatedAttack, defense: evaluatedDefense, stamina: evaluatedStamina },
          league,
          bestBuddy ? 51 : 50,
        )
      : null,
    [bestBuddy, evaluatedAttack, evaluatedDefense, evaluatedStamina, league, selectedOption],
  );
  const changeScope = (next: Scope) => {
    if (next === "owned" && !signedIn) return;
    setScope(next);
    setSelectedOptionId(null);
    setSelectedInstanceId(null);
    setQuery("");
  };
  const chooseCatalog = (option: NativePvpIvPokemonOption) => {
    setSelectedOptionId(option.id);
    setSelectedInstanceId(null);
    setQuery(option.name);
  };
  const chooseOwned = (entry: (typeof owned)[number]) => {
    setSelectedOptionId(entry.option.id);
    setSelectedInstanceId(entry.id);
    setQuery(entry.instance.nickname || entry.option.name);
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
          <Text style={[styles.scopeText, light && styles.textLight, scope === "catalog" && styles.activeText]}>⚑ All Pokémon</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!signedIn} onPress={() => changeScope("owned")} style={[styles.scopeButton, scope === "owned" && styles.scopeActive, !signedIn && styles.disabled]}>
          <Text style={[styles.scopeText, light && styles.textLight, scope === "owned" && styles.activeText]}>♟ My Pokémon{signedIn ? `  ${owned.length}` : ""}</Text>
        </Pressable>
      </View>

      <View style={[styles.controls, light && styles.panelLight]}>
        <Text style={[styles.searchLabel, light && styles.accentLight]}>{scope === "owned" ? "YOUR POKÉMON" : "POKÉMON OR POKÉDEX NUMBER"}</Text>
        <View style={[styles.searchBox, light && styles.inputLight]}>
          <Text style={[styles.searchIcon, light && styles.mutedLight]}>⌕</Text>
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
            {scope === "owned" ? (
              <View style={styles.browserSummary}><Text style={[styles.searchLabel, light && styles.accentLight]}>APPRAISED POKÉMON</Text><Text style={[styles.summaryCopy, light && styles.mutedLight]}>{matchingOwned.length} shown</Text></View>
            ) : null}
            {(scope === "owned" ? matchingOwned : matchingCatalog).length ? (
              <View style={styles.optionGrid}>
                {scope === "owned"
                  ? matchingOwned.map((entry) => {
                      const { instance, option } = entry;
                      return <Pressable accessibilityRole="button" key={entry.id} onPress={() => chooseOwned(entry)} style={[styles.option, light && styles.controlLight]}>
                        <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, nativePvpIvOptionImage(option, instance.shiny)) }} style={styles.optionImage} />
                        <View style={styles.optionCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(option.pokedexNumber).padStart(4, "0")}</Text><Text numberOfLines={2} style={[styles.optionName, light && styles.textLight]}>{instance.nickname || option.name}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{instance.attack_iv}/{instance.defense_iv}/{instance.stamina_iv} IV</Text></View>
                      </Pressable>;
                    })
                  : matchingCatalog.map((option) => <Pressable accessibilityRole="button" key={option.id} onPress={() => chooseCatalog(option)} style={[styles.option, light && styles.controlLight]}>
                      <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, option.imageUrl) }} style={styles.optionImage} />
                      <View style={styles.optionCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(option.pokedexNumber).padStart(4, "0")}</Text><Text numberOfLines={2} style={[styles.optionName, light && styles.textLight]}>{option.name}</Text></View>
                    </Pressable>)}
              </View>
            ) : <Text style={[styles.empty, light && styles.mutedLight]}>{scope === "owned" ? "No appraised caught Pokémon match that search." : "No Pokémon match that search."}</Text>}
          </View>
        ) : (
          <>
            <View style={[styles.selected, light && styles.controlLight]}>
              <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, nativePvpIvOptionImage(selectedOption, selectedInstance?.shiny)) }} style={styles.selectedImage} />
              <View style={styles.selectedCopy}><Text style={[styles.optionNumber, light && styles.mutedLight]}>#{String(selectedOption.pokedexNumber).padStart(4, "0")}</Text><Text style={[styles.selectedName, light && styles.textLight]}>{selectedInstance?.nickname || selectedOption.name}</Text><Text style={[styles.optionMeta, light && styles.mutedLight]}>{selectedOption.types.join(" / ")}</Text></View>
            </View>
            {scope === "catalog" ? <View style={styles.ivInputs}>
              <Text style={[styles.searchLabel, light && styles.accentLight]}>APPRAISAL IVS</Text>
              <View style={styles.stepperGrid}>
                <IvStepper field="attack" label="Attack" light={light} onChange={updateIv} value={ivs.attack} />
                <IvStepper field="defense" label="Defense" light={light} onChange={updateIv} value={ivs.defense} />
                <IvStepper field="stamina" label="HP" light={light} onChange={updateIv} value={ivs.stamina} />
              </View>
            </View> : null}
            <View style={styles.levelControls}>
              <Pressable accessibilityRole="button" disabled={!selectedOption} onPress={() => setBestBuddy(false)} style={[styles.levelButton, light && styles.controlLight, !bestBuddy && styles.levelActive]}><Text style={[styles.levelButtonText, light && styles.textLight, !bestBuddy && styles.activeText]}>Level 50</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={!selectedOption} onPress={() => setBestBuddy(true)} style={[styles.levelButton, light && styles.controlLight, bestBuddy && styles.levelActive]}><Text style={[styles.levelButtonText, light && styles.textLight, bestBuddy && styles.activeText]}>★ Best Buddy 51</Text></Pressable>
            </View>
          </>
        )}
      </View>

      {selectedOption && result ? <View accessibilityLiveRegion="polite" style={[styles.result, light && styles.panelLight]}>
        <View style={styles.resultHero}>
          <View style={styles.rankBlock}><Text style={styles.topPercent}>TOP {Math.max(0.1, (result.rank / result.total) * 100).toFixed(result.rank / result.total < 0.01 ? 1 : 0)}%</Text><Text style={[styles.resultRank, light && styles.textLight]}>#{result.rank}</Text><Text style={[styles.resultOf, light && styles.mutedLight]}>of {result.total.toLocaleString()}</Text></View>
          <View style={styles.productBlock}><Text style={[styles.productLabel, light && styles.mutedLight]}>STAT PRODUCT</Text><Text style={styles.productValue}>{result.statProductPercent.toFixed(2)}%</Text></View>
        </View>
        <View style={styles.statGrid}>{[["Level", formatLevel(result.level)], ["CP", result.cp.toLocaleString()], ["Attack", result.battleAttack.toFixed(1)], ["Defense", result.battleDefense.toFixed(1)], ["HP", String(result.battleHp)]].map(([label, value]) => <View key={label} style={styles.stat}><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text><Text style={[styles.statValue, light && styles.textLight]}>{value}</Text></View>)}</View>
        <View style={[styles.best, light && styles.bestLight]}><View><Text style={[styles.productLabel, light && styles.mutedLight]}>RANK 1 SPREAD</Text><Text style={[styles.bestIvs, light && styles.textLight]}>{result.best.attack}/{result.best.defense}/{result.best.stamina}</Text></View><Text style={[styles.bestMeta, light && styles.mutedLight]}>Level {formatLevel(result.best.level)} · CP {result.best.cp.toLocaleString()}</Text></View>
        <Text style={[styles.nearbyTitle, light && styles.accentLight]}>NEARBY RANKS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.table}>{result.nearby.map((spread) => <View key={`${spread.attack}-${spread.defense}-${spread.stamina}`} style={[styles.tableRow, spread.rank === result.rank && styles.tableSelected]}><Text style={[styles.tableRank, light && styles.textLight]}>#{spread.rank}</Text><Text style={[styles.tableIvs, light && styles.textLight]}>{spread.attack}/{spread.defense}/{spread.stamina}</Text><Text style={[styles.tableMeta, light && styles.mutedLight]}>Lv {formatLevel(spread.level)} · CP {spread.cp.toLocaleString()}</Text><Text style={styles.tableProduct}>{spread.statProductPercent.toFixed(2)}%</Text></View>)}</View></ScrollView>
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
  panelLight: { borderColor: "#b2d2d2", backgroundColor: "#fff" },
  scopeButton: { minWidth: 0, flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  scopeActive: { backgroundColor: "#42d5c2" }, scopeText: { color: "#f5ffff", fontSize: 11, fontWeight: "900" }, activeText: { color: "#071313" },
  disabled: { opacity: 0.45 },
  controls: { gap: 8, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 9, backgroundColor: "#151a1b" },
  searchLabel: { color: "#8fc6cb", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  searchBox: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 12, backgroundColor: "#101516" },
  inputLight: { borderColor: "#8dc3c3", backgroundColor: "#fbffff" }, searchIcon: { color: "#9db6b8", fontSize: 22 }, searchInput: { minWidth: 0, flex: 1, minHeight: 43, color: "#f5ffff", fontSize: 14 }, clear: { color: "#9db6b8", fontSize: 23 },
  browser: { gap: 6 }, browserSummary: { flexDirection: "row", justifyContent: "space-between" }, summaryCopy: { color: "#9db6b8", fontSize: 9, fontWeight: "700" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  option: { width: "49.2%", minHeight: 67, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 5, backgroundColor: "#1d2425" },
  controlLight: { borderColor: "#c4dada", backgroundColor: "#f7fbfb" }, optionImage: { width: 48, height: 48 }, optionCopy: { minWidth: 0, flex: 1 }, optionNumber: { color: "#9db6b8", fontSize: 8, fontWeight: "700" }, optionName: { color: "#f5ffff", fontSize: 10, fontWeight: "900" }, optionMeta: { color: "#9db6b8", fontSize: 8 }, empty: { paddingVertical: 24, color: "#9db6b8", fontSize: 11, textAlign: "center" },
  selected: { minHeight: 79, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "rgba(141,192,194,0.23)", borderRadius: 6, padding: 7, backgroundColor: "#1d2425" }, selectedImage: { width: 65, height: 65 }, selectedCopy: { minWidth: 0, flex: 1 }, selectedName: { color: "#f5ffff", fontSize: 16, fontWeight: "900" },
  ivInputs: { gap: 6 }, stepperGrid: { flexDirection: "row", gap: 5 }, stepper: { minWidth: 0, flex: 1 }, stepperLabel: { marginBottom: 4, color: "#9db6b8", fontSize: 8, fontWeight: "900", textTransform: "uppercase" }, stepperControls: { flexDirection: "row", gap: 3 }, stepperButton: { width: 31, minHeight: 39, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 6, backgroundColor: "#101516" }, stepperButtonText: { color: "#f5ffff", fontSize: 18, fontWeight: "900" }, stepperInput: { minWidth: 0, flex: 1, minHeight: 39, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 6, color: "#f5ffff", backgroundColor: "#101516", fontSize: 15, fontWeight: "900", textAlign: "center" },
  levelControls: { flexDirection: "row", gap: 5 }, levelButton: { minWidth: 0, flex: 1, minHeight: 39, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, backgroundColor: "#101516" }, levelActive: { borderColor: "#42d5c2", backgroundColor: "#42d5c2" }, levelButtonText: { color: "#f5ffff", fontSize: 10, fontWeight: "900" },
  result: { gap: 10, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 10, backgroundColor: "#151a1b" }, resultHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rankBlock: { flexDirection: "row", alignItems: "baseline", gap: 6 }, topPercent: { color: "#071313", backgroundColor: "#42d5c2", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: "900" }, resultRank: { color: "#f5ffff", fontSize: 32, fontWeight: "900" }, resultOf: { color: "#9db6b8", fontSize: 9 }, productBlock: { alignItems: "flex-end" }, productLabel: { color: "#9db6b8", fontSize: 8, fontWeight: "900" }, productValue: { color: "#42d5c2", fontSize: 20, fontWeight: "900" },
  statGrid: { flexDirection: "row", gap: 4 }, stat: { minWidth: 0, flex: 1, borderLeftWidth: 2, borderColor: "#54a9ef", paddingLeft: 5 }, statLabel: { color: "#9db6b8", fontSize: 7, fontWeight: "800" }, statValue: { color: "#f5ffff", fontSize: 11, fontWeight: "900" },
  best: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderColor: "rgba(242,202,88,0.38)", borderRadius: 6, padding: 8, backgroundColor: "rgba(242,202,88,0.07)" }, bestLight: { backgroundColor: "#fff9e6" }, bestIvs: { color: "#f5ffff", fontSize: 14, fontWeight: "900" }, bestMeta: { color: "#9db6b8", fontSize: 9, fontWeight: "700" }, nearbyTitle: { color: "#8fc6cb", fontSize: 9, fontWeight: "900" }, table: { gap: 4 }, tableRow: { minWidth: 315, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(141,192,194,0.2)", borderRadius: 5, padding: 7 }, tableSelected: { borderColor: "#42d5c2", backgroundColor: "rgba(66,213,194,0.08)" }, tableRank: { width: 35, color: "#f5ffff", fontSize: 10, fontWeight: "900" }, tableIvs: { width: 58, color: "#f5ffff", fontSize: 10, fontWeight: "900" }, tableMeta: { flex: 1, color: "#9db6b8", fontSize: 9 }, tableProduct: { color: "#42d5c2", fontSize: 9, fontWeight: "900" },
});
