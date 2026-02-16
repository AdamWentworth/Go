import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PartnerInfoModal, {
  formatTrainerCode,
} from '@/pages/Trades/components/PartnerInfoModal';

const mocks = vi.hoisted(() => ({
  writeTextMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isLightMode: true,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>close</button>
  ),
}));

describe('PartnerInfoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: mocks.writeTextMock },
      configurable: true,
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('formats trainer codes in groups of four digits', () => {
    expect(formatTrainerCode('1234 5678-9012')).toBe('1234 5678 9012');
    expect(formatTrainerCode('')).toBe('N/A');
  });

  it('returns null when partnerInfo is missing', () => {
    const { container } = render(<PartnerInfoModal partnerInfo={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders formatted trainer details and supports copying trainer code', async () => {
    render(
      <PartnerInfoModal
        partnerInfo={{
          trainerCode: '123456789012',
          pokemonGoName: 'TrainerOne',
          location: 'Seattle, WA',
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/trainer code/i)).toBeInTheDocument();
    expect(screen.getByText('1234 5678 9012')).toBeInTheDocument();
    expect(screen.getByText('Pokemon GO Name:')).toBeInTheDocument();
    expect(screen.getByText('Location: Seattle, WA')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(mocks.writeTextMock).toHaveBeenCalledWith('1234 5678 9012');
      expect(window.alert).toHaveBeenCalledWith('Trainer code copied!');
    });
  });

  it('shows fallback text when no location data exists', () => {
    render(
      <PartnerInfoModal
        partnerInfo={{
          trainerCode: null,
          pokemonGoName: null,
        }}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText('We have no location data for this trainer.'),
    ).toBeInTheDocument();
    expect(screen.getByText("We hope they'll add you!")).toBeInTheDocument();
  });
});
