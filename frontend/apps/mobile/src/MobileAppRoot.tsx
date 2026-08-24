import { useState } from 'react';
import { runtimeConfig } from './config/runtimeConfig';
import type { MobileExperienceMode } from './config/mobileExperience';
import { NativeMigrationPreview } from './screens/NativeMigrationPreview';
import { WebReplicaApp } from './screens/WebReplicaApp';

type MobileAppRootProps = {
  experienceMode?: MobileExperienceMode;
  onOpenCollectionParityCandidate?: () => void;
};

export const MobileAppRoot = ({
  experienceMode = runtimeConfig.mobile.experienceMode,
  onOpenCollectionParityCandidate,
}: MobileAppRootProps) => {
  const [useWebExperience, setUseWebExperience] = useState(
    experienceMode === 'webview',
  );

  if (useWebExperience) {
    return <WebReplicaApp />;
  }

  return (
    <NativeMigrationPreview
      onOpenCollectionParityCandidate={onOpenCollectionParityCandidate}
      onOpenWebExperience={() => setUseWebExperience(true)}
    />
  );
};
