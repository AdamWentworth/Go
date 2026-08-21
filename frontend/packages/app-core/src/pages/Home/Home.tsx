import { useAuth } from '@/contexts/AuthContext';
import HomeDashboard from './HomeDashboard';
import HomeHeader from './HomeHeader';
import HowItWorks from './HowItWorks';
import './Home.css';

const Home = () => {
  const { isLoggedIn, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="home-page home-auth-loading" role="status">
        <img src="/images/logo/logo.png" alt="" />
        <strong>Opening PokeGo Nexus…</strong>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="home-page home-page--dashboard">
        <HomeDashboard user={user} />
      </div>
    );
  }

  return (
    <div className="home-page home-page--guest">
      <HomeHeader logoUrl="/images/logo/logo.png" isLoggedIn={false} />
      <HowItWorks />
    </div>
  );
};

export default Home;
