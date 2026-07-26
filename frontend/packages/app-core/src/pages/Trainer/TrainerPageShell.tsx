import { useCallback, type ReactNode } from 'react';
import { FaArrowLeft, FaCog, FaUser, FaUserFriends } from 'react-icons/fa';
import { NavLink, useLocation, useNavigate } from 'react-router';

import { useContextBackHandler } from '@/contexts/ContextBackContext';
import './Trainer.css';

type TrainerPageShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

const TrainerPageShell = ({
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
    navigate(returnTo, { replace: true });
    return true;
  }, [navigate, returnTo]);

  useContextBackHandler(true, goBack, 'trainer-page');

  const navigationState = { contextBackTo: currentPath };

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
          <span>{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <div className="trainer-page-actions">{actions}</div>
      </header>

      <nav className="trainer-section-nav" aria-label="Trainer pages">
        <NavLink to="/profile" state={navigationState}>
          <FaUser />
          <span>Profile</span>
        </NavLink>
        <NavLink to="/friends" state={navigationState}>
          <FaUserFriends />
          <span>Friends</span>
        </NavLink>
        <NavLink to="/settings" state={navigationState}>
          <FaCog />
          <span>Settings</span>
        </NavLink>
      </nav>

      <main className="trainer-page-content">{children}</main>
    </div>
  );
};

export default TrainerPageShell;
