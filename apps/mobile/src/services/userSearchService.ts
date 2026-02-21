import { buildUrl } from '@pokemongonexus/shared-contracts/common';
import type { InstancesMap } from '@pokemongonexus/shared-contracts/instances';
import {
  usersContract,
  type ErrorEnvelope,
  type ForeignInstancesFetchOutcome,
  type TrainerAutocompleteEntry,
  type TrainerAutocompleteOutcome,
  type UserInstancesEnvelope,
} from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../config/runtimeConfig';
import { parseJsonSafe } from './httpClient';

const buildUsersUrlForPath = (pathWithQuery: string): string =>
  buildUrl(runtimeConfig.api.usersApiUrl, pathWithQuery);

const buildConditionalHeaders = (etag?: string | null): Record<string, string> =>
  etag ? { 'If-None-Match': etag } : {};

const getJson = async (
  pathWithQuery: string,
  headers?: Record<string, string>,
): Promise<Response> =>
  fetch(buildUsersUrlForPath(pathWithQuery), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });

export const fetchTrainerAutocomplete = async (
  query: string,
): Promise<TrainerAutocompleteOutcome> => {
  const response = await getJson(usersContract.endpoints.autocompleteTrainers(query));
  if (!response.ok) {
    const body = await parseJsonSafe<ErrorEnvelope>(response);
    return {
      type: 'error',
      status: response.status,
      message: body?.message ?? `Server returned ${response.status}`,
    };
  }

  const body = await parseJsonSafe<TrainerAutocompleteEntry[]>(response);
  if (!Array.isArray(body)) {
    return { type: 'error', message: 'Invalid trainer autocomplete response' };
  }

  return { type: 'success', results: body };
};

export const fetchForeignInstancesByUsername = async (
  username: string,
  etag?: string | null,
): Promise<ForeignInstancesFetchOutcome<InstancesMap>> => {
  const headers = buildConditionalHeaders(etag);

  let response = await getJson(usersContract.endpoints.instancesByUsername(username), headers);

  if (response.status === 403 || response.status === 404) {
    const publicResponse = await getJson(
      usersContract.endpoints.publicUserByUsername(username),
      headers,
    );

    if (publicResponse.ok || publicResponse.status === 304 || publicResponse.status === 404) {
      response = publicResponse;
    }
  }

  if (response.status === 304) return { type: 'notModified' };
  if (response.status === 404) return { type: 'notFound' };
  if (response.status === 403) return { type: 'forbidden' };
  if (!response.ok) {
    return { type: 'error', status: response.status, statusText: response.statusText };
  }

  const body = await parseJsonSafe<UserInstancesEnvelope<InstancesMap>>(response);
  if (!body) {
    return { type: 'error', status: 502, statusText: 'Invalid JSON response' };
  }

  return {
    type: 'success',
    username: body.username ?? body.user?.username ?? username,
    instances: body.instances ?? {},
    etag: response.headers.get('ETag') ?? null,
  };
};

