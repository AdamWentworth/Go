import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBan,
  FaCheck,
  FaEdit,
  FaExchangeAlt,
  FaStar,
  FaTimes,
  FaUserCheck,
  FaUserClock,
  FaUserPlus,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import {
  acceptFriendRequest,
  blockTrainer,
  deleteFriendRequest,
  fetchTrainerProfile,
  removeFriend,
  sendFriendRequest,
  updateTrainerProfile,
} from "@/services/socialService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useInstancesStore } from "@/features/instances/store/useInstancesStore";
import { useVariantsStore } from "@/features/variants/store/useVariantsStore";
import {
  resolvePokemonDisplayAttributes,
  resolvePokemonDisplayImageUrl,
} from "@/features/pokemonDisplay/pokemonDisplayPresentation";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  TrainerProfile,
  UpdateTrainerProfileRequest,
} from "@shared-contracts/users";

import TrainerPageShell from "./TrainerPageShell";

type ProfileForm = {
  bio: string;
  pokemonGoName: string;
  trainerCode: string;
  team: string;
  trainerLevel: string;
  totalXp: string;
  startedOn: string;
  location: string;
};

const emptyForm: ProfileForm = {
  bio: "",
  pokemonGoName: "",
  trainerCode: "",
  team: "",
  trainerLevel: "",
  totalXp: "",
  startedOn: "",
  location: "",
};

const emptyHighlightSlots = () => Array<string>(6).fill("");

const toDateInput = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

const formatNumber = (value?: number | null) =>
  typeof value === "number" ? value.toLocaleString() : "-";

const profileToForm = (
  profile: TrainerProfile<PokemonInstance>,
): ProfileForm => ({
  bio: profile.bio ?? "",
  pokemonGoName: profile.user.pokemonGoName ?? "",
  trainerCode: profile.trainer_code ?? "",
  team: profile.user.team ?? "",
  trainerLevel: profile.user.trainer_level?.toString() ?? "",
  totalXp: profile.user.total_xp?.toString() ?? "",
  startedOn: toDateInput(profile.user.pogo_started_on),
  location: profile.location ?? "",
});

const HighlightCard = ({
  instance,
  variant,
}: {
  instance: PokemonInstance;
  variant?: PokemonVariant;
}) => {
  if (!variant) {
    return (
      <article className="trainer-highlight">
        <div className="trainer-highlight-placeholder">
          #{instance.pokemon_id}
        </div>
        <strong>
          {instance.nickname || `Pokemon #${instance.pokemon_id}`}
        </strong>
      </article>
    );
  }

  const pokemon = { ...variant, instanceData: instance };
  const image = resolvePokemonDisplayImageUrl({
    pokemon,
    attributes: resolvePokemonDisplayAttributes(pokemon),
  });

  return (
    <article className="trainer-highlight">
      <img src={image} alt="" />
      <div>
        <strong>{instance.nickname || variant.species_name}</strong>
        <span>
          {instance.cp
            ? `CP ${instance.cp.toLocaleString()}`
            : "Featured Pokemon"}
        </span>
      </div>
    </article>
  );
};

