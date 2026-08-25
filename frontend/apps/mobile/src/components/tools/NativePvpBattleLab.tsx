import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  PokemonPvPBattleMechanics,
  PokemonPvPBattleResponse,
  PokemonPvPRankingEntry,
} from "@pokemongonexus/shared-contracts/pokemon";
import {
  buildPvPBattleFighterFromRankingEntry,
  simulatePvPBattleLocally,
} from "@pokemongonexus/shared-domain/pvp-battle";

type Props = {
  assetBaseUrl: string;
  entries: PokemonPvPRankingEntry[];
  light: boolean;
  mechanics: PokemonPvPBattleMechanics;
};

const assetUri = (base: string, value: string): string | undefined => {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const Choice = ({
  active,
  label,
  light,
  onPress,
}: {
  active: boolean;
  label: string;
  light: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[
      styles.choice,
      light && styles.controlLight,
      active && styles.choiceActive,
    ]}
  >
    <Text
      style={[
        styles.choiceText,
        light && styles.textLight,
        active && styles.choiceTextActive,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const ResultSide = ({
  entry,
  index,
  light,
  result,
}: {
  entry: PokemonPvPRankingEntry;
  index: 0 | 1;
  light: boolean;
  result: PokemonPvPBattleResponse;
}) => {
  const combatant = result.fighters[index];
  const hpPercent =
    combatant.maxHp > 0
      ? Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100))
      : 0;
  return (
    <View style={styles.resultSide}>
      <Text
        numberOfLines={1}
        style={[styles.resultName, light && styles.textLight]}
      >
        {entry.name}
      </Text>
      <View style={[styles.hpTrack, light && styles.hpTrackLight]}>
        <View style={[styles.hpFill, { width: `${hpPercent}%` }]} />
      </View>
      <Text style={[styles.resultMeta, light && styles.mutedLight]}>
        {combatant.hp}/{combatant.maxHp} HP · {combatant.shields} shields ·{" "}
        {combatant.energy} energy
      </Text>
      <Text style={styles.rating}>{result.ratings[index]} rating</Text>
    </View>
  );
};

export const NativePvpBattleLab = ({
  assetBaseUrl,
  entries,
  light,
  mechanics,
}: Props) => {
  const readyEntries = useMemo(
    () =>
      entries.filter(
        (entry) => buildPvPBattleFighterFromRankingEntry(entry) != null,
      ),
    [entries],
  );
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [shields, setShields] = useState<[number, number]>([1, 1]);
  const [energy, setEnergy] = useState<[number, number]>([0, 0]);
  const [result, setResult] = useState<PokemonPvPBattleResponse | null>(null);
  const [error, setError] = useState("");

  const left =
    readyEntries.find((entry) => entry.speciesId === leftId) ?? readyEntries[0];
  const right =
    readyEntries.find((entry) => entry.speciesId === rightId) ??
    readyEntries.find((entry) => entry.speciesId !== left?.speciesId) ??
    readyEntries[0];

  const selectEntry = (side: 0 | 1, entry: PokemonPvPRankingEntry) => {
    if (side === 0) setLeftId(entry.speciesId);
    else setRightId(entry.speciesId);
    setResult(null);
    setError("");
  };

  const setPairValue = (
    setter: Dispatch<SetStateAction<[number, number]>>,
    side: 0 | 1,
    value: number,
  ) => {
    setter((current) =>
      side === 0 ? [value, current[1]] : [current[0], value],
    );
    setResult(null);
    setError("");
  };

  const simulate = () => {
    if (!left || !right) return;
    const fighters = [
      buildPvPBattleFighterFromRankingEntry(left, left.speciesId),
      buildPvPBattleFighterFromRankingEntry(right, right.speciesId),
    ] as const;
    if (!fighters[0] || !fighters[1]) {
      setError(
        "Complete move and battle-stat data is required for both Pokémon.",
      );
      return;
    }
    try {
      setResult(
        simulatePvPBattleLocally({
          mechanics,
          fighters: [fighters[0], fighters[1]],
          shields,
          startingEnergy: energy,
          recordTimeline: true,
        }),
      );
      setError("");
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "The battle could not be simulated.",
      );
    }
  };

  if (readyEntries.length < 2) {
    return (
      <View style={[styles.panel, light && styles.panelLight]}>
        <Text style={styles.eyebrow}>BATTLE LAB</Text>
        <Text style={[styles.heading, light && styles.textLight]}>
          Battle data unavailable
        </Text>
        <Text style={[styles.body, light && styles.mutedLight]}>
          This format snapshot needs complete fast-move, charged-move, and
          battle-stat data for at least two Pokémon.
        </Text>
      </View>
    );
  }

  const keyEvents =
    result?.timeline
      .filter(
        (event) => event.kind === "charged" || event.shielded || event.buffed,
      )
      .slice(0, 12) ?? [];
  const winner =
    result?.winner === 0 ? left : result?.winner === 1 ? right : null;

  return (
    <>
      <View style={[styles.panel, light && styles.panelLight]}>
        <Text style={styles.eyebrow}>BATTLE LAB</Text>
        <Text style={[styles.heading, light && styles.textLight]}>
          Simulate a focused matchup
        </Text>
        <Text style={[styles.body, light && styles.mutedLight]}>
          Set shields and starting energy, then run the same deterministic
          mechanics used by the full web Battle Lab.
        </Text>

        <View style={styles.battlePair}>
          {(
            [
              ["Your pick", left],
              ["Opponent", right],
            ] as const
          ).map(([label, entry]) => (
            <View
              key={label}
              style={[styles.battleSide, light && styles.controlLight]}
            >
              <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>
              <Image
                resizeMode="contain"
                source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }}
                style={styles.battleImage}
              />
              <Text
                numberOfLines={2}
                style={[styles.pokemonName, light && styles.textLight]}
              >
                {entry.name}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.moves, light && styles.mutedLight]}
              >
                {entry.moveset.map((move) => move.name).join(" · ")}
              </Text>
            </View>
          ))}
        </View>

        {([0, 1] as const).map((side) => (
          <View
            key={side}
            style={[styles.conditions, light && styles.conditionsLight]}
          >
            <Text style={[styles.conditionTitle, light && styles.textLight]}>
              {side === 0 ? "Your conditions" : "Opponent conditions"}
            </Text>
            <View style={styles.conditionRow}>
              <Text style={[styles.conditionLabel, light && styles.mutedLight]}>
                Shields
              </Text>
              {[0, 1, 2].map((value) => (
                <Choice
                  active={shields[side] === value}
                  key={value}
                  label={String(value)}
                  light={light}
                  onPress={() => setPairValue(setShields, side, value)}
                />
              ))}
            </View>
            <View style={styles.conditionRow}>
              <Text style={[styles.conditionLabel, light && styles.mutedLight]}>
                Energy
              </Text>
              {[0, 25, 50, 75, 100].map((value) => (
                <Choice
                  active={energy[side] === value}
                  key={value}
                  label={String(value)}
                  light={light}
                  onPress={() => setPairValue(setEnergy, side, value)}
                />
              ))}
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Simulate battle"
          onPress={simulate}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Simulate battle</Text>
        </Pressable>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>

      {result ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.result, light && styles.panelLight]}
        >
          <Text style={styles.eyebrow}>SIMULATED RESULT</Text>
          <Text style={[styles.winner, light && styles.textLight]}>
            {winner ? `${winner.name} wins` : "Battle ends in a draw"}
          </Text>
          <Text style={[styles.body, light && styles.mutedLight]}>
            {(result.timeMs / 1000).toFixed(1)} seconds · {result.turns} turns
          </Text>
          <ResultSide entry={left} index={0} light={light} result={result} />
          <ResultSide entry={right} index={1} light={light} result={result} />
          {keyEvents.length ? (
            <View style={[styles.timeline, light && styles.conditionsLight]}>
              <Text style={[styles.conditionTitle, light && styles.textLight]}>
                Key moments
              </Text>
              {keyEvents.map((event, index) => (
                <Text
                  key={`${event.turn}-${event.actor}-${index}`}
                  style={[styles.timelineEvent, light && styles.mutedLight]}
                >
                  Turn {event.turn}:{" "}
                  {event.actor === 0 ? left.name : right.name} used{" "}
                  {event.moveId}
                  {event.shielded ? " · shielded" : ""}
                  {event.buffed ? " · stat change" : ""}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, light && styles.textLight]}>
        Choose your pick
      </Text>
      <ScrollView
        contentContainerStyle={styles.pickerRail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {readyEntries.slice(0, 40).map((entry) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose ${entry.name} as your pick`}
            key={entry.speciesId}
            onPress={() => selectEntry(0, entry)}
            style={[
              styles.picker,
              light && styles.controlLight,
              left.speciesId === entry.speciesId && styles.pickerActive,
            ]}
          >
            <Image
              resizeMode="contain"
              source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }}
              style={styles.pickerImage}
            />
            <Text
              numberOfLines={2}
              style={[styles.pickerName, light && styles.textLight]}
            >
              {entry.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[styles.sectionTitle, light && styles.textLight]}>
        Choose opponent
      </Text>
      <ScrollView
        contentContainerStyle={styles.pickerRail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {readyEntries.slice(0, 40).map((entry) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose ${entry.name} as opponent`}
            key={entry.speciesId}
            onPress={() => selectEntry(1, entry)}
            style={[
              styles.picker,
              light && styles.controlLight,
              right.speciesId === entry.speciesId && styles.pickerActive,
            ]}
          >
            <Image
              resizeMode="contain"
              source={{ uri: assetUri(assetBaseUrl, entry.imageUrl) }}
              style={styles.pickerImage}
            />
            <Text
              numberOfLines={2}
              style={[styles.pickerName, light && styles.textLight]}
            >
              {entry.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#34434b",
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#151b20",
  },
  panelLight: { borderColor: "#c0ccd2", backgroundColor: "#fff" },
  controlLight: { borderColor: "#bdc9cf", backgroundColor: "#fff" },
  textLight: { color: "#14232a" },
  mutedLight: { color: "#5d6e76" },
  eyebrow: {
    color: "#299cf5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  heading: { color: "#fff", fontSize: 18, fontWeight: "900" },
  body: { color: "#a8b5bc", fontSize: 11, lineHeight: 16 },
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
  battleImage: { width: 100, height: 94 },
  pokemonName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  moves: {
    minHeight: 30,
    marginTop: 3,
    color: "#99a7ae",
    fontSize: 8.5,
    lineHeight: 12,
    textAlign: "center",
  },
  conditions: {
    gap: 7,
    borderWidth: 1,
    borderColor: "#334149",
    borderRadius: 11,
    padding: 9,
    backgroundColor: "#11171b",
  },
  conditionsLight: { borderColor: "#d0d9de", backgroundColor: "#f6f9fa" },
  conditionTitle: { color: "#fff", fontSize: 11, fontWeight: "900" },
  conditionRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  conditionLabel: {
    width: 48,
    color: "#9daab1",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  choice: {
    minWidth: 34,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#414e56",
    borderRadius: 9,
    paddingHorizontal: 7,
    backgroundColor: "#1a2227",
  },
  choiceActive: { borderColor: "#299cf5", backgroundColor: "#123c61" },
  choiceText: { color: "#aab6bc", fontSize: 10, fontWeight: "900" },
  choiceTextActive: { color: "#fff" },
  primary: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#168ced",
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  error: {
    color: "#ff9bad",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  result: {
    gap: 7,
    borderWidth: 1,
    borderColor: "#42cc9f",
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#12241f",
  },
  winner: { color: "#fff", fontSize: 22, fontWeight: "900" },
  resultSide: { gap: 4, paddingVertical: 4 },
  resultName: { color: "#fff", fontSize: 12, fontWeight: "900" },
  hpTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#344149",
  },
  hpTrackLight: { backgroundColor: "#d5dee2" },
  hpFill: { height: "100%", borderRadius: 999, backgroundColor: "#42cc9f" },
  resultMeta: { color: "#9daab1", fontSize: 9 },
  rating: { color: "#299cf5", fontSize: 10, fontWeight: "900" },
  timeline: {
    gap: 4,
    marginTop: 3,
    borderWidth: 1,
    borderColor: "#334149",
    borderRadius: 10,
    padding: 9,
    backgroundColor: "#11171b",
  },
  timelineEvent: { color: "#9daab1", fontSize: 9, lineHeight: 13 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
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
  pickerActive: { borderColor: "#42cc9f", backgroundColor: "#123c31" },
  pickerImage: { width: 66, height: 66 },
  pickerName: {
    minHeight: 28,
    color: "#fff",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
  },
});
