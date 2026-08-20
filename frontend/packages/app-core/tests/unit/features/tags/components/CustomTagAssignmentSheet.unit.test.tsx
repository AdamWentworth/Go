import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CustomTagAssignmentSheet from '@/features/tags/components/CustomTagAssignmentSheet';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';

describe('CustomTagAssignmentSheet', () => {
  const applyChanges = vi.fn();

  beforeEach(() => {
    applyChanges.mockReset();
    applyChanges.mockResolvedValue({ updated: 2, skipped: 0 });
    useInstancesStore.setState({
      instances: {
        'caught-1': {
          instance_id: 'caught-1',
          is_caught: true,
          is_wanted: false,
          caught_tags: ['tag-raids'],
          wanted_tags: [],
        },
        'caught-2': {
          instance_id: 'caught-2',
          is_caught: true,
          is_wanted: false,
          caught_tags: [],
          wanted_tags: [],
        },
      } as any,
      instancesLoading: false,
    });
    useTagsStore.setState({
      customTags: {
        caught: {
          'tag-raids': {
            tag: {
              tag_id: 'tag-raids',
              parent: 'caught',
              name: 'Raid team',
              color: '#2563EB',
              sort: 10,
            },
            items: {},
          },
        },
        wanted: {},
      },
      applyCustomTagChanges: applyChanges,
    });
  });

  it('shows mixed membership and applies an explicit bulk selection', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(
      <CustomTagAssignmentSheet
        instanceIds={new Set(['caught-1', 'caught-2'])}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    const tagButton = screen.getByRole('button', { name: /raid team/i });
    expect(tagButton).toHaveClass('mixed');
    expect(tagButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(tagButton);
    expect(tagButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /apply tags/i }));

    await waitFor(() => {
      expect(applyChanges).toHaveBeenCalledWith(
        new Set(['caught-1', 'caught-2']),
        { 'tag-raids': true },
      );
      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
