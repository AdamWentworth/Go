# shared-contracts

Shared API contracts/types used across clients (web now, mobile next).

## Scope

1. Transport DTOs and endpoint path contracts.
2. No runtime client logic.
3. No browser or React dependencies.

## Current Modules

1. `users.ts`
   - Public user/instances envelope types.
   - Trainer autocomplete types.
   - Users endpoint path helpers.
2. `search.ts`
   - Search query/result row types.
   - Search endpoint path contract.
3. `domain.ts`
   - Shared web/mobile-safe normalizers (ownership mode, case-folding, diacritic stripping).
4. `auth.ts`
   - Auth endpoint path helpers.
5. `trades.ts`
   - Trade-related endpoint paths and transport DTOs (`PartnerInfo`, `TradeReference`).
6. `location.ts`
   - Location service endpoint paths and transport DTOs (`LocationBase`, `LocationResponse`).
7. `events.ts`
   - Events service endpoint paths.
8. `pokemon.ts`
   - Pokemon service endpoint paths.

## Usage (frontend)

Import through alias:

```ts
import { usersContract, type UserInstancesEnvelope } from '@shared-contracts/users';
```

This keeps API semantics centralized and reusable for future React Native/Expo clients.
