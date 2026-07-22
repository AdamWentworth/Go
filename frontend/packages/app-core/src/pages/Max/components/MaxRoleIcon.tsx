import { FaBolt, FaHeart, FaShieldAlt } from 'react-icons/fa';

import type { MaxRole } from '../utils/maxBattleModel';

type MaxRoleIconProps = {
  role: MaxRole;
};

const MaxRoleIcon = ({ role }: MaxRoleIconProps) => {
  if (role === 'tank') return <FaShieldAlt aria-hidden="true" />;
  if (role === 'healing') return <FaHeart aria-hidden="true" />;
  return <FaBolt aria-hidden="true" />;
};

export default MaxRoleIcon;

