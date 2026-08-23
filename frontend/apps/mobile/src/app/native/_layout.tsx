import { Redirect, Stack } from 'expo-router';
import { NativeSessionProvider } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeQueryProvider } from '../../query/NativeQueryProvider';
import { NativeCollectionSyncProvider } from '../../features/collection/NativeCollectionSyncProvider';

export default function NativeLayout() {
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  return (
    <NativeSessionProvider>
      <NativeQueryProvider>
        <NativeCollectionSyncProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NativeCollectionSyncProvider>
      </NativeQueryProvider>
    </NativeSessionProvider>
  );
}
