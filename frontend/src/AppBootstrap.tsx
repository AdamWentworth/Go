// AppBootstrap.tsx

import { useBootstrapInstances } from '@/features/instances/hooks/useBootstrapInstances';
import { useBootstrapVariants }  from '@/features/variants/hooks/useBootstrapVariants';
import { useBootstrapTags }      from '@/features/tags/hooks/useBootstrapTags';
import { useBootstrapTrades }    from '@/features/trades/hooks/useBootstrapTrades';
import { useInitLocation }       from '@/features/location/hooks/useInitLocation';

/** Runs one‑off bootstrapping side‑effects. Mount once at app start. */
const AppBootstrap = () => {
  useBootstrapVariants();
  useBootstrapInstances();
  useBootstrapTags();
  useBootstrapTrades();
  useInitLocation();
  return null;
};

export default AppBootstrap;