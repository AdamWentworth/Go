import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCustomTag,
  deleteCustomTag,
  fetchCustomTags,
  updateCustomTag,
} from '@/services/tagService';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe.sequential('tagService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('loads custom tag definitions with authenticated cookies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      tags: [{ tag_id: 'tag-1', parent: 'caught', name: 'Raids', color: '#2563EB', sort: 10 }],
    }));

    await expect(fetchCustomTags()).resolves.toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/tags');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('creates and updates tag definitions without membership payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { tag: { tag_id: 'tag-1', parent: 'caught', name: 'Raids', color: '#2563EB' } }))
      .mockResolvedValueOnce(jsonResponse(200, { tag: { tag_id: 'tag-1', parent: 'caught', name: 'Raid team', color: '#0D9488' } }));

    await createCustomTag({ parent: 'caught', name: 'Raids', color: '#2563EB' });
    await updateCustomTag('tag-1', { name: 'Raid team', color: '#0D9488' });

    const createBody = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(createBody).toEqual({ parent: 'caught', name: 'Raids', color: '#2563EB' });
    expect(createBody).not.toHaveProperty('instance_ids');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT' });
  });

  it('returns affected instances when deleting a definition', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      tag_id: 'tag-1',
      affected_instance_ids: ['instance-1'],
    }));

    await expect(deleteCustomTag('tag-1')).resolves.toEqual({
      tag_id: 'tag-1',
      affected_instance_ids: ['instance-1'],
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
  });

  it('surfaces server validation messages', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { message: 'A tag with that name already exists.' }));
    await expect(createCustomTag({ parent: 'wanted', name: 'Rare', color: '#E11D48' }))
      .rejects.toThrow('A tag with that name already exists.');
  });
});
