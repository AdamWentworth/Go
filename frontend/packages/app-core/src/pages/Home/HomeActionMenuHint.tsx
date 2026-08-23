import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

import { requestActionMenuOpen } from '@/components/actionMenuEvents';

import './HomeActionMenuHint.css';

interface HomeActionMenuHintProps {
  trainerKey: string;
  audience?: 'guest' | 'trainer';
}

const storageKeyFor = (trainerKey: string, audience: 'guest' | 'trainer') =>
  audience === 'guest'
    ? 'pokegonexus-action-menu-hint:guest'
    : `pokegonexus-action-menu-hint:${trainerKey}`;

const hasSeenHint = (storageKey: string) => {
  try {
    return window.localStorage.getItem(storageKey) === 'seen';
  } catch {
    return false;
  }
};

const rememberHint = (storageKey: string) => {
  try {
    window.localStorage.setItem(storageKey, 'seen');
  } catch {
    // The hint can still be dismissed for this visit when storage is unavailable.
  }
};

const HomeActionMenuHint = ({
  trainerKey,
  audience = 'trainer',
}: HomeActionMenuHintProps) => {
  const storageKey = storageKeyFor(trainerKey, audience);
  const [isVisible, setIsVisible] = useState(() => !hasSeenHint(storageKey));

  if (!isVisible) return null;

  const dismiss = () => {
    rememberHint(storageKey);
    setIsVisible(false);
  };

  const openMenu = () => {
    dismiss();
    requestActionMenuOpen();
  };

  return (
    <div className="home-action-menu-hint" role="note" aria-label="Action menu tip">
      <img src="/images/btn_action_menu.png" alt="" />
      <div>
        <span className="home-eyebrow">Quick navigation</span>
        <p>
          {audience === 'guest' ? (
            <>
              Tap the <strong>Poké Ball</strong> at the bottom of any page to explore tools,
              switch themes, and find account options.
            </>
          ) : (
            <>
              Tap the <strong>Poké Ball</strong> at the bottom of any page to open the action menu.
            </>
          )}
        </p>
      </div>
      <button className="home-action-menu-hint__open" type="button" onClick={openMenu}>
        Open action menu
      </button>
      <button
        className="home-action-menu-hint__dismiss"
        type="button"
        aria-label="Dismiss action menu tip"
        onClick={dismiss}
      >
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
};

export default HomeActionMenuHint;
