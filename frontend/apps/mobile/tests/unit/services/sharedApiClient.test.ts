import {
  createApiClient,
  type AccessTokenProvider,
} from '@pokemongonexus/shared-api-client';

const response = (status: number, payload: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(
      payload === null ? '' : JSON.stringify(payload),
    ),
  }) as unknown as Response;

describe('shared API client', () => {
  it('preserves HTTP-only cookie authentication for the web adapter', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response(200, { ok: true }));
    const client = createApiClient({
      baseUrl: 'https://pokegonexus.com/api/users',
      authentication: { mode: 'cookie' },
      fetch: fetchMock,
    });

    await expect(client.get('/profile')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://pokegonexus.com/api/users/profile',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('adds a bearer token without browser cookie credentials', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response(200, { ok: true }));
    const tokens: AccessTokenProvider = {
      getAccessToken: jest.fn().mockResolvedValue('access-one'),
      refreshAccessToken: jest.fn(),
    };
    const client = createApiClient({
      baseUrl: 'https://pokegonexus.com/api/users',
      authentication: { mode: 'bearer', tokens },
      fetch: fetchMock,
    });

    await client.get('/profile');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.credentials).toBe('omit');
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer access-one',
    );
  });

  it('refreshes once and retries an unauthorized bearer request', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response(401, { message: 'Expired' }))
      .mockResolvedValueOnce(response(200, { username: 'AdamZilla' }));
    const tokens: AccessTokenProvider = {
      getAccessToken: jest.fn().mockResolvedValue('expired-token'),
      refreshAccessToken: jest.fn().mockResolvedValue('fresh-token'),
    };
    const client = createApiClient({
      baseUrl: 'https://pokegonexus.com/api/users',
      authentication: { mode: 'bearer', tokens },
      fetch: fetchMock,
    });

    await expect(client.get('/profile')).resolves.toEqual({
      username: 'AdamZilla',
    });
    expect(tokens.refreshAccessToken).toHaveBeenCalledTimes(1);
    const retry = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(new Headers(retry.headers).get('Authorization')).toBe(
      'Bearer fresh-token',
    );
  });

  it('surfaces a typed failure with the server message', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response(400, { message: 'Invalid request' }));
    const client = createApiClient({
      baseUrl: 'https://pokegonexus.com/api/users',
      authentication: { mode: 'none' },
      fetch: fetchMock,
    });

    await expect(client.post('/trades', {})).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiClientError',
        status: 400,
        message: 'Invalid request',
        payload: { message: 'Invalid request' },
      }),
    );
  });
});
