// src/types/location.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type {
  LocationBase,
  LocationSuggestion,
  LocationResponse,
} from '@shared-contracts/location';
