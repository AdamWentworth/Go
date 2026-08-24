import * as Crypto from 'expo-crypto';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonCatalogEntry } from '@pokemongonexus/shared-domain/catalog';
import { createNativeCollectionSyncBatch } from '../../services/collectionSyncApi';
import type { NativeCollectionSnapshot } from '../../services/collectionApi';
import type { NativeReceiverApiClient } from '../../services/nativeApiClients';
import type { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import { sendPendingNativeCollectionBatches } from './collectionSyncCoordinator';

export type NativeCatalogDestination = 'caught' | 'trade' | 'wanted';

const variantSuffix = (entry: PokemonCatalogEntry): string =>
  entry.id.slice(entry.id.indexOf('-') + 1).toLowerCase();

export const createNativeInstanceFromCatalogEntry = ({
  entry,
  pokemon,
  destination,
  instanceId,
  now = Date.now(),
}: {
  entry: PokemonCatalogEntry;
  pokemon: BasePokemon;
  destination: NativeCatalogDestination;
  instanceId: string;
  now?: number;
}): PokemonInstance => {
  const suffix = variantSuffix(entry);
  const shiny = suffix.includes('shiny');
  const shadow = suffix.includes('shadow');
  const isMega = suffix.startsWith('mega') || suffix.startsWith('shiny_mega')
    || suffix === 'primal' || suffix === 'shiny_primal';
  const isFused = suffix.startsWith('fusion_') || suffix.startsWith('shiny_fusion_');
  if (destination !== 'caught' && (shadow || isMega || isFused)) {
    const reason = shadow ? 'Shadow' : isMega ? 'Mega or Primal' : 'fusion';
    throw new Error(`${reason} Pokémon cannot be added to ${destination === 'trade' ? 'For Trade' : 'Wanted'}.`);
  }

  const costume = pokemon.costumes?.find((candidate) =>
    entry.id === `${String(pokemon.pokemon_id).padStart(4, '0')}-${candidate.name}_default`
    || entry.id === `${String(pokemon.pokemon_id).padStart(4, '0')}-${candidate.name}_shiny`
    || entry.id === `${String(pokemon.pokemon_id).padStart(4, '0')}-shadow_${candidate.name}_default`
    || entry.id === `${String(pokemon.pokemon_id).padStart(4, '0')}-shadow_${candidate.name}_shiny`);
  const mega = isMega
    ? pokemon.megaEvolutions?.find((candidate) => {
      if (candidate.primal) return suffix.includes('primal');
      const form = candidate.form?.trim().toLowerCase();
      return suffix === `mega${form ? `_${form}` : ''}`
        || suffix === `shiny_mega${form ? `_${form}` : ''}`;
    })
    : undefined;
  const fusionId = isFused
    ? Number.parseInt(suffix.split('fusion_')[1] ?? '', 10)
    : Number.NaN;
  const fusion = Number.isFinite(fusionId)
    ? pokemon.fusion?.find((candidate) => candidate.fusion_id === fusionId)
    : undefined;
  const crownId = suffix.includes('crown_')
    ? Number.parseInt(suffix.split('crown_')[1] ?? '', 10)
    : Number.NaN;
  const crown = Number.isFinite(crownId)
    ? pokemon.crownForms?.find((candidate) => candidate.id === crownId)
    : undefined;

  return {
    instance_id: instanceId,
    variant_id: entry.id,
    pokemon_id: entry.pokemonId,
    nickname: null,
    cp: null,
    level: null,
    attack_iv: null,
    defense_iv: null,
    stamina_iv: null,
    shiny,
    costume_id: costume?.costume_id ?? null,
    lucky: false,
    shadow,
    purified: false,
    fast_move_id: null,
    charged_move1_id: null,
    charged_move2_id: null,
    weight: null,
    height: null,
    gender: null,
    mega: isMega,
    mega_form: mega?.form ?? null,
    is_mega: isMega,
    dynamax: suffix.includes('dynamax'),
    gigantamax: suffix.includes('gigantamax'),
    crown: Boolean(crown),
    max_attack: null,
    max_guard: null,
    max_spirit: null,
    is_fused: isFused,
    fusion: fusion ? { ...fusion } : null,
    fusion_form: crown?.display_form ?? fusion?.name ?? null,
    fused_with: null,
    is_traded: false,
    traded_date: null,
    original_trainer_id: null,
    original_trainer_name: null,
    is_caught: destination !== 'wanted',
    is_for_trade: destination === 'trade',
    is_wanted: destination === 'wanted',
    most_wanted: false,
    caught_tags: [],
    trade_tags: [],
    wanted_tags: [],
    not_trade_list: {},
    not_wanted_list: {},
    trade_filters: {},
    wanted_filters: {},
    wanted_size_preferences: null,
    mirror: false,
    pref_lucky: false,
    friendship_level: null,
    registered: true,
    favorite: false,
    disabled: false,
    pokeball: null,
    location_card: null,
    location_caught: null,
    date_caught: null,
    date_added: new Date(now).toISOString(),
    last_update: now,
    gps: null,
  };
};

type CollectionOutboxPort = Pick<
  typeof nativeCollectionOutbox,
  'queue' | 'list' | 'markAttemptFailed' | 'markAcknowledged' | 'removeAcknowledged'
>;

export const persistNativeCatalogAddition = async ({
  userId,
  snapshot,
  entry,
  destination,
  outbox,
  receiverClient,
  onQueued,
  instanceId = Crypto.randomUUID(),
  syncBatchId = Crypto.randomUUID(),
  now = Date.now(),
}: {
  userId: string;
  snapshot: NativeCollectionSnapshot;
  entry: PokemonCatalogEntry;
  destination: NativeCatalogDestination;
  outbox: CollectionOutboxPort;
  receiverClient: Pick<NativeReceiverApiClient, 'post'>;
  onQueued?: (instance: PokemonInstance) => Promise<void> | void;
  instanceId?: string;
  syncBatchId?: string;
  now?: number;
}) => {
  const pokemon = snapshot.catalog.find((candidate) => candidate.pokemon_id === entry.pokemonId);
  if (!pokemon) throw new Error('This Pokémon is no longer in the catalog.');
  const instance = createNativeInstanceFromCatalogEntry({
    entry,
    pokemon,
    destination,
    instanceId,
    now,
  });
  const batch = createNativeCollectionSyncBatch({
    syncBatchId,
    location: null,
    updates: [{ ...instance, instance_id: instanceId }],
  });
  await outbox.queue(userId, batch, now);
  await onQueued?.(instance);
  const sent = await sendPendingNativeCollectionBatches({ userId, outbox, receiverClient });
  return {
    instance,
    syncState: sent.failedBatchId ? 'pending' as const : 'acknowledged' as const,
    message: sent.failedBatchId
      ? 'Added on this device. It will sync when Receiver is available.'
      : 'Pokémon added. Receiver accepted the change.',
  };
};
