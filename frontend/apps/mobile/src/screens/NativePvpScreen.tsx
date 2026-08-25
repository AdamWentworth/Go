import { useMemo, useRef, useState } from "react";
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
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PokemonInstance } from "@pokemongonexus/shared-contracts/instances";
import type {
  BasePokemon,
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
  PokemonPvPRankingsPayload,
} from "@pokemongonexus/shared-contracts/pokemon";
import { NativePvpBattleLab } from "../components/tools/NativePvpBattleLab";
import {
  analyzeNativePvpTeam,
  buildNativePvpFormats,
  calculateNativePvpIvSummary,
  filterNativePvpEntries,
  pvpRoleScore,
  type NativePvpRole,
  type NativePvpWorkspace,
} from "../features/tools/nativePvpModel";

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  error?: string | null;
  instances?: Record<string, PokemonInstance>;
  isLoading?: boolean;
  onBack: () => void;
  onMethodology: () => void;
  onRetry: () => void;
  payload: PokemonPvPRankingsPayload | null;
  signedIn: boolean;
};
const WORKSPACES: [NativePvpWorkspace, string][] = [
  ["rankings", "Rankings"],
  ["team", "Team Builder"],
  ["battle", "Battle Lab"],
  ["iv-rank", "IV Rank"],
];
const ROLES: [NativePvpRole, string][] = [
  ["overall", "Overall"],
  ["lead", "Lead"],
  ["closer", "Closer"],
  ["switch", "Switch"],
  ["charger", "Charger"],
  ["attacker", "Attacker"],
  ["consistency", "Consistency"],
];
const uri = (base: string, value: string) => {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};
const PvpEntryCard = ({
  assetBaseUrl,
  entry,
  expanded,
  onPress,
  rank,
  role,
}: {
  assetBaseUrl: string;
  entry: PokemonPvPRankingEntry;
  expanded: boolean;
  onPress: () => void;
  rank: number;
  role: NativePvpRole;
}) => {
  const light = useColorScheme() === "light";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open rank ${rank}, ${entry.name}`}
      onPress={onPress}
      style={[
        styles.rankingCard,
        light && styles.cardLight,
        expanded && styles.rankingExpanded,
      ]}
    >
      <View style={[styles.rank, rank <= 3 && styles.rankTop]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <Image
        resizeMode="contain"
        source={{ uri: uri(assetBaseUrl, entry.imageUrl) }}
        style={styles.pokemonImage}
      />
      <View style={styles.rankingCopy}>
        <Text style={[styles.pokemonName, light && styles.textLight]}>
          {entry.name}
        </Text>
        <Text style={[styles.pokemonMeta, light && styles.mutedLight]}>
          Lv {entry.recommendedLevel} · {entry.attackIv}/{entry.defenseIv}/
          {entry.staminaIv} · {entry.types.join(" / ")}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.moveLine, light && styles.mutedLight]}
        >
          {entry.moveset.map((move) => move.name).join(" · ")}
        </Text>
        <Text style={styles.score}>
          {role === "overall" ? "Score" : role}:{" "}
          {pvpRoleScore(entry, role).toFixed(1)}
        </Text>
        {expanded ? (
          <View style={styles.expanded}>
            <Text style={[styles.detailTitle, light && styles.textLight]}>
              Battle build
            </Text>
            <Text style={[styles.detailBody, light && styles.mutedLight]}>
              Attack {entry.battleAttack?.toFixed(1) ?? "—"} · Defense{" "}
              {entry.battleDefense?.toFixed(1) ?? "—"} · HP{" "}
              {entry.battleHp ?? "—"}
            </Text>
            <Text style={[styles.detailTitle, light && styles.textLight]}>
              Strong matchups
            </Text>
            <Text style={[styles.detailBody, light && styles.mutedLight]}>
              {entry.matchups
                ?.slice(0, 4)
                .map(
                  (matchup) =>
                    `${matchup.speciesId} (${matchup.rating.toFixed(0)})`,
                )
                .join(" · ") || "Not available in this snapshot."}
            </Text>
            <Text style={[styles.detailTitle, light && styles.textLight]}>
              Key threats
            </Text>
            <Text style={[styles.detailBody, light && styles.mutedLight]}>
              {entry.counters
                ?.slice(0, 4)
                .map(
                  (counter) =>
                    `${counter.speciesId} (${counter.rating.toFixed(0)})`,
                )
                .join(" · ") || "Not available in this snapshot."}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
    </Pressable>
  );
};

export const NativePvpScreen = ({
  assetBaseUrl,
  catalog,
  error = null,
  instances = {},
  isLoading = false,
  onBack,
  onMethodology,
  onRetry,
  payload,
  signedIn,
}: Props) => {
  const light = useColorScheme() === "light";
  const insets = useSafeAreaInsets();
  const workspaceScrollRef = useRef<ScrollView>(null);
  const formats = useMemo(() => buildNativePvpFormats(payload), [payload]);
  const [workspace, setWorkspace] = useState<NativePvpWorkspace>("rankings");
  const [formatKey, setFormatKey] = useState("great");
  const format =
    formats.find((item) => item.key === formatKey) ?? formats[0] ?? null;
  const league = (format?.league ?? "great") as PokemonPvPLeagueKey;
  const [scope, setScope] = useState<"catalog" | "owned">(
    signedIn ? "owned" : "catalog",
  );
  const [role, setRole] = useState<NativePvpRole>("overall");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const entries = useMemo(
    () =>
      filterNativePvpEntries({
        entries: format?.entries ?? [],
        instances,
        query,
        role,
        scope,
      }),
    [format?.entries, instances, query, role, scope],
  );
  const [teamKeys, setTeamKeys] = useState<string[]>([]);
  const selectedTeam = teamKeys.flatMap(
    (key) => entries.find((entry) => entry.speciesId === key) ?? [],
  );
  const teamAnalysis = analyzeNativePvpTeam(selectedTeam);
  const mechanics =
    format?.mechanics ??
    (/\bcompetitors?\b/i.test(
      `${format?.key ?? ""} ${format?.label ?? ""} ${format?.cup ?? ""}`,
    )
      ? "pvpoke-legacy"
      : "current-2026");
  const [ivPokemonId, setIvPokemonId] = useState<number | null>(null);
  const ivPokemon =
    catalog.find((pokemon) => pokemon.pokemon_id === ivPokemonId) ??
    catalog.find((pokemon) =>
      format?.entries.some((entry) => entry.pokemonId === pokemon.pokemon_id),
    ) ??
    null;
  const [attackIv, setAttackIv] = useState("0");
  const [defenseIv, setDefenseIv] = useState("15");
  const [staminaIv, setStaminaIv] = useState("15");
  const [ivResult, setIvResult] = useState<ReturnType<
    typeof calculateNativePvpIvSummary
  > | null>(null);
  const updateWorkspace = (next: NativePvpWorkspace) => {
    setWorkspace(next);
    setExpanded(null);
  };
  const header = (
    <View>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[styles.back, light && styles.controlLight]}
        >
          <Text style={[styles.backText, light && styles.textLight]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>TRAINER BATTLES</Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, light && styles.textLight]}
          >
            {workspace === "rankings"
              ? "PvP Rankings"
              : workspace === "team"
                ? "PvP Team Builder"
                : workspace === "battle"
                  ? "PvP Battle Lab"
                  : "PvP IV Rank"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How PvP rankings work"
          onPress={onMethodology}
          style={[styles.info, light && styles.controlLight]}
        >
          <Text style={styles.infoText}>?</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.workspaceRail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {WORKSPACES.map(([value, label]) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: workspace === value }}
            key={value}
            onPress={() => updateWorkspace(value)}
            style={[
              styles.workspace,
              light && styles.controlLight,
              workspace === value && styles.workspaceActive,
            ]}
          >
            <Text
              style={[
                styles.workspaceText,
                light && styles.textLight,
                workspace === value && styles.workspaceTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.formatRail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {formats.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={() => {
              setFormatKey(item.key);
              setTeamKeys([]);
              setIvResult(null);
            }}
            style={[
              styles.format,
              light && styles.controlLight,
              format?.key === item.key && styles.formatActive,
            ]}
          >
            <Text
              style={[
                styles.formatTitle,
                light && styles.textLight,
                format?.key === item.key && styles.formatTextActive,
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.formatDetail,
                light && styles.mutedLight,
                format?.key === item.key && styles.formatTextActive,
              ]}
            >
              {item.cpLimit
                ? `${item.cpLimit.toLocaleString()} CP`
                : "No CP limit"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {format?.rules.length ? (
        <View style={[styles.rules, light && styles.panelLight]}>
          <Text style={styles.eyebrow}>FORMAT RULES</Text>
          <Text style={[styles.ruleText, light && styles.mutedLight]}>
            {format.rules.join(" · ")}
          </Text>
        </View>
      ) : null}
      {workspace !== "iv-rank" && signedIn ? (
        <View style={styles.scopeRow}>
          <Text style={[styles.scopeLabel, light && styles.mutedLight]}>
            Roster
          </Text>
          {(
            [
              ["catalog", "All Pokémon"],
              ["owned", "My Pokémon"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              accessibilityRole="button"
              key={value}
              onPress={() => setScope(value)}
              style={[
                styles.scopeButton,
                light && styles.controlLight,
                scope === value && styles.scopeActive,
              ]}
            >
              <Text
                style={[
                  styles.scopeText,
                  light && styles.textLight,
                  scope === value && styles.scopeTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#299cf5" />
          <Text style={[styles.stateCopy, light && styles.mutedLight]}>
            Loading PvP snapshot…
          </Text>
        </View>
      ) : null}
      {error ? (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.errorTitle}>PvP tools unavailable</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
  if (workspace === "rankings")
    return (
      <View
        style={[styles.root, light && styles.rootLight]}
        testID="native-pvp-screen"
      >
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 96,
          }}
          data={entries.slice(0, 100)}
          keyExtractor={(entry) => entry.speciesId}
          ListHeaderComponent={
            <>
              {header}
              <ScrollView
                contentContainerStyle={styles.roleRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {ROLES.map(([value, label]) => (
                  <Pressable
                    accessibilityRole="button"
                    key={value}
                    onPress={() => setRole(value)}
                    style={[
                      styles.role,
                      light && styles.controlLight,
                      role === value && styles.roleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        light && styles.textLight,
                        role === value && styles.roleTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                accessibilityLabel="Search PvP rankings"
                onChangeText={setQuery}
                placeholder="Pokémon, type, or move"
                placeholderTextColor="#78868e"
                style={[styles.search, light && styles.inputLight]}
                value={query}
              />
              <View style={styles.resultsHeading}>
                <Text style={[styles.resultsTitle, light && styles.textLight]}>
                  {ROLES.find(([value]) => value === role)?.[1]} rankings
                </Text>
                <Text style={[styles.resultsMeta, light && styles.mutedLight]}>
                  {entries.length} ranked
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            !isLoading && !error ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, light && styles.textLight]}>
                  No battle-ready Pokémon
                </Text>
                <Text style={[styles.stateCopy, light && styles.mutedLight]}>
                  Try another format, roster, role, or search.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <PvpEntryCard
              assetBaseUrl={assetBaseUrl}
              entry={item}
              expanded={expanded === item.speciesId}
              onPress={() =>
                setExpanded((current) =>
                  current === item.speciesId ? null : item.speciesId,
                )
              }
              rank={index + 1}
              role={role}
            />
          )}
        />
      </View>
    );
  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96 },
      ]}
      ref={workspaceScrollRef}
      style={[styles.root, light && styles.rootLight]}
      testID="native-pvp-screen"
    >
      {header}
      {workspace === "team" ? (
        <>
          <View style={[styles.workspacePanel, light && styles.panelLight]}>
            <Text style={styles.eyebrow}>YOUR THREE-POKÉMON TEAM</Text>
            <View style={styles.teamSlots}>
              {["Lead", "Safe Swap", "Closer"].map((label, index) => {
                const member = selectedTeam[index];
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${label}`}
                    key={label}
                    onPress={() => {
                      if (member)
                        setTeamKeys((keys) =>
                          keys.filter((_, slot) => slot !== index),
                        );
                    }}
                    style={[
                      styles.teamSlot,
                      light && styles.controlLight,
                      member && styles.teamSlotFilled,
                    ]}
                  >
                    {member ? (
                      <Image
                        source={{ uri: uri(assetBaseUrl, member.imageUrl) }}
                        style={styles.teamImage}
                      />
                    ) : (
                      <Text style={styles.plus}>+</Text>
                    )}
                    <Text style={[styles.teamRole, light && styles.textLight]}>
                      {label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[styles.teamName, light && styles.mutedLight]}
                    >
                      {member?.name ?? "Choose"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedTeam.length === 3 ? (
              <View style={styles.analysis}>
                <Text style={[styles.analysisTitle, light && styles.textLight]}>
                  Team profile
                </Text>
                <Text style={[styles.stateCopy, light && styles.mutedLight]}>
                  Average score {teamAnalysis.averageScore.toFixed(1)} ·{" "}
                  {teamAnalysis.typeCount} attack types
                </Text>
                <Text style={[styles.warning, light && styles.mutedLight]}>
                  {teamAnalysis.sharedThreats.length
                    ? `Shared threats: ${teamAnalysis.sharedThreats.slice(0, 4).join(", ")}`
                    : "No shared threats in the published matchup evidence."}
                </Text>
              </View>
            ) : (
              <Text style={[styles.stateCopy, light && styles.mutedLight]}>
                Choose three Pokémon below, then review shared coverage and
                threats.
              </Text>
            )}
          </View>
          <Text style={[styles.resultsTitle, light && styles.textLight]}>
            Choose team members
          </Text>
          <View style={styles.candidateGrid}>
            {entries.slice(0, 30).map((entry) => {
              const selected = teamKeys.includes(entry.speciesId);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${selected ? "Remove" : "Add"} ${entry.name}`}
                  key={entry.speciesId}
                  onPress={() =>
                    setTeamKeys((keys) =>
                      selected
                        ? keys.filter((key) => key !== entry.speciesId)
                        : keys.length < 3
                          ? [...keys, entry.speciesId]
                          : [entry.speciesId, keys[1], keys[2]].filter(Boolean),
                    )
                  }
                  style={[
                    styles.candidate,
                    light && styles.controlLight,
                    selected && styles.candidateActive,
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={{ uri: uri(assetBaseUrl, entry.imageUrl) }}
                    style={styles.candidateImage}
                  />
                  <Text
                    numberOfLines={2}
                    style={[styles.candidateName, light && styles.textLight]}
                  >
                    {entry.name}
                  </Text>
                  <Text style={styles.candidateScore}>
                    {entry.score.toFixed(0)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : workspace === "battle" ? (
        <NativePvpBattleLab
          assetBaseUrl={assetBaseUrl}
          entries={entries}
          light={light}
          mechanics={mechanics}
          onResultLayout={(offsetY) =>
            workspaceScrollRef.current?.scrollTo({
              animated: true,
              y: Math.max(0, offsetY - 16),
            })
          }
        />
      ) : (
        <>
          <View style={[styles.workspacePanel, light && styles.panelLight]}>
            <Text style={styles.eyebrow}>APPRAISAL COMPARISON</Text>
            <Text style={[styles.resultsTitle, light && styles.textLight]}>
              Rank one IV spread
            </Text>
            <Text style={[styles.stateCopy, light && styles.mutedLight]}>
              Every 0–15 appraisal is powered to its highest legal half-level
              and compared by battle-stat product.
            </Text>
            {ivPokemon ? (
              <View style={styles.ivPokemon}>
                <Image
                  resizeMode="contain"
                  source={{ uri: uri(assetBaseUrl, ivPokemon.image_url) }}
                  style={styles.ivImage}
                />
                <View>
                  <Text style={[styles.pokemonName, light && styles.textLight]}>
                    {ivPokemon.name}
                  </Text>
                  <Text
                    style={[styles.pokemonMeta, light && styles.mutedLight]}
                  >
                    {format?.label ?? "League"} ·{" "}
                    {format?.cpLimit
                      ? `${format.cpLimit.toLocaleString()} CP`
                      : "No cap"}
                  </Text>
                </View>
              </View>
            ) : null}
            <ScrollView
              contentContainerStyle={styles.pickerRail}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {catalog
                .filter((pokemon) =>
                  format?.entries.some(
                    (entry) => entry.pokemonId === pokemon.pokemon_id,
                  ),
                )
                .slice(0, 40)
                .map((pokemon) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${pokemon.name} for IV Rank`}
                    key={pokemon.pokemon_id}
                    onPress={() => {
                      setIvPokemonId(pokemon.pokemon_id);
                      setIvResult(null);
                    }}
                    style={[
                      styles.picker,
                      light && styles.controlLight,
                      ivPokemon?.pokemon_id === pokemon.pokemon_id &&
                        styles.candidateActive,
                    ]}
                  >
                    <Image
                      source={{ uri: uri(assetBaseUrl, pokemon.image_url) }}
                      style={styles.pickerImage}
                    />
                    <Text
                      numberOfLines={2}
                      style={[styles.candidateName, light && styles.textLight]}
                    >
                      {pokemon.name}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
            <View style={styles.ivInputs}>
              {(
                [
                  ["Attack", attackIv, setAttackIv],
                  ["Defense", defenseIv, setDefenseIv],
                  ["HP", staminaIv, setStaminaIv],
                ] as const
              ).map(([label, value, setter]) => (
                <View key={label} style={styles.ivField}>
                  <Text style={[styles.ivLabel, light && styles.mutedLight]}>
                    {label}
                  </Text>
                  <TextInput
                    accessibilityLabel={`${label} IV`}
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={setter}
                    style={[styles.ivInput, light && styles.inputLight]}
                    value={value}
                  />
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!ivPokemon}
              onPress={() => {
                if (!ivPokemon) return;
                setIvResult(
                  calculateNativePvpIvSummary(
                    ivPokemon,
                    {
                      attack: Math.max(0, Math.min(15, Number(attackIv) || 0)),
                      defense: Math.max(
                        0,
                        Math.min(15, Number(defenseIv) || 0),
                      ),
                      stamina: Math.max(
                        0,
                        Math.min(15, Number(staminaIv) || 0),
                      ),
                    },
                    league,
                  ),
                );
              }}
              style={[styles.primary, !ivPokemon && styles.disabled]}
            >
              <Text style={styles.primaryText}>Calculate IV rank</Text>
            </Pressable>
            {ivResult ? (
              <View accessibilityLiveRegion="polite" style={styles.ivResult}>
                <Text style={styles.ivRank}>
                  Rank #{ivResult.rank.toLocaleString()}
                </Text>
                <Text style={[styles.ivTotal, light && styles.mutedLight]}>
                  of {ivResult.total.toLocaleString()} ·{" "}
                  {ivResult.statProductPercent.toFixed(2)}% stat product
                </Text>
                <View style={styles.ivStats}>
                  {[
                    ["Level", ivResult.level],
                    ["CP", ivResult.cp],
                    ["Attack", ivResult.battleAttack.toFixed(1)],
                    ["Defense", ivResult.battleDefense.toFixed(1)],
                    ["HP", ivResult.battleHp],
                  ].map(([label, value]) => (
                    <View key={label}>
                      <Text style={styles.ivStatValue}>{value}</Text>
                      <Text
                        style={[styles.ivStatLabel, light && styles.mutedLight]}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090d12" },
  rootLight: { backgroundColor: "#eef4f7" },
  scrollContent: { gap: 12, paddingHorizontal: 12 },
  textLight: { color: "#14232a" },
  mutedLight: { color: "#5d6e76" },
  panelLight: { borderColor: "#c0ccd2", backgroundColor: "#fff" },
  controlLight: { borderColor: "#bdc9cf", backgroundColor: "#fff" },
  cardLight: { borderColor: "#c3ced4", backgroundColor: "#fff" },
  inputLight: {
    borderColor: "#b9c7ce",
    color: "#14232a",
    backgroundColor: "#fff",
  },
  topbar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#43515b",
    borderRadius: 22,
    backgroundColor: "#171d22",
  },
  backText: { marginTop: -4, color: "#fff", fontSize: 38 },
  headerCopy: { minWidth: 0, flex: 1 },
  eyebrow: {
    color: "#299cf5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  title: { color: "#fff", fontSize: 27, fontWeight: "900" },
  info: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#42515a",
    borderRadius: 20,
    backgroundColor: "#171d22",
  },
  infoText: { color: "#299cf5", fontSize: 20, fontWeight: "900" },
  workspaceRail: { gap: 7, paddingVertical: 8 },
  workspace: {
    minHeight: 43,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 11,
    paddingHorizontal: 15,
    backgroundColor: "#161c21",
  },
  workspaceActive: { borderColor: "#299cf5", backgroundColor: "#123c61" },
  workspaceText: { color: "#aeb9be", fontSize: 11, fontWeight: "900" },
  workspaceTextActive: { color: "#fff" },
  formatRail: { gap: 7, paddingVertical: 3 },
  format: {
    minWidth: 104,
    minHeight: 53,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: "#161c21",
  },
  formatActive: { borderColor: "#42cc9f", backgroundColor: "#123c31" },
  formatTitle: { color: "#fff", fontSize: 11, fontWeight: "900" },
  formatDetail: { marginTop: 2, color: "#92a0a7", fontSize: 8 },
  formatTextActive: { color: "#fff" },
  rules: {
    gap: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#34424a",
    borderRadius: 11,
    padding: 10,
    backgroundColor: "#151b20",
  },
  ruleText: { color: "#9eabb2", fontSize: 10, lineHeight: 15 },
  scopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
  },
  scopeLabel: {
    marginRight: "auto",
    color: "#95a2aa",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  scopeButton: {
    minHeight: 38,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#171d22",
  },
  scopeActive: { borderColor: "#42cc9f", backgroundColor: "#123c31" },
  scopeText: { color: "#a9b5bb", fontSize: 10, fontWeight: "900" },
  scopeTextActive: { color: "#fff" },
  roleRail: { gap: 7, paddingTop: 11 },
  role: {
    minHeight: 39,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: "#161c21",
  },
  roleActive: { borderColor: "#299cf5", backgroundColor: "#123c61" },
  roleText: { color: "#adb8bd", fontSize: 10, fontWeight: "900" },
  roleTextActive: { color: "#fff" },
  search: {
    minHeight: 47,
    marginTop: 11,
    borderWidth: 1,
    borderColor: "#46545d",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#fff",
    backgroundColor: "#161c21",
    fontSize: 14,
  },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  resultsMeta: { color: "#8d9ba2", fontSize: 10 },
  rankingCard: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#34434b",
    borderRadius: 14,
    padding: 9,
    backgroundColor: "#151b20",
  },
  rankingExpanded: { borderColor: "#299cf5" },
  rank: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#29343a",
  },
  rankTop: { backgroundColor: "#795916" },
  rankText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  pokemonImage: { width: 72, height: 76 },
  rankingCopy: { minWidth: 0, flex: 1 },
  pokemonName: { color: "#fff", fontSize: 14, fontWeight: "900" },
  pokemonMeta: { marginTop: 2, color: "#99a7ae", fontSize: 9 },
  moveLine: { marginTop: 5, color: "#a9b5bb", fontSize: 9.5 },
  score: {
    marginTop: 6,
    color: "#42cc9f",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  chevron: { color: "#8fa0a8", fontSize: 18 },
  expanded: {
    gap: 3,
    marginTop: 9,
    borderTopWidth: 1,
    borderColor: "#334149",
    paddingTop: 8,
  },
  detailTitle: { marginTop: 4, color: "#fff", fontSize: 10, fontWeight: "900" },
  detailBody: { color: "#9daab1", fontSize: 9.5, lineHeight: 14 },
  workspacePanel: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#34434b",
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#151b20",
  },
  teamSlots: { flexDirection: "row", gap: 7 },
  teamSlot: {
    minWidth: 0,
    flex: 1,
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 11,
    padding: 7,
    backgroundColor: "#11171b",
  },
  teamSlotFilled: { borderColor: "#42cc9f" },
  teamImage: { width: 58, height: 58, resizeMode: "contain" },
  plus: { color: "#299cf5", fontSize: 30 },
  teamRole: { color: "#fff", fontSize: 9, fontWeight: "900" },
  teamName: {
    minHeight: 26,
    color: "#9daab1",
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
  },
  analysis: {
    gap: 4,
    borderTopWidth: 1,
    borderColor: "#34434b",
    paddingTop: 9,
  },
  analysisTitle: { color: "#fff", fontSize: 13, fontWeight: "900" },
  warning: { color: "#d5b46b", fontSize: 10, lineHeight: 15 },
  candidateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  candidate: {
    width: "31.7%",
    minHeight: 126,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 11,
    padding: 7,
    backgroundColor: "#151b20",
  },
  candidateActive: { borderColor: "#42cc9f", backgroundColor: "#123c31" },
  candidateImage: { width: 70, height: 70, resizeMode: "contain" },
  candidateName: {
    minHeight: 28,
    color: "#fff",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  candidateScore: { color: "#42cc9f", fontSize: 9, fontWeight: "900" },
  battlePair: { flexDirection: "row", gap: 8 },
  battleSide: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 12,
    padding: 9,
    backgroundColor: "#11171b",
  },
  battleImage: { width: 105, height: 105, resizeMode: "contain" },
  verdict: {
    alignItems: "center",
    gap: 3,
    borderTopWidth: 1,
    borderColor: "#34434b",
    paddingTop: 10,
  },
  verdictLabel: {
    color: "#8f9da4",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  verdictName: { color: "#42cc9f", fontSize: 18, fontWeight: "900" },
  pickerRail: { gap: 7, paddingVertical: 7 },
  picker: {
    width: 94,
    minHeight: 108,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 10,
    padding: 7,
    backgroundColor: "#151b20",
  },
  pickerImage: { width: 66, height: 66, resizeMode: "contain" },
  ivPokemon: { flexDirection: "row", alignItems: "center", gap: 9 },
  ivImage: { width: 90, height: 90, resizeMode: "contain" },
  ivInputs: { flexDirection: "row", gap: 8 },
  ivField: { flex: 1 },
  ivLabel: {
    marginBottom: 4,
    color: "#9ba8af",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ivInput: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: "#46545d",
    borderRadius: 10,
    color: "#fff",
    backgroundColor: "#11171b",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  primary: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#168ced",
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  disabled: { opacity: 0.45 },
  ivResult: {
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    borderColor: "#34434b",
    paddingTop: 11,
  },
  ivRank: { color: "#42cc9f", fontSize: 25, fontWeight: "900" },
  ivTotal: { color: "#9ba8af", fontSize: 10 },
  ivStats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  ivStatsText: { textAlign: "center" },
  ivStatValue: {
    color: "#299cf5",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  ivStatLabel: { color: "#8f9da4", fontSize: 8, textAlign: "center" },
  state: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 22,
  },
  stateCopy: {
    color: "#a8b5bc",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  error: {
    gap: 7,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#df5770",
    borderRadius: 12,
    padding: 13,
    backgroundColor: "#39151e",
  },
  errorTitle: { color: "#ffd8df", fontSize: 15, fontWeight: "900" },
  errorCopy: { color: "#ffb8c4", fontSize: 12 },
  retry: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#df5770",
  },
  retryText: { color: "#fff", fontWeight: "900" },
  empty: { alignItems: "center", gap: 5, padding: 40 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
