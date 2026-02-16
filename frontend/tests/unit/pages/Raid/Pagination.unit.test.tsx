import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import Pagination from '@/pages/Raid/Pagination';

describe('Pagination', () => {
  it('renders windowed pages and calls navigation handlers', () => {
    const onPageChange = vi.fn();

    render(<Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '4' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: '10' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 9);
  });

  it('disables both directions when totalPages is zero', () => {
    const onPageChange = vi.fn();

    render(<Pagination currentPage={0} totalPages={0} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });
});

