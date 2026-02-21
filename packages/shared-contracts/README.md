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
2. `search.ts`
   - Search query/result row types.
   - Canonical pokemon search request DTO (`PokemonSearchQueryParams`).
   - Search endpoint path contract.
3. `domain.ts`
   - Shared web/mobile-safe normalizers (ownership mode, case-folding, diacritic stripping).
4. `auth.ts`
   - Auth endpoint path helpers.
   - Auth/session transport DTOs (`AuthUser`, `LoginResponse`, `RefreshTokenResponse`).
5. `trades.ts`
   - Trade-related endpoint paths and transport DTOs (`PartnerInfo`, `PartnerCoordinates`, `TradeReference`).
6. `location.ts`
   - Location service endpoint paths and transport DTOs (`Coordinates`, `LocationBase`, `LocationResponse`).
7. `events.ts`
   - Events service endpoint paths.
   - Update transport DTOs (`UpdatesQueryParams`, `IncomingUpdateEnvelope`).
8. `pokemon.ts`
   - Pokemon service endpoint paths.

## Usage (frontend)

Import through alias:

```ts
import { usersContract, type UserInstancesEnvelope } from '@shared-contracts/users';
```

This keeps API semantics centralized and reusable for future React Native/Expo clients.
