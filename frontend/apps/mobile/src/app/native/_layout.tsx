import { Redirect, Stack } from 'expo-router';
import { NativeSessionProvider } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeQueryProvider } from '../../query/NativeQueryProvider';
import { NativeCollectionSyncProvider } from '../../features/collection/NativeCollectionSyncProvider';
import { NativeRealtimeProvider } from '../../features/realtime/NativeRealtimeProvider';

export default function NativeLayout() {
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  return (
    <NativeSessionProvider>
      <NativeQueryProvider>
        <NativeCollectionSyncProvider>
          <NativeRealtimeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="reset-password" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="info/[slug]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="pokedex/index" options={{ animation: 'none' }} />
            <Stack.Screen name="pokedex/[variantId]" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
            <Stack.Screen name="rankings" options={{ animation: 'none' }} />
            <Stack.Screen name="raid" options={{ animation: 'none' }} />
            <Stack.Screen name="raid-methodology" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="max" options={{ animation: 'none' }} />
            <Stack.Screen name="collection" options={{ animation: 'none' }} />
            <Stack.Screen name="search" options={{ animation: 'none' }} />
            <Stack.Screen name="trades" options={{ animation: 'none' }} />
            <Stack.Screen name="trade-board" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile/index" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile/[username]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen
              name="collection/[instanceId]"
              options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
            />
            <Stack.Screen
              name="collection/catalog/[variantId]"
              options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
            />
            <Stack.Screen
              name="collection/trainer/[username]/index"
              options={{ animation: 'slide_from_right', gestureDirection: 'horizontal' }}
            />
            <Stack.Screen
              name="collection/trainer/[username]/[instanceId]"
              options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
            />
          </Stack>
          </NativeRealtimeProvider>
        </NativeCollectionSyncProvider>
      </NativeQueryProvider>
    </NativeSessionProvider>
  );
}
