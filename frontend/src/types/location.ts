// src/types/location.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationBase {
  name?: string;
  city?: string;
  state_or_province?: string;
  country?: string;
  [key: string]: unknown;
}

export interface LocationSuggestion extends LocationBase {
  displayName: string;
}

export interface LocationResponse {
  locations?: LocationBase[];
}
