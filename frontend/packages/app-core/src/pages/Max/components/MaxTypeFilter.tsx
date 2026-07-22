import { getTypeIconPath } from '@/utils/imageHelpers';

import { MAX_BATTLE_TYPES, type MaxRole } from '../utils/maxBattleModel';

type MaxTypeFilterProps = {
  role: MaxRole;
  selectedType: string;
  onChange: (type: string) => void;
};

const titleForRole = (role: MaxRole): string =>
  role === 'damage' ? 'Max Move type' : 'Incoming attack type';

const capitalize = (value: string): string =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const MaxTypeFilter = ({ role, selectedType, onChange }: MaxTypeFilterProps) => (
  <section className="max-type-filter" aria-label={titleForRole(role)}>
    <div className="max-type-filter-heading">
      <span>{titleForRole(role)}</span>
    </div>
    <div className="max-type-grid">
      <button
        aria-pressed={selectedType === ''}
        className={`max-all-types ${selectedType === '' ? 'active' : ''}`}
        onClick={() => onChange('')}
        type="button"
      >
        All types
      </button>
      {MAX_BATTLE_TYPES.map((type) => (
        <button
          aria-label={capitalize(type)}
          aria-pressed={selectedType === type}
          className={`max-type-button max-type-button--${type} ${
            selectedType === type ? 'active' : ''
          }`}
          key={type}
          onClick={() => onChange(type)}
          title={capitalize(type)}
          type="button"
        >
          <img src={getTypeIconPath(type)} alt="" draggable={false} />
          <span>{capitalize(type)}</span>
        </button>
      ))}
    </div>
  </section>
);

export default MaxTypeFilter;
