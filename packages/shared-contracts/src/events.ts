export const eventsContract = {
  endpoints: {
    getUpdates: '/getUpdates',
    sse: '/sse',
  },
} as const;

export interface UpdatesQueryParams extends Record<string, string> {
  device_id: string;
  timestamp: string;
}

export interface SseQueryParams extends Record<string, string> {
  device_id: string;
}

export interface IncomingUpdateEnvelope<
  TPokemon = Record<string, unknown>,
  TTrade = Record<string, unknown>,
  TRelatedInstance = Record<string, unknown>,
> {
  pokemon?: TPokemon;
  trade?: TTrade;
  relatedInstance?: TRelatedInstance;
  [key: string]: unknown;
}
