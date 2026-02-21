import {
  isCaughtOwnershipMode as isCaughtMode,
  normalizeOwnershipMode as normalizeMode,
  toOwnershipApiValue as toApiValue,
} from '@shared-contracts/domain';
import type { OwnershipMode, OwnershipModeInput } from '@shared-contracts/domain';

export type SearchOwnershipMode = OwnershipMode;
export type SearchOwnershipModeInput = OwnershipModeInput;
export type SearchOwnershipApiValue = OwnershipMode;

export const normalizeOwnershipMode = normalizeMode;
export const toOwnershipApiValue = toApiValue;
export const isCaughtOwnershipMode = isCaughtMode;
