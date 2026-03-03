// AppBootstrap.tsx

import { useLocation } from 'react-router-dom';

import { useBootstrapInstances } from '@/features/instances/hooks/useBootstrapInstances';
import { useBootstrapVariants } from '@/features/variants/hooks/useBootstrapVariants';
import { useBootstrapTags } from '@/features/tags/hooks/useBootstrapTags';
import { useBootstrapTrades } from '@/features/trades/hooks/useBootstrapTrades';
import { useInitLocation } from '@/features/location/hooks/useInitLocation';
import { isAuthRoute } from '@/utils/routes/isAuthRoute';

/** Runs one-off bootstrapping side-effects. Mount once at app start. */
const AppBootstrap = () => {
  const location = useLocation();
  const enabled = !isAuthRoute(location.pathname);

  useBootstrapVariants(enabled);
  useBootstrapInstances(enabled);
  useBootstrapTags(enabled);
  useBootstrapTrades(enabled);
  useInitLocation(enabled);

  return null;
};

export default AppBootstrap;
