import { useCallback, type ReactNode } from 'react';
import { FaArrowLeft, FaCog, FaUser, FaUserFriends } from 'react-icons/fa';
import { NavLink, useLocation, useNavigate } from 'react-router';

import './Trainer.css';

type TrainerPageShellProps = {
  workspace: 'profile' | 'settings';
  eyebrow?: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

const TrainerPageShell = ({
  workspace,
  eyebrow,
  title,
  children,
  actions,
}: TrainerPageShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const origin = (
    location.state as { contextBackTo?: string } | null
  )?.contextBackTo;
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const returnTo = origin && origin !== currentPath ? origin : '/';

  const goBack = useCallback(() => {
    if (origin && origin !== currentPath) {
      navigate(-1);
      return;
    }
    navigate(returnTo);
  }, [currentPath, navigate, origin, returnTo]);

  const navigationState = { contextBackTo: currentPath };
  const navigation =
    workspace === 'profile'
      ? [
          { to: '/profile', label: 'Profile', icon: <FaUser /> },
          {
            to: '/profile/friends',
            label: 'Friends',
            icon: <FaUserFriends />,
          },
        ]
      : [
          { to: '/settings', label: 'Settings', icon: <FaCog /> },
          { to: '/settings/account', label: 'Account', icon: <FaUser /> },
        ];
  const activePath =
    workspace === 'profile'
      ? location.pathname === '/profile/friends'
        ? '/profile/friends'
        : '/profile'
      : location.pathname === '/settings/account'
        ? '/settings/account'
        : '/settings';

  return (
    <div className="trainer-page">
      <header className="trainer-page-header">
        <button
          type="button"
          className="trainer-icon-button"
          aria-label="Go back"
          title="Go back"
          onClick={goBack}
        >
          <FaArrowLeft />
        </button>
        <div className="trainer-page-heading">
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h1>{title}</h1>
        </div>
        <div className="trainer-page-actions">{actions}</div>
      </header>

      <nav
        className="trainer-section-nav"
        aria-label={workspace === 'profile' ? 'Profile pages' : 'Settings pages'}
      >
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            state={navigationState}
            className={item.to === activePath ? 'active' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="trainer-page-content">{children}</main>
    </div>
  );
};

export default TrainerPageShell;
