import { useEffect, useState } from 'react';
import {
  FaChevronRight,
  FaEye,
  FaLock,
  FaMoon,
  FaSave,
  FaShieldAlt,
  FaUserCog,
} from 'react-icons/fa';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import ThemeSwitch from '@/components/ThemeSwitch';
import {
  fetchTrainerPreferences,
  updateTrainerPreferences,
} from '@/services/socialService';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  TrainerPreferences,
  UpdateTrainerPreferencesRequest,
} from '@shared-contracts/users';

import TrainerPageShell from './TrainerPageShell';

const REDUCED_MOTION_KEY = 'pokegonexus-reduced-motion';

const Settings = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [preferences, setPreferences] = useState<TrainerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem(REDUCED_MOTION_KEY) === 'true',
  );

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void fetchTrainerPreferences()
      .then(setPreferences)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : 'Could not load settings.',
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const updatePreference = <K extends keyof TrainerPreferences>(
    key: K,
    value: TrainerPreferences[K],
  ) => {
    setPreferences((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const savePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    const request: UpdateTrainerPreferencesRequest = {
      profile_visibility: preferences.profile_visibility,
      collection_visibility: preferences.collection_visibility,
      friend_request_permission: preferences.friend_request_permission,
      trainer_code_visibility: preferences.trainer_code_visibility,
      show_location: preferences.show_location,
      show_pokemon_go_name: preferences.show_pokemon_go_name,
    };
    try {
      setPreferences(await updateTrainerPreferences(request));
      toast.success('Privacy settings saved');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save settings.',
      );
    } finally {
      setSaving(false);
    }
  };

  const changeReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  };

  return (
    <TrainerPageShell eyebrow="Preferences" title="Settings">
      {loading ? <div className="trainer-status">Loading settings...</div> : null}

      {!loading && preferences ? (
        <>
          <section className="trainer-section">
            <header>
              <div>
                <span>Who can see you</span>
                <h2>Privacy</h2>
              </div>
              <FaShieldAlt />
            </header>
            <div className="trainer-settings-grid">
              <label className="trainer-field">
                <span>Profile visibility</span>
                <select
                  value={preferences.profile_visibility}
                  onChange={(event) =>
                    updatePreference(
                      'profile_visibility',
                      event.target.value as TrainerPreferences['profile_visibility'],
                    )
                  }
                >
                  <option value="public">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Only me</option>
                </select>
                <small>Controls your trainer card and profile statistics.</small>
              </label>
              <label className="trainer-field">
                <span>Pokemon visibility</span>
                <select
                  value={preferences.collection_visibility}
                  onChange={(event) =>
                    updatePreference(
                      'collection_visibility',
                      event.target
                        .value as TrainerPreferences['collection_visibility'],
                    )
                  }
                >
                  <option value="public">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Only me</option>
                </select>
                <small>Controls access to your public Pokemon catalog.</small>
              </label>
              <label className="trainer-field">
                <span>Friend requests</span>
                <select
                  value={preferences.friend_request_permission}
                  onChange={(event) =>
                    updatePreference(
                      'friend_request_permission',
                      event.target
                        .value as TrainerPreferences['friend_request_permission'],
                    )
                  }
                >
                  <option value="everyone">Allow requests</option>
                  <option value="nobody">Do not allow requests</option>
                </select>
              </label>
              <label className="trainer-field">
                <span>Trainer code visibility</span>
                <select
                  value={preferences.trainer_code_visibility}
                  onChange={(event) =>
                    updatePreference(
                      'trainer_code_visibility',
                      event.target
                        .value as TrainerPreferences['trainer_code_visibility'],
                    )
                  }
                >
                  <option value="public">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Only me</option>
                </select>
              </label>
            </div>
            <div className="trainer-setting-toggles">
              <label>
                <span>
                  <FaEye />
                  Show Pokemon GO name
                </span>
                <input
                  type="checkbox"
                  checked={preferences.show_pokemon_go_name}
                  onChange={(event) =>
                    updatePreference('show_pokemon_go_name', event.target.checked)
                  }
                />
              </label>
              <label>
                <span>
                  <FaEye />
                  Show profile location
                </span>
                <input
                  type="checkbox"
                  checked={preferences.show_location}
                  onChange={(event) =>
                    updatePreference('show_location', event.target.checked)
                  }
                />
              </label>
            </div>
            <div className="trainer-form-actions">
              <button
                type="button"
                className="trainer-button trainer-button-primary"
                disabled={saving}
                onClick={() => void savePreferences()}
              >
                <FaSave />
                {saving ? 'Saving...' : 'Save privacy'}
              </button>
            </div>
          </section>

          <button
            type="button"
            className="trainer-settings-link"
            onClick={() =>
              navigate('/settings/account', {
                state: { contextBackTo: '/settings' },
              })
            }
          >
            <span className="trainer-settings-link-icon">
              <FaUserCog />
            </span>
            <span>
              <strong>Account &amp; security</strong>
              <small>Username, email, password, sign out, and deletion</small>
            </span>
            <FaChevronRight />
          </button>

          <div className="trainer-privacy-note">
            <FaLock />
            Private account data is never shown on public profiles.
          </div>
        </>
      ) : null}

      <section className="trainer-section">
        <header>
          <div>
            <span>This device</span>
            <h2>Display</h2>
          </div>
          <FaMoon />
        </header>
        <div className="trainer-device-settings">
          <div>
            <span>Color theme</span>
            <ThemeSwitch />
          </div>
          <label>
            <span>
              <strong>Reduce motion</strong>
              <small>Use simpler transitions on this device.</small>
            </span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => changeReducedMotion(event.target.checked)}
            />
          </label>
        </div>
      </section>
    </TrainerPageShell>
  );
};

export default Settings;
