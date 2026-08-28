import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PokemonPvPRankingEntry } from "@pokemongonexus/shared-contracts/pokemon";
import { analyzeNativePvpTeam } from "../../features/tools/nativePvpModel";
import {
  loadNativePvpTeam,
  saveNativePvpTeam,
  type NativePvpTeamSlots,
} from "../../features/tools/nativePvpTeams";
import { NativeUiIcon, type NativeUiIconName } from "../NativeUiIcon";

type Props = {
  assetBaseUrl: string;
  entries: PokemonPvPRankingEntry[];
  light: boolean;
  onOpenBattleLab: () => void;
  persistSelection?: boolean;
  storageKey: string;
};

const ROLES = [
  { detail: "Even shields", icon: "flag" as NativeUiIconName, label: "Lead" },
  { detail: "Energy advantage", icon: "trade" as NativeUiIconName, label: "Safe Swap" },
  { detail: "No shields", icon: "fist" as NativeUiIconName, label: "Closer" },
] as const;
const EMPTY_TEAM: NativePvpTeamSlots = [null, null, null];

const assetUri = (base: string, value: string): string | undefined => {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const strongestRole = (entry: PokemonPvPRankingEntry): string => {
  const labels = ["Lead", "Closer", "Switch", "Charger", "Attacker", "Consistency"];
  let best = 0;
  entry.categoryScores.forEach((score, index) => {
    if ((score ?? 0) > (entry.categoryScores[best] ?? 0)) best = index;
  });
  return labels[best] ?? "Overall";
};

const entrySearchText = (entry: PokemonPvPRankingEntry): string =>
  [
    entry.name,
    entry.speciesId,
    ...entry.types,
    ...entry.moveset.flatMap((move) => [move.name, move.type]),
  ]
    .join(" ")
    .toLocaleLowerCase();

export const NativePvpTeamBuilder = ({
  assetBaseUrl,
  entries,
  light,
  onOpenBattleLab,
  persistSelection = true,
  storageKey,
}: Props) => {
  const [activeSlot, setActiveSlot] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] =
    useState<NativePvpTeamSlots>(EMPTY_TEAM);
  const storageReady = useRef(false);

  useEffect(() => {
    if (!persistSelection) {
      storageReady.current = false;
      return;
    }
    let active = true;
    void loadNativePvpTeam(storageKey).then((slots) => {
      if (!active) return;
      storageReady.current = true;
      if (slots.some((slot) => slot != null)) {
        setSelectedKeys(slots);
        setActiveSlot(Math.max(0, slots.findIndex((slot) => slot == null)));
      }
    });
    return () => {
      active = false;
    };
  }, [persistSelection, storageKey]);

  useEffect(() => {
    if (persistSelection && storageReady.current)
      void saveNativePvpTeam(storageKey, selectedKeys);
  }, [persistSelection, selectedKeys, storageKey]);

  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.speciesId, entry])),
    [entries],
  );
  const members = selectedKeys.map((key) =>
    key ? entriesById.get(key) : undefined,
  );
  const team = members.filter(
    (entry): entry is PokemonPvPRankingEntry => entry != null,
  );
  const selected = new Set(team.map((entry) => entry.speciesId));
  const analysis = analyzeNativePvpTeam(team);
  const normalized = query.trim().toLocaleLowerCase();
  const visibleEntries = entries
    .filter((entry) => !normalized || entrySearchText(entry).includes(normalized))
    .slice(0, 40);
  const suggestions = entries
    .filter((entry) => !selected.has(entry.speciesId))
    .map((entry) => ({
      entry,
      coverage: (entry.matchups ?? []).filter((matchup) =>
        analysis.sharedThreats.includes(matchup.speciesId),
      ).length,
    }))
    .sort((left, right) => right.coverage - left.coverage || right.entry.score - left.entry.score)
    .slice(0, 3);

  const choose = (speciesId: string) => {
    setSelectedKeys((current) => {
      const next = [...current] as NativePvpTeamSlots;
      const existing = next.indexOf(speciesId);
      if (existing >= 0) {
        next[existing] = null;
        setActiveSlot(existing);
        return next;
      }
      const firstEmpty = next.findIndex((item) => item == null);
      const target = next[activeSlot] == null
        ? activeSlot
        : firstEmpty >= 0
          ? firstEmpty
          : activeSlot;
      next[target] = speciesId;
      const nextEmpty = next.findIndex((item) => item == null);
      setActiveSlot(nextEmpty >= 0 ? nextEmpty : target);
      return next;
    });
  };

  const remove = (index: number) => {
    setSelectedKeys((current) => {
      const next = [...current] as NativePvpTeamSlots;
      next[index] = null;
      return next;
    });
    setActiveSlot(index);
  };

  return (
    <View accessibilityLabel="PvP Team Builder" style={styles.builder}>
      <View style={styles.builderHeader}>
        <View style={styles.headingIdentity}>
          <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="trainers" size={21} />
          <View>
            <Text style={[styles.eyebrow, light && styles.accentLight]}>THREE-POKÉMON TEAM</Text>
            <Text style={[styles.heading, light && styles.textLight]}>Team Builder</Text>
          </View>
        </View>
        <View style={[styles.count, light && styles.pillLight]}>
          <Text style={[styles.countText, light && styles.accentLight]}>{team.length} / 3</Text>
        </View>
      </View>

      <View style={styles.teamSlots}>
        {ROLES.map((role, index) => {
          const member = members[index];
          const active = activeSlot === index;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${member ? "Edit" : "Choose"} ${role.label}${member ? `, ${member.name}` : ""}`}
              accessibilityState={{ selected: active }}
              key={role.label}
              onPress={() => setActiveSlot(index)}
              style={[
                styles.teamSlot,
                light && styles.panelLight,
                active && styles.teamSlotActive,
                !member && styles.teamSlotEmpty,
              ]}
            >
              <View style={styles.roleRow}>
                <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name={role.icon} size={18} />
                <View style={styles.roleCopy}>
                  <Text style={[styles.roleTitle, light && styles.accentLight]}>{role.label}</Text>
                  <Text style={[styles.roleDetail, light && styles.mutedLight]}>{role.detail}</Text>
                </View>
                {member ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${member.name} from ${role.label}`}
                    hitSlop={8}
                    onPress={(event) => {
                      event.stopPropagation();
                      remove(index);
                    }}
                    style={[styles.remove, light && styles.removeLight]}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                ) : null}
              </View>
              {member ? (
                <View style={styles.memberRow}>
                  <Image
                    resizeMode="contain"
                    source={{ uri: assetUri(assetBaseUrl, member.imageUrl) }}
                    style={styles.memberImage}
                  />
                  <View style={styles.memberCopy}>
                    <Text numberOfLines={1} style={[styles.memberName, light && styles.textLight]}>{member.name}</Text>
                    <Text style={[styles.memberMeta, light && styles.mutedLight]}>{strongestRole(member)} profile</Text>
                    <Text style={[styles.memberScore, light && styles.accentLight]}>{member.score.toFixed(1)} overall</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={[styles.plus, light && styles.accentLight]}>＋</Text>
                  <Text style={[styles.emptyCopy, light && styles.mutedLight]}>Choose Pokémon</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {team.length ? (
        <View style={[styles.analysis, light && styles.analysisLight]}>
          <View style={styles.builderHeader}>
            <View style={styles.headingIdentity}>
              <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="chart" size={20} />
              <View>
                <Text style={[styles.eyebrow, light && styles.accentLight]}>LOCAL ROLE FIELD TEST</Text>
                <Text style={[styles.analysisHeading, light && styles.textLight]}>Team check</Text>
              </View>
            </View>
            {team.length === 3 ? (
              <View style={[styles.count, light && styles.pillLight]}>
                <Text style={[styles.countText, light && styles.accentLight]}>{analysis.coveredThreats} handled</Text>
              </View>
            ) : null}
          </View>
          {team.length < 3 ? (
            <Text style={[styles.body, light && styles.mutedLight]}>Fill all three roles to run the local meta field test.</Text>
          ) : (
            <>
              <View style={[styles.analysisStats, light && styles.analysisStatsLight]}>
                <View style={styles.analysisStat}>
                  <Text style={[styles.analysisLabel, light && styles.mutedLight]}>AVERAGE SCORE</Text>
                  <Text style={[styles.analysisValue, light && styles.accentLight]}>{analysis.averageScore.toFixed(1)}</Text>
                </View>
                <View style={styles.analysisStat}>
                  <Text style={[styles.analysisLabel, light && styles.mutedLight]}>ATTACK TYPES</Text>
                  <Text style={[styles.analysisValue, light && styles.accentLight]}>{analysis.typeCount}</Text>
                </View>
                <View style={styles.analysisStat}>
                  <Text style={[styles.analysisLabel, light && styles.mutedLight]}>SHARED LOSSES</Text>
                  <Text style={[styles.analysisValue, light && styles.accentLight]}>{analysis.sharedThreats.length}</Text>
                </View>
              </View>
              <Text style={[styles.body, light && styles.mutedLight]}>
                {analysis.sharedThreats.length
                  ? `Shared threats: ${analysis.sharedThreats.slice(0, 5).join(", ")}`
                  : "No shared threats in the published matchup evidence."}
              </Text>
              <Pressable accessibilityRole="button" onPress={onOpenBattleLab} style={[styles.battleButton, light && styles.battleButtonLight]}>
                <View style={styles.battleButtonContent}><NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="flask" size={15} /><Text style={[styles.battleButtonText, light && styles.accentLight]}>Test a matchup in Battle Lab</Text></View>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {team.length < 3 && suggestions.length ? (
        <View style={styles.suggestions}>
          <Text style={[styles.sectionLabel, light && styles.mutedLight]}>BEST ADDITIONS FOR {ROLES[activeSlot].label.toLocaleUpperCase()}</Text>
          {suggestions.map(({ entry, coverage }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Add suggested ${entry.name}`} key={entry.speciesId} onPress={() => choose(entry.speciesId)} style={[styles.suggestion, light && styles.panelLight]}>
              <Image resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }} style={styles.suggestionImage} />
              <View style={styles.memberCopy}>
                <Text numberOfLines={1} style={[styles.memberName, light && styles.textLight]}>{entry.name}</Text>
                <Text style={[styles.memberMeta, light && styles.mutedLight]}>{coverage ? `Covers ${coverage} open threat${coverage === 1 ? "" : "s"}` : `${entry.score.toFixed(1)} overall`}</Text>
              </View>
              <Text style={[styles.plusSmall, light && styles.accentLight]}>＋</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.pickSection}>
        <View style={styles.picksHeader}>
          <View>
            <Text style={[styles.eyebrow, light && styles.accentLight]}>CHOOSING ROLE</Text>
            <Text style={[styles.pickRole, light && styles.textLight]}>{ROLES[activeSlot].label}</Text>
          </View>
          <Text style={[styles.pickHint, light && styles.mutedLight]}>{team.length === 3 ? "Select to replace" : "Highest scoring first"}</Text>
        </View>
        <View style={[styles.searchWrap, light && styles.inputLight]}>
          <NativeUiIcon color={light ? '#4c7073' : '#9db6b8'} name="search" size={18} />
          <TextInput
            accessibilityLabel="Search Team Builder Pokémon"
            onChangeText={setQuery}
            placeholder="Find Pokémon, type, or move"
            placeholderTextColor="#78868e"
            style={[styles.searchInput, light && styles.textLight]}
            value={query}
          />
        </View>
        <View style={styles.candidateGrid}>
          {visibleEntries.map((entry) => {
            const isSelected = selected.has(entry.speciesId);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${isSelected ? "Unassign" : team.length === 3 ? "Replace with" : "Select"} ${entry.name}`}
                key={entry.speciesId}
                onPress={() => choose(entry.speciesId)}
                style={[styles.candidate, light && styles.panelLight, isSelected && styles.candidateSelected]}
              >
                <Image resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }} style={styles.candidateImage} />
                <View style={styles.candidateCopy}>
                  <Text numberOfLines={1} style={[styles.candidateName, light && styles.textLight]}>{entry.name}</Text>
                  <Text numberOfLines={1} style={[styles.candidateMeta, light && styles.mutedLight]}>{entry.score.toFixed(1)} overall</Text>
                </View>
                <View style={[styles.addButton, isSelected && styles.addButtonSelected]}>
                  <Text style={[styles.addButtonText, isSelected && styles.addButtonTextSelected]}>{isSelected ? "✓" : "+"}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {entries.length > 40 && !normalized ? (
          <Text style={[styles.limitCopy, light && styles.mutedLight]}>Showing the 40 highest-scoring choices. Search to reach the full ranking.</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  builder: { gap: 10 },
  builderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  headingIdentity: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerIcon: { color: "#42d5c2", fontSize: 20 },
  eyebrow: { color: "#8fc6cb", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  heading: { color: "#f5ffff", fontSize: 20, fontWeight: "900" },
  count: { borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countText: { color: "#42d5c2", fontSize: 10, fontWeight: "900" },
  teamSlots: { gap: 7 },
  teamSlot: { minHeight: 86, gap: 5, borderWidth: 1, borderStyle: "solid", borderColor: "rgba(115,204,204,0.35)", borderRadius: 7, padding: 8, backgroundColor: "#151a1b" },
  panelLight: { borderColor: "#b2d2d2", backgroundColor: "#fff" },
  teamSlotActive: { borderColor: "#42d5c2", borderWidth: 2 },
  teamSlotEmpty: { borderStyle: "dashed", justifyContent: "center" },
  roleRow: { minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  roleIcon: { color: "#42d5c2", fontSize: 14 },
  roleCopy: { minWidth: 0, flex: 1 },
  roleTitle: { color: "#8fc6cb", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  roleDetail: { color: "#9db6b8", fontSize: 9, fontWeight: "700" },
  remove: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(237,111,165,0.5)", borderRadius: 15, backgroundColor: "rgba(237,111,165,0.08)" },
  removeLight: { backgroundColor: "#fff3f8" },
  removeText: { color: "#ed6fa5", fontSize: 20, lineHeight: 21, fontWeight: "800" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  memberImage: { width: 53, height: 53 },
  memberCopy: { minWidth: 0, flex: 1 },
  memberName: { color: "#f5ffff", fontSize: 12, fontWeight: "900" },
  memberMeta: { marginTop: 2, color: "#9db6b8", fontSize: 9, fontWeight: "700" },
  memberScore: { marginTop: 3, color: "#42d5c2", fontSize: 9, fontWeight: "900" },
  emptyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  plus: { color: "#42d5c2", fontSize: 23 },
  emptyCopy: { color: "#9db6b8", fontSize: 11, fontWeight: "900" },
  analysis: { gap: 9, paddingVertical: 11, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(115,204,204,0.28)" },
  analysisLight: { borderColor: "#b2d2d2" },
  analysisHeading: { color: "#f5ffff", fontSize: 15, fontWeight: "900" },
  body: { color: "#9db6b8", fontSize: 10.5, lineHeight: 16 },
  analysisStats: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(115,204,204,0.28)" },
  analysisStatsLight: { borderColor: "#b2d2d2" },
  analysisStat: { minWidth: 0, flex: 1, alignItems: "center", gap: 3, paddingVertical: 8, paddingHorizontal: 2 },
  analysisLabel: { color: "#9db6b8", fontSize: 7.5, fontWeight: "900" },
  analysisValue: { color: "#42d5c2", fontSize: 14, fontWeight: "900" },
  battleButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 6, backgroundColor: "rgba(66,213,194,0.07)" },
  battleButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  battleButtonLight: { backgroundColor: "#f6ffff" },
  battleButtonText: { color: "#42d5c2", fontSize: 10, fontWeight: "900" },
  suggestions: { gap: 5 },
  sectionLabel: { color: "#9db6b8", fontSize: 9, fontWeight: "900" },
  suggestion: { minHeight: 51, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 6, padding: 5, backgroundColor: "#151a1b" },
  suggestionImage: { width: 40, height: 40 },
  plusSmall: { color: "#42d5c2", fontSize: 20, fontWeight: "900" },
  pickSection: { gap: 7 },
  picksHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  pickRole: { color: "#f5ffff", fontSize: 13, fontWeight: "900" },
  pickHint: { color: "#9db6b8", fontSize: 9, fontWeight: "700" },
  searchWrap: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 12, backgroundColor: "#101516" },
  inputLight: { borderColor: "#8dc3c3", backgroundColor: "#fbffff" },
  searchIcon: { color: "#9db6b8", fontSize: 21 },
  searchInput: { minWidth: 0, flex: 1, minHeight: 42, color: "#f5ffff", fontSize: 13 },
  candidateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  candidate: { width: "49.2%", minHeight: 61, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(141,192,194,0.2)", borderRadius: 6, padding: 5, backgroundColor: "#151a1b" },
  candidateSelected: { borderColor: "#42d5c2", backgroundColor: "rgba(66,213,194,0.08)" },
  candidateImage: { width: 43, height: 43 },
  candidateCopy: { minWidth: 0, flex: 1 },
  candidateName: { color: "#f5ffff", fontSize: 9.5, fontWeight: "900" },
  candidateMeta: { color: "#9db6b8", fontSize: 8, fontWeight: "700" },
  addButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 14 },
  addButtonSelected: { borderColor: "#42d5c2", backgroundColor: "#42d5c2" },
  addButtonText: { color: "#f5ffff", fontSize: 18, fontWeight: "900" },
  addButtonTextSelected: { color: "#071313" },
  limitCopy: { color: "#9db6b8", fontSize: 9, textAlign: "center" },
  textLight: { color: "#071d20" },
  mutedLight: { color: "#4c7073" },
  accentLight: { color: "#08766b" },
  pillLight: { borderColor: "#7dbdb9", backgroundColor: "#f8ffff" },
});
