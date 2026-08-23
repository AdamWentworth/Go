import { Redirect, Stack } from 'expo-router';
import { NativeSessionProvider } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeQueryProvider } from '../../query/NativeQueryProvider';

export default function NativeLayout() {
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  return (
    <NativeSessionProvider>
      <NativeQueryProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NativeQueryProvider>
    </NativeSessionProvider>
  );
}
