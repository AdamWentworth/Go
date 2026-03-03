import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ModalProvider, useModal } from '@/contexts/ModalContext';

const ConfirmConsumer = () => {
  const { confirm } = useModal();
  const [result, setResult] = React.useState<string>('pending');

  return (
    <div>
      <button
        onClick={async () => {
          const accepted = await confirm('Confirm trade?');
          setResult(accepted ? 'accepted' : 'cancelled');
        }}
      >
        open-confirm
      </button>
      <span data-testid="confirm-result">{result}</span>
    </div>
  );
};

const AlertConsumer = () => {
  const { alert } = useModal();
  const [closed, setClosed] = React.useState(false);

  return (
    <div>
      <button
        onClick={async () => {
          await alert('Profile updated');
          setClosed(true);
        }}
      >
        open-alert
      </button>
      <span data-testid="alert-closed">{String(closed)}</span>
    </div>
  );
};

describe('ModalContext', () => {
  it('resolves confirm() true/false based on dialog actions', async () => {
    const view = render(
      <ModalProvider>
        <ConfirmConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByText('open-confirm'));
    expect(screen.getByText('Confirm trade?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('OK'));
    await waitFor(() =>
      expect(screen.getByTestId('confirm-result')).toHaveTextContent('accepted'),
    );

    fireEvent.click(screen.getByText('open-confirm'));
    expect(screen.getByText('Confirm trade?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() =>
      expect(screen.getByTestId('confirm-result')).toHaveTextContent('cancelled'),
    );

    expect(view.container.querySelector('.modal-overlay')).toBeNull();
  });

  it('resolves alert() after alert dialog closes', async () => {
    render(
      <ModalProvider>
        <AlertConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByText('open-alert'));
    expect(screen.getByText('Profile updated')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Profile updated'));

    await waitFor(
      () => expect(screen.getByTestId('alert-closed')).toHaveTextContent('true'),
      { timeout: 1200 },
    );
  });

  it('throws a helpful error when useModal is used outside provider', () => {
    const OutsideConsumer = () => {
      useModal();
      return null;
    };

    expect(() => render(<OutsideConsumer />)).toThrow(
      'useModal must be used within a ModalProvider',
    );
  });
});
