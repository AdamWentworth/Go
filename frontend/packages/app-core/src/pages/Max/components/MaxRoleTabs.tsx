import MaxRoleIcon from './MaxRoleIcon';
import {
  MAX_ROLE_COPY,
  type MaxRole,
} from '../utils/maxBattleModel';

const MAX_ROLES: MaxRole[] = ['damage', 'tank', 'healing'];

type MaxRoleTabsProps = {
  label: string;
  role: MaxRole;
  onChange: (role: MaxRole) => void;
};

const MaxRoleTabs = ({ label, role, onChange }: MaxRoleTabsProps) => (
  <section className="max-ranking-controls" aria-label={label}>
    <div className="max-role-tabs" role="group" aria-label={`${label} options`}>
      {MAX_ROLES.map((option) => (
        <button
          aria-pressed={role === option}
          className={`${role === option ? 'active' : ''} max-role-tab--${option}`}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          <MaxRoleIcon role={option} />
          <span>{MAX_ROLE_COPY[option].shortLabel}</span>
        </button>
      ))}
    </div>
  </section>
);

export default MaxRoleTabs;
