import { useDeferredValue, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  PokemonPvPBattleFighter,
  PokemonPvPBattleMechanics,
  PokemonPvPRankingEntry,
} from "@pokemongonexus/shared-contracts/pokemon";
import {
  buildPvPBattleFighterFromRankingEntry,
  simulatePvPTeamBattleLocally,
  simulatePvPTeamGauntletLocally,
} from "@pokemongonexus/shared-domain/pvp-battle";
import type {
  PvPTeamBattleResponse,
  PvPTeamGauntletResponse,
  PvPTeamSwitchPolicy,
} from "@pokemongonexus/shared-domain/pvp-battle-protocol";
import { NativeUiIcon, type NativeUiIconName } from "../NativeUiIcon";

type TeamKeys = [string, string, string];
type Props = {
  assetBaseUrl: string;
  entries: PokemonPvPRankingEntry[];
  light: boolean;
  mechanics: PokemonPvPBattleMechanics;
  onResultLayout?: (offsetY: number) => void;
};
const ROLES = ["Lead", "Safe Swap", "Closer"] as const;

const assetUri = (base: string, value: string): string | undefined => {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const initialTeam = (
  entries: PokemonPvPRankingEntry[],
  offset: number,
): TeamKeys => {
  const ids = entries.map((entry) => entry.speciesId);
  const keys = Array.from({ length: 3 }, (_, index) =>
    ids[(index + offset) % Math.max(1, ids.length)] ?? "",
  );
  return keys as TeamKeys;
};

const toFighter = (
  entry: PokemonPvPRankingEntry | undefined,
): PokemonPvPBattleFighter | null =>
  entry ? buildPvPBattleFighterFromRankingEntry(entry, entry.speciesId) : null;

const Choice = ({
  active,
  icon,
  label,
  light,
  onPress,
}: {
  active: boolean;
  icon?: NativeUiIconName;
  label: string;
  light: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[styles.choice, light && styles.controlLight, active && styles.choiceActive]}
  >
    <View style={styles.choiceContent}>
      {icon ? <NativeUiIcon color={active ? '#071313' : light ? '#071d20' : '#f5ffff'} name={icon} size={13} /> : null}
      <Text style={[styles.choiceText, light && styles.textLight, active && styles.choiceTextActive]}>{label}</Text>
    </View>
  </Pressable>
);

export const NativePvpTeamBattle = ({
  assetBaseUrl,
  entries,
  light,
  mechanics,
  onResultLayout,
}: Props) => {
  const ready = useMemo(
    () => entries.filter((entry) => toFighter(entry) != null),
    [entries],
  );
  const entryById = useMemo(
    () => new Map(ready.map((entry) => [entry.speciesId, entry])),
    [ready],
  );
  const [teams, setTeams] = useState<[TeamKeys, TeamKeys]>(() => [
    initialTeam(ready, 0),
    initialTeam(ready, Math.min(1, Math.max(0, ready.length - 1))),
  ]);
  const [activeSide, setActiveSide] = useState<0 | 1>(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [policy, setPolicy] = useState<PvPTeamSwitchPolicy>("adaptive");
  const [shields, setShields] = useState<[number, number]>([2, 2]);
  const [energy, setEnergy] = useState<[number, number]>([0, 0]);
  const [result, setResult] = useState<PvPTeamBattleResponse | null>(null);
  const [gauntlet, setGauntlet] = useState<PvPTeamGauntletResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"battle" | "field" | null>(null);
  const normalized = deferredQuery.trim().toLocaleLowerCase();
  const unavailable = useMemo(
    () => new Set(teams[activeSide].filter((_, index) => index !== activeSlot)),
    [activeSide, activeSlot, teams],
  );
  const choices = useMemo(() => ready
    .filter((entry) =>
      (!unavailable.has(entry.speciesId) || teams[activeSide][activeSlot] === entry.speciesId) &&
      (!normalized || [
        entry.name,
        entry.speciesId,
        ...entry.types,
        ...entry.moveset.map((move) => move.name),
      ].join(" ").toLocaleLowerCase().includes(normalized)),
    )
    .slice(0, 40), [activeSide, activeSlot, normalized, ready, teams, unavailable]);
  const selectedTeams = useMemo(
    () => teams.map((team) => team.map((key) => entryById.get(key))),
    [entryById, teams],
  );
  const complete = selectedTeams.every((team) =>
    team.length === 3 && team.every(Boolean) && new Set(team.map((entry) => entry?.speciesId)).size === 3,
  );

  const changeTeamMember = (entry: PokemonPvPRankingEntry) => {
    setTeams((current) => {
      const next: [TeamKeys, TeamKeys] = [
        [...current[0]] as TeamKeys,
        [...current[1]] as TeamKeys,
      ];
      next[activeSide][activeSlot] = entry.speciesId;
      return next;
    });
    setResult(null);
    setGauntlet(null);
    setError("");
  };

  const changePair = (
    setter: React.Dispatch<React.SetStateAction<[number, number]>>,
    side: 0 | 1,
    value: number,
  ) => {
    setter((current) => side === 0 ? [value, current[1]] : [current[0], value]);
    setResult(null);
    setGauntlet(null);
  };

  const buildTeams = (): [
    [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter],
    [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter],
  ] | null => {
    const fighters = selectedTeams.map((team) => team.map(toFighter));
    if (fighters.some((team) => team.some((fighter) => fighter == null))) return null;
    return fighters as [
      [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter],
      [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter],
    ];
  };

  const simulate = async () => {
    const fighters = buildTeams();
    if (!fighters) {
      setError("Team Battle needs three unique, battle-ready Pokémon on each side.");
      return;
    }
    setBusy("battle");
    setResult(null);
    setGauntlet(null);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      setResult(simulatePvPTeamBattleLocally({
        kind: "team-battle",
        mechanics,
        teams: fighters,
        shields,
        startingEnergy: energy,
        switchPolicy: policy,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The team battle could not be simulated.");
    } finally {
      setBusy(null);
    }
  };

  const representativeTeams = useMemo(() => {
    const rows: { id: string; label: string; team: [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter] }[] = [];
    for (let index = 0; index + 2 < ready.length && rows.length < 6; index += 3) {
      const teamEntries = [ready[index], ready[index + 1], ready[index + 2]];
      const fighters = teamEntries.map(toFighter);
      if (fighters.every(Boolean)) rows.push({
        id: `field-${index}`,
        label: `Meta line ${rows.length + 1}`,
        team: fighters as [PokemonPvPBattleFighter, PokemonPvPBattleFighter, PokemonPvPBattleFighter],
      });
    }
    return rows;
  }, [ready]);

  const runField = async () => {
    const fighters = buildTeams();
    if (!fighters || !representativeTeams.length) {
      setError("The meta field needs a complete team and at least one representative lineup.");
      return;
    }
    setBusy("field");
    setGauntlet(null);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      setGauntlet(simulatePvPTeamGauntletLocally({
        kind: "team-gauntlet",
        mechanics,
        team: fighters[0],
        opponents: representativeTeams,
        shields: shields[0],
        switchPolicy: policy,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The meta team check could not be completed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.lineups}>
        {([0, 1] as const).map((side) => (
          <View key={side} style={[styles.lineup, light && styles.panelLight]}>
            <View style={styles.lineupHeader}>
              <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="trainers" size={18} />
              <View>
                <Text style={[styles.lineupTitle, light && styles.textLight]}>{side === 0 ? "Your team" : "Opponent"}</Text>
                <Text style={[styles.meta, light && styles.mutedLight]}>Lead, Safe Swap, and Closer</Text>
              </View>
            </View>
            <View style={styles.slots}>
              {ROLES.map((role, index) => {
                const entry = selectedTeams[side][index];
                const active = activeSide === side && activeSlot === index;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${side === 0 ? "your" : "opponent"} ${role}${entry ? `: ${entry.name}` : ""}`}
                    accessibilityState={{ selected: active }}
                    key={role}
                    onPress={() => { setActiveSide(side); setActiveSlot(index); }}
                    style={[styles.slot, light && styles.controlLight, active && styles.slotActive]}
                  >
                    <Text style={[styles.role, light && styles.accentLight]}>{role}</Text>
                    {entry ? <Image fadeDuration={0} resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }} style={styles.slotImage} /> : null}
                    <Text numberOfLines={2} style={[styles.slotName, light && styles.textLight]}>{entry?.name ?? "Choose"}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.policy, light && styles.panelLight]}>
        <View style={styles.lineupHeader}>
          <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="clock" size={18} />
          <View>
            <Text style={[styles.lineupTitle, light && styles.textLight]}>Switching</Text>
            <Text style={[styles.meta, light && styles.mutedLight]}>Current 45-second battle clock</Text>
          </View>
        </View>
        <View style={styles.policyChoices}>
          <Choice active={policy === "adaptive"} icon="trade" label="Adaptive" light={light} onPress={() => { setPolicy("adaptive"); setResult(null); }} />
          <Choice active={policy === "fixed"} icon="trainers" label="Fixed order" light={light} onPress={() => { setPolicy("fixed"); setResult(null); }} />
        </View>
        <Text style={[styles.meta, light && styles.mutedLight]}>{policy === "adaptive" ? "Escape clear losses and counter-switch." : "Lead, Safe Swap, then Closer."}</Text>
      </View>

      {([0, 1] as const).map((side) => (
        <View key={side} style={[styles.conditions, light && styles.panelLight]}>
          <Text style={[styles.lineupTitle, light && styles.textLight]}>{side === 0 ? "Your conditions" : "Opponent conditions"}</Text>
          <View style={styles.conditionRow}>
            <Text style={[styles.conditionLabel, light && styles.mutedLight]}>Shields</Text>
            {[0, 1, 2].map((value) => <Choice active={shields[side] === value} key={value} label={String(value)} light={light} onPress={() => changePair(setShields, side, value)} />)}
          </View>
          <View style={styles.conditionRow}>
            <Text style={[styles.conditionLabel, light && styles.mutedLight]}>Lead energy</Text>
            {[0, 25, 50, 75, 100].map((value) => <Choice active={energy[side] === value} key={value} label={String(value)} light={light} onPress={() => changePair(setEnergy, side, value)} />)}
          </View>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Run team battle" disabled={!complete || busy != null} onPress={() => void simulate()} style={[styles.primary, (!complete || busy != null) && styles.disabled]}>
          <Text style={styles.primaryText}>▶ {busy === "battle" ? "Simulating team…" : "Run team battle"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Test meta teams" disabled={!complete || !representativeTeams.length || busy != null} onPress={() => void runField()} style={[styles.secondary, light && styles.secondaryLight, (!complete || !representativeTeams.length || busy != null) && styles.disabled]}>
          <View style={styles.actionLabel}><NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="trophy" size={14} /><Text style={[styles.secondaryText, light && styles.accentLight]}>{busy === "field" ? "Testing field…" : `Test ${representativeTeams.length} meta teams`}</Text></View>
        </Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!complete && !error ? <Text style={[styles.status, light && styles.mutedLight]}>Team Battle needs three unique, battle-ready Pokémon on each side.</Text> : null}

      {result ? (
        <View accessibilityLiveRegion="polite" onLayout={(event) => onResultLayout?.(event.nativeEvent.layout.y)} style={[styles.result, light && styles.panelLight]}>
          <Text style={[styles.eyebrow, light && styles.accentLight]}>{result.switchPolicy === "adaptive" ? "SWITCH-AWARE 3V3 RESULT" : "FIXED-ORDER 3V3 RESULT"}</Text>
          <Text style={[styles.resultTitle, light && styles.textLight]}>{result.winner < 0 ? "Team battle ends in a draw" : result.winner === 0 ? "Your team wins" : "Opponent wins"}</Text>
          <Text style={[styles.meta, light && styles.mutedLight]}>{(result.timeMs / 1000).toFixed(1)} seconds · {result.switches.filter((event) => event.reason === "adaptive").length} adaptive swaps</Text>
          {([0, 1] as const).map((side) => (
            <View key={side} style={styles.resultTeam}>
              <Text style={[styles.lineupTitle, light && styles.textLight]}>{side === 0 ? "Your team" : "Opponent"} · {result.teams[side].filter((member) => !member.fainted).length} standing</Text>
              {result.teams[side].map((member, index) => {
                const entry = selectedTeams[side][index];
                const hp = member.maxHp ? Math.max(0, (member.hp / member.maxHp) * 100) : 0;
                return (
                  <View key={member.fighterId} style={[styles.resultMember, member.fainted && styles.fainted]}>
                    {entry ? <Image fadeDuration={0} resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }} style={styles.resultImage} /> : null}
                    <View style={styles.resultCopy}>
                      <Text style={[styles.resultName, light && styles.textLight]}>{entry?.name ?? ROLES[index]}</Text>
                      <View style={[styles.hpTrack, light && styles.hpTrackLight]}><View style={[styles.hpFill, { width: `${hp}%` }]} /></View>
                      <Text style={[styles.meta, light && styles.mutedLight]}>{member.hp}/{member.maxHp} HP · {member.energy} energy · {member.knockouts} KOs</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}

      {gauntlet ? (
        <View accessibilityLiveRegion="polite" style={[styles.result, light && styles.panelLight]}>
          <Text style={[styles.eyebrow, light && styles.accentLight]}>ROLE-BALANCED META FIELD</Text>
          <Text style={[styles.resultTitle, light && styles.textLight]}>{gauntlet.wins}-{gauntlet.losses}-{gauntlet.draws}</Text>
          <Text style={[styles.meta, light && styles.mutedLight]}>Wins, losses, and draws against current top role combinations.</Text>
          {gauntlet.results.map((row) => <View key={row.opponentId} style={styles.fieldRow}><Text style={row.result.winner === 0 ? styles.win : row.result.winner === 1 ? styles.loss : styles.draw}>{row.result.winner === 0 ? "✓" : row.result.winner === 1 ? "×" : "–"}</Text><Text style={[styles.fieldLabel, light && styles.textLight]}>{row.opponentLabel}</Text></View>)}
        </View>
      ) : null}

      <View style={styles.pickerSection}>
        <Text style={[styles.eyebrow, light && styles.accentLight]}>CHOOSE {activeSide === 0 ? "YOUR" : "OPPONENT"} {ROLES[activeSlot].toLocaleUpperCase()}</Text>
        <View style={[styles.search, light && styles.inputLight]}><NativeUiIcon color={light ? '#4c7073' : '#9db6b8'} name="search" size={18} /><TextInput accessibilityLabel="Search Team Battle Pokémon" onChangeText={setQuery} placeholder="Find a Pokémon" placeholderTextColor="#78868e" style={[styles.searchInput, light && styles.textLight]} value={query} /></View>
        <View style={styles.candidateGrid}>
          {choices.map((entry) => {
            const active = teams[activeSide][activeSlot] === entry.speciesId;
            return <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${entry.name} for ${activeSide === 0 ? "your" : "opponent"} ${ROLES[activeSlot]}`} key={entry.speciesId} onPress={() => changeTeamMember(entry)} style={[styles.candidate, light && styles.controlLight, active && styles.candidateActive]}><Image fadeDuration={0} resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }} style={styles.candidateImage} /><View style={styles.candidateCopy}><Text numberOfLines={1} style={[styles.candidateName, light && styles.textLight]}>{entry.name}</Text><Text style={[styles.meta, light && styles.mutedLight]}>Level {entry.recommendedLevel}</Text></View><Text style={[styles.check, active && styles.checkActive]}>{active ? "✓" : "+"}</Text></Pressable>;
          })}
        </View>
      </View>
      <Text style={[styles.footer, light && styles.mutedLight]}>{policy === "adaptive" ? "The local model can escape clear losing matchups, counter-switch on a 45-second clock, and preserve benched Pokémon HP and energy." : "Fixed order keeps the selected Lead, Safe Swap, and Closer sequence while preserving shared shields, HP, and energy."}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 9 },
  lineups: { gap: 8 },
  lineup: { gap: 8, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 8, backgroundColor: "#151a1b" },
  panelLight: { borderColor: "#b2d2d2", backgroundColor: "#fff" },
  controlLight: { borderColor: "#bdc9cf", backgroundColor: "#fff" },
  lineupHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  lineupIcon: { color: "#42d5c2", fontSize: 18 },
  lineupTitle: { color: "#f5ffff", fontSize: 12, fontWeight: "900" },
  meta: { color: "#9db6b8", fontSize: 9, lineHeight: 13 },
  slots: { flexDirection: "row", gap: 5 },
  slot: { minWidth: 0, flex: 1, minHeight: 104, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 6, padding: 5, backgroundColor: "#101516" },
  slotActive: { borderColor: "#42d5c2", borderWidth: 2 },
  role: { color: "#8fc6cb", fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
  slotImage: { width: 54, height: 54 },
  slotName: { minHeight: 24, color: "#f5ffff", fontSize: 9, lineHeight: 12, fontWeight: "900", textAlign: "center" },
  policy: { gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 9, backgroundColor: "#151a1b" },
  policyChoices: { flexDirection: "row", gap: 6 },
  choice: { minWidth: 35, minHeight: 35, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.4)", borderRadius: 7, paddingHorizontal: 5, backgroundColor: "#101516" },
  choiceContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  choiceActive: { borderColor: "#42d5c2", backgroundColor: "#42d5c2" },
  choiceText: { color: "#9db6b8", fontSize: 9, fontWeight: "900" },
  choiceTextActive: { color: "#071313" },
  conditions: { gap: 7, borderWidth: 1, borderColor: "rgba(115,204,204,0.28)", borderRadius: 8, padding: 8, backgroundColor: "#151a1b" },
  conditionRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  conditionLabel: { width: 66, color: "#9db6b8", fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
  actions: { flexDirection: "row", gap: 6 },
  actionLabel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  primary: { minHeight: 48, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "#42d5c2" },
  primaryText: { color: "#071313", fontSize: 10, fontWeight: "900" },
  secondary: { minHeight: 48, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 7, backgroundColor: "rgba(66,213,194,0.06)" },
  secondaryLight: { backgroundColor: "#f8ffff" },
  secondaryText: { color: "#42d5c2", fontSize: 9, fontWeight: "900" },
  disabled: { opacity: 0.4 },
  error: { color: "#ff9ebd", fontSize: 10, lineHeight: 15, textAlign: "center" },
  status: { color: "#9db6b8", fontSize: 10, lineHeight: 15, textAlign: "center" },
  result: { gap: 8, borderWidth: 1, borderColor: "#42d5c2", borderRadius: 8, padding: 10, backgroundColor: "rgba(66,213,194,0.06)" },
  eyebrow: { color: "#8fc6cb", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  resultTitle: { color: "#f5ffff", fontSize: 19, fontWeight: "900" },
  resultTeam: { gap: 5, paddingTop: 5, borderTopWidth: 1, borderColor: "rgba(115,204,204,0.2)" },
  resultMember: { flexDirection: "row", alignItems: "center", gap: 7 },
  fainted: { opacity: 0.45 },
  resultImage: { width: 39, height: 39 },
  resultCopy: { minWidth: 0, flex: 1 },
  resultName: { color: "#f5ffff", fontSize: 10, fontWeight: "900" },
  hpTrack: { height: 6, marginVertical: 3, overflow: "hidden", borderRadius: 999, backgroundColor: "#344149" },
  hpTrackLight: { backgroundColor: "#d5dee2" },
  hpFill: { height: "100%", borderRadius: 999, backgroundColor: "#42d5c2" },
  fieldRow: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderColor: "rgba(115,204,204,0.18)" },
  fieldLabel: { color: "#f5ffff", fontSize: 10, fontWeight: "800" },
  win: { color: "#42d5c2", fontSize: 17, fontWeight: "900" },
  loss: { color: "#ed6fa5", fontSize: 17, fontWeight: "900" },
  draw: { color: "#d5b46b", fontSize: 17, fontWeight: "900" },
  pickerSection: { gap: 7 },
  search: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(115,204,204,0.5)", borderRadius: 999, paddingHorizontal: 11, backgroundColor: "#101516" },
  inputLight: { borderColor: "#8dc3c3", backgroundColor: "#fbffff" },
  searchIcon: { color: "#9db6b8", fontSize: 21 },
  searchInput: { minWidth: 0, flex: 1, minHeight: 41, color: "#f5ffff", fontSize: 12 },
  candidateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  candidate: { width: "49.2%", minHeight: 60, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(115,204,204,0.2)", borderRadius: 6, padding: 5, backgroundColor: "#151a1b" },
  candidateActive: { borderColor: "#42d5c2", backgroundColor: "rgba(66,213,194,0.08)" },
  candidateImage: { width: 42, height: 42 },
  candidateCopy: { minWidth: 0, flex: 1 },
  candidateName: { color: "#f5ffff", fontSize: 9, fontWeight: "900" },
  check: { width: 27, height: 27, color: "#9db6b8", fontSize: 18, fontWeight: "900", textAlign: "center" },
  checkActive: { color: "#42d5c2" },
  footer: { color: "#9db6b8", fontSize: 9, lineHeight: 14, textAlign: "center" },
  textLight: { color: "#071d20" },
  mutedLight: { color: "#4c7073" },
  accentLight: { color: "#08766b" },
});
