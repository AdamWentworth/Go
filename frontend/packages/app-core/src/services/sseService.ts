// services/sseService.ts

import { createScopedLogger } from '@/utils/logger';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
} from './httpClient';
import { eventsContract } from '@shared-contracts/events';
import type {
  IncomingUpdateEnvelope,
  UpdatesQueryParams,
} from '@shared-contracts/events';

export type { IncomingUpdateEnvelope, UpdatesQueryParams } from '@shared-contracts/events';

const log = createScopedLogger('sseService');

export const fetchUpdates = async <
  TPayload extends IncomingUpdateEnvelope = IncomingUpdateEnvelope,
>(
  _userId: string,
  deviceId: string,
  timestamp: string
): Promise<TPayload | null> => {
  try {
    const queryParams: UpdatesQueryParams = {
      device_id: deviceId,
      timestamp,
    };
    const response = await requestWithPolicy(
      buildUrl(import.meta.env.VITE_EVENTS_API_URL, eventsContract.endpoints.getUpdates, queryParams),
      {
        method: 'GET',
      },
    );
    const data = await parseJsonSafe<TPayload>(response);

    if (response.status >= 200 && response.status < 300) {
      return data;
    } else {
      log.warn('Failed to fetch updates.', { status: response.status });
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch updates.', error);
    return null;
  }
};
