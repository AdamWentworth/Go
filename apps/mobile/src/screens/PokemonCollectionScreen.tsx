import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { InstancesMap, PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import { useAuth } from '../features/auth/AuthProvider';
import {
  mutateInstanceFavorite,
  mutateInstanceMostWanted,
  mutateInstanceNickname,
  mutateInstanceStatus,
  toReceiverPokemonPayload,
  type InstanceStatusMutation,
} from '../features/instances/instanceMutations';
import {
  filterInstancesByOwnership,
  toInstanceListItems,
  type InstanceListItem,
} from '../features/instances/instanceReadModels';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { sendPokemonUpdate } from '../services/receiverService';
import { fetchForeignInstancesByUsername } from '../services/userSearchService';
import { fetchUserOverview } from '../services/userOverviewService';
import { commonStyles } from '../ui/commonStyles';

type PokemonCollectionScreenProps = NativeStackScreenProps<RootStackParamList, 'PokemonCollection'>;

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];
const MAX_ROWS = 120;

const summarize = (items: InstanceListItem[]) => {
  let caught = 0;
  let trade = 0;
  let wanted = 0;
  for (const item of items) {
    if (item.isCaught) caught += 1;
    if (item.isForTrade) trade += 1;
    if (item.isWanted) wanted += 1;
  }
  return { total: items.length, caught, trade, wanted };
};

const toMutableInstance = (instanceId: string, instance: PokemonInstance): PokemonInstance => ({
  ...instance,
  instance_id: instance.instance_id ?? instanceId,
});

