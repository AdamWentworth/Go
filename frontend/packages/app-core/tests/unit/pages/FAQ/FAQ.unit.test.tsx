import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import FAQ from '@/pages/FAQ/FAQ';

describe('FAQ page', () => {
  it('searches both questions and answer content', () => {
    render(<MemoryRouter><FAQ /></MemoryRouter>);

    const search = screen.getByRole('searchbox', {
      name: 'Search questions and answers',
    });
    fireEvent.change(search, { target: { value: 'Forever Friends' } });

    expect(screen.getByText('1 question matching “Forever Friends”')).toBeInTheDocument();
    expect(screen.getByText('What does the fifth friendship heart mean?')).toBeInTheDocument();
    expect(screen.queryByText('How do custom tags work?')).not.toBeInTheDocument();
  });

  it('filters categories and can expand every visible answer', () => {
    render(<MemoryRouter><FAQ /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Collection & tags' }));
    expect(screen.getByText('5 questions')).toBeInTheDocument();
    expect(screen.getByText('How do custom tags work?')).toBeInTheDocument();
    expect(screen.queryByText('How do I propose a trade?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand results' }));
    expect(screen.getByText(/Default system groups such as All Caught/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Collapse results' })).toBeInTheDocument();
  });

  it('opens and reveals a directly linked answer', async () => {
    render(<MemoryRouter initialEntries={['/faq#remote-trades']}><FAQ /></MemoryRouter>);

    await waitFor(() => {
      expect(document.getElementById('remote-trades')).toHaveAttribute('open');
    });
    expect(screen.getByText(/Five hearts represents Forever Friends/i)).toBeVisible();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<MemoryRouter><FAQ /></MemoryRouter>);

    await expect(container).toHaveNoViolations();
  });
});
