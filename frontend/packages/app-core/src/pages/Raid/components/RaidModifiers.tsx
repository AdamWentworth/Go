import {
  FRIENDSHIP_DAMAGE_BONUS,
  MEGA_ALLY_DAMAGE_BONUS,
  type FriendshipKey,
  type MegaAllyBonusKey,
  type PartyPowerKey,
  type RaidBossMovesetMode,
  type RaidCounterSettings,
  type ShadowBossMode,
} from "../utils/raidCalculations";
import {
  ATTACKER_LEVEL_OPTIONS,
  FRIENDSHIP_OPTIONS,
  MEGA_OPTIONS,
  PARTY_POWER_OPTIONS,
  RELOBBY_DELAY_OPTIONS,
  capitalize,
} from "../utils/raidViewModel";

interface RaidModifiersProps {
  typeOptions: string[];
  attackerLevel: RaidCounterSettings["attackerLevel"];
  onAttackerLevelChange: (level: RaidCounterSettings["attackerLevel"]) => void;
  friendship: FriendshipKey;
  onFriendshipChange: (friendship: FriendshipKey) => void;
  megaAllyBonus: MegaAllyBonusKey;
  onMegaAllyBonusChange: (bonus: MegaAllyBonusKey) => void;
  partyPower: PartyPowerKey;
  onPartyPowerChange: (partyPower: PartyPowerKey) => void;
  weatherBoostedType: string;
  onWeatherBoostedTypeChange: (type: string) => void;
  relobbySeconds: number;
  onRelobbySecondsChange: (seconds: number) => void;
  includeShadowControls: boolean;
  includeRelobbyControls?: boolean;
  includeBossMovesetControls?: boolean;
  bossMovesetMode: RaidBossMovesetMode;
  onBossMovesetModeChange: (mode: RaidBossMovesetMode) => void;
  shadowMechanicsEnabled: boolean;
  selectedBossIsShadowRaid: boolean;
  shadowRaid: boolean;
  onShadowRaidChange: (shadowRaid: boolean) => void;
  shadowBossMode: ShadowBossMode;
  onShadowBossModeChange: (mode: ShadowBossMode) => void;
}

const RaidModifiers = ({
  typeOptions,
  attackerLevel,
  onAttackerLevelChange,
  friendship,
  onFriendshipChange,
  megaAllyBonus,
  onMegaAllyBonusChange,
  partyPower,
  onPartyPowerChange,
  weatherBoostedType,
  onWeatherBoostedTypeChange,
  relobbySeconds,
  onRelobbySecondsChange,
  includeShadowControls,
  includeRelobbyControls = false,
  includeBossMovesetControls = false,
  bossMovesetMode,
  onBossMovesetModeChange,
  shadowMechanicsEnabled,
  selectedBossIsShadowRaid,
  shadowRaid,
  onShadowRaidChange,
  shadowBossMode,
  onShadowBossModeChange,
}: RaidModifiersProps) => (
  <section className="raid-settings-grid" aria-label="Raid modifiers">
    <label className="raid-field">
      <span>Attacker level</span>
      <select
        value={attackerLevel}
        onChange={(event) =>
          onAttackerLevelChange(
            event.target.value as RaidCounterSettings["attackerLevel"],
          )
        }
      >
        {ATTACKER_LEVEL_OPTIONS.map((level) => (
          <option key={level} value={level}>
            Level {level.replace(".0", "")}
          </option>
        ))}
      </select>
    </label>

    <label className="raid-field">
      <span>Friendship</span>
      <select
        value={friendship}
        onChange={(event) =>
          onFriendshipChange(event.target.value as FriendshipKey)
        }
      >
        {FRIENDSHIP_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} ({FRIENDSHIP_DAMAGE_BONUS[option.key].toFixed(2)}x)
          </option>
        ))}
      </select>
    </label>

    <label className="raid-field">
      <span>Mega ally</span>
      <select
        value={megaAllyBonus}
        onChange={(event) =>
          onMegaAllyBonusChange(event.target.value as MegaAllyBonusKey)
        }
      >
        {MEGA_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} ({MEGA_ALLY_DAMAGE_BONUS[option.key].toFixed(1)}x)
          </option>
        ))}
      </select>
    </label>

    <label className="raid-field">
      <span>Party Power</span>
      <select
        value={partyPower}
        onChange={(event) =>
          onPartyPowerChange(event.target.value as PartyPowerKey)
        }
      >
        {PARTY_POWER_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>

    <label className="raid-field">
      <span>Weather boost</span>
      <select
        value={weatherBoostedType}
        onChange={(event) => onWeatherBoostedTypeChange(event.target.value)}
      >
        <option value="none">No weather boost</option>
        {typeOptions.map((type) => (
          <option key={type} value={type}>
            {capitalize(type)}
          </option>
        ))}
      </select>
    </label>

    {includeRelobbyControls && (
      <label className="raid-field">
        <span>Relobby delay</span>
        <select
          value={relobbySeconds}
          onChange={(event) =>
            onRelobbySecondsChange(Number(event.target.value))
          }
        >
          {RELOBBY_DELAY_OPTIONS.map((seconds) => (
            <option key={seconds} value={seconds}>
              {seconds === 0 ? "No delay" : `${seconds} seconds`}
            </option>
          ))}
        </select>
      </label>
    )}

    {includeBossMovesetControls && (
      <label className="raid-field">
        <span>Boss movesets</span>
        <select
          value={bossMovesetMode}
          onChange={(event) =>
            onBossMovesetModeChange(
              event.target.value as RaidBossMovesetMode,
            )
          }
        >
          <option value="expected">Expected across legal movesets</option>
          <option value="favorable">Favorable incoming moveset</option>
          <option value="hostile">Hostile incoming moveset</option>
        </select>
      </label>
    )}

    {includeShadowControls && (
      <div className="raid-shadow-controls">
        <button
          className={`raid-toggle-button ${shadowMechanicsEnabled ? "active" : ""}`}
          disabled={selectedBossIsShadowRaid}
          onClick={() => onShadowRaidChange(!shadowRaid)}
          type="button"
        >
          {selectedBossIsShadowRaid ? "Shadow raid data" : "Shadow raid"}
        </button>
        {shadowMechanicsEnabled && (
          <div
            className="raid-segmented-control"
            aria-label="Shadow boss state"
          >
            {(["subdued", "enraged"] as ShadowBossMode[]).map((mode) => (
              <button
                className={shadowBossMode === mode ? "active" : ""}
                key={mode}
                onClick={() => onShadowBossModeChange(mode)}
                type="button"
              >
                {capitalize(mode)}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </section>
);

export default RaidModifiers;