export const PokemonCollectionScreen = ({ navigation, route }: PokemonCollectionScreenProps) => {
  const { user } = useAuth();
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('caught');
  const [usernameInput, setUsernameInput] = useState(route.params?.username ?? '');
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [instancesMap, setInstancesMap] = useState<InstancesMap>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');

  const items = useMemo(() => toInstanceListItems(instancesMap), [instancesMap]);

  const selectedInstance = useMemo(
    () => (selectedInstanceId ? instancesMap[selectedInstanceId] ?? null : null),
    [instancesMap, selectedInstanceId],
  );

  const isOwnCollection = useMemo(() => {
    if (!activeUsername || !user?.username) return false;
    return activeUsername.toLowerCase() === user.username.toLowerCase();
  }, [activeUsername, user?.username]);

  const loadCollection = async () => {
    setLoading(true);
    setError(null);
    setInstancesMap({});
    setSelectedInstanceId(null);
    setNicknameDraft('');

    try {
      const normalized = usernameInput.trim();
      if (normalized.length > 0) {
        const outcome = await fetchForeignInstancesByUsername(normalized);
        if (outcome.type !== 'success') {
          setInstancesMap({});
          if (outcome.type === 'notFound') setError('Trainer not found.');
          else if (outcome.type === 'forbidden') setError('Trainer collection is private.');
          else setError('Unable to load trainer collection.');
          return;
        }
        setActiveUsername(outcome.username);
        setInstancesMap(outcome.instances);
        return;
      }

      if (!user?.user_id) {
        setInstancesMap({});
        setError('You must be authenticated to load your collection.');
        return;
      }

      const overview = await fetchUserOverview(user.user_id);
      setActiveUsername(overview.user?.username ?? user.username ?? null);
      setInstancesMap(overview.pokemon_instances ?? {});
    } catch (nextError) {
      setInstancesMap({});
      setError(nextError instanceof Error ? nextError.message : 'Failed to load collection.');
    } finally {
      setLoading(false);
    }
  };

  const updateInstanceAndSync = async (
    instanceId: string,
    updater: (current: PokemonInstance) => PokemonInstance,
  ) => {
    if (!isOwnCollection || syncing) return;

    const current = instancesMap[instanceId];
    if (!current) return;

    const baseCurrent = toMutableInstance(instanceId, current);
    const nextInstance = toMutableInstance(instanceId, updater(baseCurrent));

    setError(null);
    setSyncing(true);
    setInstancesMap((prev) => ({
      ...prev,
      [instanceId]: nextInstance,
    }));

    try {
      await sendPokemonUpdate(toReceiverPokemonPayload(nextInstance));
    } catch (nextError) {
      setInstancesMap((prev) => ({
        ...prev,
        [instanceId]: baseCurrent,
      }));
      setError(nextError instanceof Error ? nextError.message : 'Failed to sync instance update.');
    } finally {
      setSyncing(false);
    }
  };

  const applyStatus = async (targetStatus: InstanceStatusMutation) => {
    if (!selectedInstanceId) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceStatus(instance, targetStatus),
    );
  };

  const applyFavoriteToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceFavorite(instance, !Boolean(selectedInstance.favorite)),
    );
  };

  const applyMostWantedToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceMostWanted(instance, !Boolean(selectedInstance.most_wanted)),
    );
  };

  const saveNickname = async () => {
    if (!selectedInstanceId) return;
    const normalizedNickname = nicknameDraft.trim();
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceNickname(instance, normalizedNickname.length > 0 ? normalizedNickname : null),
    );
  };

  const filtered = useMemo(() => filterInstancesByOwnership(items, ownershipMode), [items, ownershipMode]);
  const visible = filtered.slice(0, MAX_ROWS);
  const summary = useMemo(() => summarize(items), [items]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Pokemon Collection</Text>
      <Text style={commonStyles.subtitle}>Use blank username to load your own collection</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Foreign username (optional)"
        value={usernameInput}
        onChangeText={setUsernameInput}
        style={commonStyles.input}
      />

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Loading...' : 'Load Collection'} onPress={() => void loadCollection()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {activeUsername ? <Text style={commonStyles.caption}>Active trainer: {activeUsername}</Text> : null}
      {!isOwnCollection && activeUsername ? (
        <Text style={commonStyles.hint}>Read-only mode for foreign trainer collections.</Text>
      ) : null}
      {syncing ? <Text style={commonStyles.caption}>Syncing instance update...</Text> : null}
      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <Text style={commonStyles.caption}>No instances loaded yet.</Text>
      ) : null}

      {items.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Summary</Text>
          <Text style={commonStyles.caption}>Total: {summary.total}</Text>
          <Text style={commonStyles.caption}>Caught: {summary.caught}</Text>
          <Text style={commonStyles.caption}>Trade: {summary.trade}</Text>
          <Text style={commonStyles.caption}>Wanted: {summary.wanted}</Text>
        </View>
      ) : null}

      {items.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Instances ({ownershipMode})</Text>
          <View style={commonStyles.pillRow}>
            {OWNERSHIP_MODES.map((mode) => {
              const selected = mode === ownershipMode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setOwnershipMode(mode)}
                  style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                >
                  <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={commonStyles.caption}>
            Showing {visible.length} of {filtered.length} rows.
          </Text>
          {visible.map((item) => {
            const selected = selectedInstanceId === item.instanceId;
            return (
              <Pressable
                key={item.instanceId}
                onPress={() => {
                  setSelectedInstanceId(item.instanceId);
                  setNicknameDraft(item.nickname ?? '');
                }}
                style={[commonStyles.row, selected ? commonStyles.rowSelected : null]}
              >
                <Text style={commonStyles.rowTitle}>{item.variantId || '(missing variant_id)'}</Text>
                <Text style={commonStyles.rowSub}>instance_id: {item.instanceId}</Text>
                <Text style={commonStyles.rowSub}>nickname: {item.nickname ?? '-'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedInstance ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Selected Instance</Text>
          <Text style={commonStyles.caption}>instance_id: {selectedInstanceId}</Text>
          <Text style={commonStyles.caption}>variant_id: {String(selectedInstance.variant_id ?? '-')}</Text>
          <Text style={commonStyles.caption}>
            status: caught={String(Boolean(selectedInstance.is_caught))}, trade=
            {String(Boolean(selectedInstance.is_for_trade))}, wanted={String(Boolean(selectedInstance.is_wanted))}
          </Text>
          <Text style={commonStyles.caption}>
            favorite={String(Boolean(selectedInstance.favorite))}, most_wanted={String(Boolean(selectedInstance.most_wanted))}
          </Text>

          {isOwnCollection ? (
            <>
              <View style={commonStyles.actions}>
                <Button title="Set Caught" onPress={() => void applyStatus('caught')} disabled={syncing} />
                <Button title="Set Trade" onPress={() => void applyStatus('trade')} disabled={syncing} />
                <Button title="Set Wanted" onPress={() => void applyStatus('wanted')} disabled={syncing} />
                <Button title="Set Missing" onPress={() => void applyStatus('missing')} disabled={syncing} />
                <Button
                  title={selectedInstance.favorite ? 'Unset Favorite' : 'Set Favorite'}
                  onPress={() => void applyFavoriteToggle()}
                  disabled={syncing}
                />
                <Button
                  title={selectedInstance.most_wanted ? 'Unset Most Wanted' : 'Set Most Wanted'}
                  onPress={() => void applyMostWantedToggle()}
                  disabled={syncing || !selectedInstance.is_wanted}
                />
              </View>

              <TextInput
                placeholder="Nickname"
                value={nicknameDraft}
                onChangeText={setNicknameDraft}
                style={commonStyles.input}
              />
              <Button title="Save Nickname" onPress={() => void saveNickname()} disabled={syncing} />
            </>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
});