const Profile = () => {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { confirm } = useModal();
  const { updateUserDetails } = useAuth();
  const authUser = useAuthStore((state) => state.user);
  const variants = useVariantsStore((state) => state.variants);
  const instances = useInstancesStore((state) => state.instances);

  const username = routeUsername || authUser?.username || "";
  const isOwner =
    Boolean(authUser) &&
    (!routeUsername ||
      routeUsername.toLowerCase() === authUser?.username.toLowerCase());

  const [profile, setProfile] =
    useState<TrainerProfile<PokemonInstance> | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [highlightIds, setHighlightIds] =
    useState<string[]>(emptyHighlightSlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!username) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nextProfile = await fetchTrainerProfile(username);
      setProfile(nextProfile);
      setForm(profileToForm(nextProfile));
      setHighlightIds(
        [
          ...nextProfile.highlights
            .map((entry) => entry.instance_id || "")
            .filter(Boolean),
          ...emptyHighlightSlots(),
        ].slice(0, 6),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load this trainer.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, username]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const variantByID = useMemo(
    () => new Map(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );
  const highlightCandidates = useMemo(() => {
    const byID = new Map<string, PokemonInstance>();
    Object.values(instances).forEach((instance) => {
      if (instance.instance_id && instance.is_caught && !instance.disabled) {
        byID.set(instance.instance_id, instance);
      }
    });
    profile?.highlights.forEach((instance) => {
      if (instance.instance_id) {
        byID.set(instance.instance_id, instance);
      }
    });
    return [...byID.values()].sort((left, right) => {
      const leftName =
        left.nickname ||
        variantByID.get(left.variant_id)?.species_name ||
        `Pokemon #${left.pokemon_id}`;
      const rightName =
        right.nickname ||
        variantByID.get(right.variant_id)?.species_name ||
        `Pokemon #${right.pokemon_id}`;
      return (
        leftName.localeCompare(rightName) || (right.cp ?? 0) - (left.cp ?? 0)
      );
    });
  }, [instances, profile?.highlights, variantByID]);
  const currentProfilePath = routeUsername
    ? `/profile/${encodeURIComponent(routeUsername)}`
    : "/profile";

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateHighlight = (index: number, instanceID: string) => {
    setHighlightIds((current) =>
      current.map((value, slot) => (slot === index ? instanceID : value)),
    );
  };

  const toggleEditing = () => {
    if (editing && profile) {
      setForm(profileToForm(profile));
      setHighlightIds(
        [
          ...profile.highlights
            .map((entry) => entry.instance_id || "")
            .filter(Boolean),
          ...emptyHighlightSlots(),
        ].slice(0, 6),
      );
    }
    setEditing((value) => !value);
  };

  const saveProfile = async () => {
    if (!authUser || !profile) return;
    setSaving(true);
    try {
      const normalizedTrainerCode = form.trainerCode.replace(/\s+/g, "");
      const authChanged =
        form.pokemonGoName !== (authUser.pokemonGoName ?? "") ||
        normalizedTrainerCode !== (authUser.trainerCode ?? "") ||
        form.location !== (authUser.location ?? "");

      if (authChanged) {
        const authResult = await updateUserDetails(authUser.user_id, {
          pokemonGoName: form.pokemonGoName,
          trainerCode: normalizedTrainerCode,
          location: form.location,
        });
        if (!authResult.success) {
          throw new Error(
            typeof authResult.error === "string"
              ? authResult.error
              : "Could not update account identity.",
          );
        }
      }

      const request: UpdateTrainerProfileRequest = {
        bio: form.bio,
        pokemonGoName: form.pokemonGoName,
        trainer_code: normalizedTrainerCode,
        team: form.team,
        location: form.location,
        trainer_level: form.trainerLevel
          ? Number(form.trainerLevel)
          : undefined,
        total_xp: form.totalXp ? Number(form.totalXp) : undefined,
        pogo_started_on: form.startedOn || undefined,
        highlight_instance_ids: highlightIds.filter(Boolean),
      };
      await updateTrainerProfile(request);
      toast.success("Profile updated");
      setEditing(false);
      await loadProfile();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Could not update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const runRelationshipAction = async () => {
    if (!profile) return;
    try {
      switch (profile.viewer.relationship) {
        case "none":
          await sendFriendRequest(profile.user.username);
          toast.success("Friend request sent");
          break;
        case "incoming":
          await acceptFriendRequest(profile.viewer.friendship_id || "");
          toast.success("Friend request accepted");
          break;
        case "outgoing":
          await deleteFriendRequest(profile.viewer.friendship_id || "");
          toast.info("Friend request canceled");
          break;
        case "friend": {
          const shouldRemove = await confirm(
            `Remove ${profile.user.username} from your friends?`,
          );
          if (!shouldRemove) return;
          await removeFriend(profile.user.user_id);
          toast.info("Friend removed");
          break;
        }
        default:
          return;
      }
      await loadProfile();
    } catch (relationshipError) {
      toast.error(
        relationshipError instanceof Error
          ? relationshipError.message
          : "Could not update friendship.",
      );
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    const shouldBlock = await confirm(
      `Block ${profile.user.username}? Existing friendship and requests will be removed.`,
    );
    if (!shouldBlock) return;
    try {
      await blockTrainer(profile.user.user_id);
      toast.info("Trainer blocked");
      navigate("/profile/friends", {
        state: { contextBackTo: currentProfilePath },
      });
    } catch (blockError) {
      toast.error(
        blockError instanceof Error
          ? blockError.message
          : "Could not block trainer.",
      );
    }
  };

  const relationshipButton = () => {
    if (!profile || isOwner || !authUser) return null;
    const { relationship } = profile.viewer;
    const contentByRelationship: Partial<
      Record<
        TrainerProfile<PokemonInstance>["viewer"]["relationship"],
        [React.ReactNode, string]
      >
    > = {
      none: [<FaUserPlus key="icon" />, "Add friend"],
      incoming: [<FaUserCheck key="icon" />, "Accept request"],
      outgoing: [<FaUserClock key="icon" />, "Request sent"],
      friend: [<FaCheck key="icon" />, "Friends"],
    };
    const content = contentByRelationship[relationship];
    if (!content) return null;

    return (
      <button
        type="button"
        className={`trainer-button ${
          relationship === "outgoing" || relationship === "friend"
            ? "trainer-button-secondary"
            : "trainer-button-primary"
        }`}
        onClick={() => void runRelationshipAction()}
      >
        {content}
      </button>
    );
  };

  return (
    <TrainerPageShell
      workspace="profile"
      eyebrow={isOwner ? "Your trainer card" : "Trainer profile"}
      title={profile?.user.username || username || "Profile"}
      actions={
        isOwner && profile ? (
          <button
            type="button"
            className="trainer-button trainer-button-secondary"
            onClick={toggleEditing}
          >
            {editing ? <FaTimes /> : <FaEdit />}
            {editing ? "Cancel" : "Edit"}
          </button>
        ) : (
          relationshipButton()
        )
      }
    >
      {loading ? (
        <div className="trainer-status">Loading trainer profile...</div>
      ) : null}
      {error ? (
        <div className="trainer-status trainer-status-error">{error}</div>
      ) : null}

      {!loading && profile ? (
        <>
          <section
            className={`trainer-profile-band trainer-team-${(
              profile.user.team || "neutral"
            ).toLowerCase()}`}
          >
            <div className="trainer-profile-mark" aria-hidden="true">
              {profile.user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="trainer-profile-identity">
              <span>{profile.user.team || "Unaffiliated trainer"}</span>
              <h2>{profile.user.pokemonGoName || profile.user.username}</h2>
              <p>{profile.bio || "No trainer bio yet."}</p>
              <div className="trainer-profile-meta">
                {profile.user.trainer_level ? (
                  <span>Level {profile.user.trainer_level}</span>
                ) : null}
                {profile.location ? <span>{profile.location}</span> : null}
                {profile.trainer_code ? (
                  <span>
                    {profile.trainer_code.replace(/(\d{4})(?=\d)/g, "$1 ")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="trainer-profile-commands">
              {profile.viewer.can_view_collection ? (
                <button
                  type="button"
                  className="trainer-button trainer-button-primary"
                  onClick={() =>
                    navigate(
                      isOwner
                        ? "/pokemon"
                        : `/pokemon/${encodeURIComponent(profile.user.username)}`,
                      { state: { contextBackTo: currentProfilePath } },
                    )
                  }
                >
                  <FaExchangeAlt />
                  View Pokemon
                </button>
              ) : null}
              {!isOwner && authUser ? (
                <button
                  type="button"
                  className="trainer-icon-button trainer-danger-icon"
                  aria-label="Block trainer"
                  title="Block trainer"
                  onClick={() => void handleBlock()}
                >
                  <FaBan />
                </button>
              ) : null}
            </div>
          </section>

          {editing ? (
            <section className="trainer-section">
              <header>
                <div>
                  <span>Public identity</span>
                  <h2>Edit profile</h2>
                </div>
              </header>
              <div className="trainer-form-grid">
                <label className="trainer-field trainer-field-wide">
                  <span>Bio</span>
                  <textarea
                    maxLength={280}
                    value={form.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                  />
                  <small>{form.bio.length}/280</small>
                </label>
                <label className="trainer-field">
                  <span>Pokemon GO name</span>
                  <input
                    value={form.pokemonGoName}
                    onChange={(event) =>
                      updateField("pokemonGoName", event.target.value)
                    }
                  />
                </label>
                <label className="trainer-field">
                  <span>Trainer code</span>
                  <input
                    inputMode="numeric"
                    maxLength={14}
                    value={form.trainerCode}
                    onChange={(event) =>
                      updateField("trainerCode", event.target.value)
                    }
                  />
                </label>
                <label className="trainer-field">
                  <span>Team</span>
                  <select
                    value={form.team}
                    onChange={(event) =>
                      updateField("team", event.target.value)
                    }
                  >
                    <option value="">Unaffiliated</option>
                    <option value="Mystic">Mystic</option>
                    <option value="Valor">Valor</option>
                    <option value="Instinct">Instinct</option>
                  </select>
                </label>
                <label className="trainer-field">
                  <span>Trainer level</span>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={form.trainerLevel}
                    onChange={(event) =>
                      updateField("trainerLevel", event.target.value)
                    }
                  />
                </label>
                <label className="trainer-field">
                  <span>Total XP</span>
                  <input
                    type="number"
                    min="0"
                    value={form.totalXp}
                    onChange={(event) =>
                      updateField("totalXp", event.target.value)
                    }
                  />
                </label>
                <label className="trainer-field">
                  <span>Started playing</span>
                  <input
                    type="date"
                    value={form.startedOn}
                    onChange={(event) =>
                      updateField("startedOn", event.target.value)
                    }
                  />
                </label>
                <label className="trainer-field trainer-field-wide">
                  <span>Location</span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                  />
                </label>
              </div>
              <div className="trainer-highlight-editor">
                <div>
                  <span>Trainer showcase</span>
                  <h3>Pokemon highlights</h3>
                  <p>Choose up to six caught Pokemon for your profile.</p>
                </div>
                <div className="trainer-highlight-selects">
                  {highlightIds.map((selectedID, index) => (
                    <label
                      className="trainer-field"
                      key={`highlight-slot-${index + 1}`}
                    >
                      <span>Showcase slot {index + 1}</span>
                      <select
                        aria-label={`Showcase slot ${index + 1}`}
                        value={selectedID}
                        onChange={(event) =>
                          updateHighlight(index, event.target.value)
                        }
                      >
                        <option value="">Empty</option>
                        {highlightCandidates.map((instance) => {
                          const instanceID = instance.instance_id || "";
                          const variant = variantByID.get(instance.variant_id);
                          const name =
                            instance.nickname ||
                            variant?.species_name ||
                            `Pokemon #${instance.pokemon_id}`;
                          return (
                            <option
                              key={instanceID}
                              value={instanceID}
                              disabled={
                                instanceID !== selectedID &&
                                highlightIds.includes(instanceID)
                              }
                            >
                              {name}
                              {instance.cp
                                ? ` - CP ${instance.cp.toLocaleString()}`
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
              <div className="trainer-form-actions">
                <button
                  type="button"
                  className="trainer-button trainer-button-primary"
                  disabled={saving}
                  onClick={() => void saveProfile()}
                >
                  <FaCheck />
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </section>
          ) : null}

          <section
            className="trainer-stat-strip"
            aria-label="Collection summary"
          >
            <div>
              <span>Caught</span>
              <strong>{formatNumber(profile.stats.caught)}</strong>
            </div>
            <div>
              <span>Registered</span>
              <strong>{formatNumber(profile.stats.registered)}</strong>
            </div>
            <div>
              <span>For trade</span>
              <strong>{formatNumber(profile.stats.for_trade)}</strong>
            </div>
            <div>
              <span>Wanted</span>
              <strong>{formatNumber(profile.stats.wanted)}</strong>
            </div>
            <div>
              <span>Favorites</span>
              <strong>{formatNumber(profile.stats.favorites)}</strong>
            </div>
          </section>

          <section className="trainer-section">
            <header>
              <div>
                <span>Trainer showcase</span>
                <h2>Pokemon highlights</h2>
              </div>
              <FaStar />
            </header>
            {profile.highlights.length ? (
              <div className="trainer-highlights">
                {profile.highlights.map((instance) => (
                  <HighlightCard
                    key={instance.instance_id || instance.variant_id}
                    instance={instance}
                    variant={variantByID.get(instance.variant_id)}
                  />
                ))}
              </div>
            ) : (
              <p className="trainer-empty">
                {isOwner
                  ? "Your selected Pokemon highlights will appear here."
                  : "This trainer has not selected any Pokemon highlights."}
              </p>
            )}
          </section>
        </>
      ) : null}
    </TrainerPageShell>
  );
};

export default Profile;
