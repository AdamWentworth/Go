import { useState } from 'react';
import { runtimeConfig } from './config/runtimeConfig';
import type { MobileExperienceMode } from './config/mobileExperience';
import { NativeMigrationPreview } from './screens/NativeMigrationPreview';
import { WebReplicaApp } from './screens/WebReplicaApp';

type MobileAppRootProps = {
  experienceMode?: MobileExperienceMode;
  onOpenNativeExperience?: () => void;
};

export const MobileAppRoot = ({
  experienceMode = runtimeConfig.mobile.experienceMode,
  onOpenNativeExperience,
}: MobileAppRootProps) => {
  const [useWebExperience, setUseWebExperience] = useState(
    experienceMode === 'webview',
  );

  if (useWebExperience) {
    return <WebReplicaApp />;
  }

  return (
    <NativeMigrationPreview
      onOpenNativeExperience={onOpenNativeExperience}
      onOpenWebExperience={() => setUseWebExperience(true)}
    />
  );
};
