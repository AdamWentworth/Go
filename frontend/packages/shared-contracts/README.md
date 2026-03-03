# shared-contracts

Shared API contracts/types used across clients (web now, mobile next).

## Scope

1. Transport DTOs and endpoint path contracts.
2. No runtime client logic.
3. No browser or React dependencies.

## Current Modules

1. `users.ts`
   - Public user/instances envelope types.
   - User overview DTO types (`UserOverviewUser`, `UserOverview`).
   - User search outcome DTOs (`ForeignInstancesFetchOutcome`, `TrainerAutocompleteOutcome`).
   - Secondary user-update DTOs (`SecondaryUserUpdateRequest`).
   - Trainer autocomplete types.
   - Users endpoint path helpers.
2. `instances.ts`
   - Canonical pokemon instance transport schema (`PokemonInstance`, `InstancesMap`).
3. `search.ts`
   - Search query/result row types.
   - Canonical pokemon search request DTO (`PokemonSearchQueryParams`).
   - Search endpoint path contract.
4. `common.ts`
   - Shared generic response envelope types (`ApiResponse<T>`).
   - Shared URL helper (`buildUrl`) for consistent endpoint composition.
5. `domain.ts`
   - Shared web/mobile-safe normalizers (ownership mode, case-folding, diacritic stripping).
6. `auth.ts`
   - Auth endpoint path helpers.
   - Auth/session transport DTOs (`AuthUser`, `LoginResponse`, `RefreshTokenResponse`).
7. `trades.ts`
   - Trade-related endpoint paths and transport DTOs (`TradeRecord`, `RelatedInstanceRecord`, `PartnerInfo`, `PartnerCoordinates`, `TradeReference`).
   - Trade proposal request DTOs (`TradeProposalRequest`, `TradeProposalPokemonPayload`).
8. `location.ts`
   - Location service endpoint paths and transport DTOs (`Coordinates`, `LocationBase`, `LocationResponse`).
9. `events.ts`
   - Events service endpoint paths.
   - Update transport DTOs (`UpdatesQueryParams`, `SseQueryParams`, `IncomingUpdateEnvelope`).
10. `pokemon.ts`
   - Pokemon service endpoint paths.
   - Pokemon API transport DTOs (`BasePokemon`, `Pokemons`, move/costume/raid/fusion subtypes).
11. `receiver.ts`
   - Receiver service endpoint paths (`receiverContract.endpoints.batchedUpdates`).
   - Receiver batched update payload DTO (`ReceiverBatchedUpdatesPayload`).

## Versioning Policy

1. `@pokemongonexus/shared-contracts` is an internal package (`private: true`) and follows SemVer for repo-level coordination.
2. Additive, non-breaking contract changes should increment `minor`.
3. Breaking contract changes should increment `major` and include consumer updates in the same PR.
4. Any contract change must include:
   - updated module docs in this file
   - relevant contract/unit tests
   - `typecheck` + `lint` green in consumer app(s)

## Usage (frontend)

Import through alias:

```ts
import { usersContract, type UserInstancesEnvelope } from '@shared-contracts/users';
```

This keeps API semantics centralized and reusable for future React Native/Expo clients.
