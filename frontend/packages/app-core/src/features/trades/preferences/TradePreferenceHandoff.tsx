import { Link } from 'react-router';

import './TradePreferenceHandoff.css';

interface TradePreferenceHandoffProps {
  instanceId: string;
  mode: 'trade' | 'wanted';
}

const TradePreferenceHandoff = ({
  instanceId,
  mode,
}: TradePreferenceHandoffProps) => {
  const isTrade = mode === 'trade';
  const destination = `/trades?section=preferences&mode=${mode}&instance=${encodeURIComponent(
    instanceId,
  )}`;

  return (
    <aside
      className={`trade-preference-handoff trade-preference-handoff--${mode}`}
      aria-label={`${isTrade ? 'For Trade' : 'Wanted'} matching preferences`}
    >
      <div>
        <strong>{isTrade ? 'Trade preferences' : 'Wanted preferences'}</strong>
        <span>
          {isTrade
            ? 'Choose which Pokémon you would accept for this trade.'
            : 'Choose which of your For Trade Pokémon are acceptable offers.'}
        </span>
      </div>
      <Link to={destination}>Manage preferences</Link>
    </aside>
  );
};

export default TradePreferenceHandoff;
