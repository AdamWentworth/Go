export const locationContract = {
  endpoints: {
    autocomplete: '/autocomplete',
    reverse: '/reverse',
  },
} as const;

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
