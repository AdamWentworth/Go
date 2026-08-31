import { Redirect, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeSessionProvider } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeQueryProvider } from '../../query/NativeQueryProvider';
import { NativeCollectionSyncProvider } from '../../features/collection/NativeCollectionSyncProvider';
import { NativeRealtimeProvider } from '../../features/realtime/NativeRealtimeProvider';
import { useNativeDevicePreferences } from '../../features/settings/NativeDevicePreferencesProvider';
import { nativeRouteAnimation } from '../../navigation/nativeRouteMotion';

export default function NativeLayout() {
  const { colorTheme, shouldReduceMotion } = useNativeDevicePreferences();
  const light = colorTheme === 'light';
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  return (
    <NativeSessionProvider>
      <NativeQueryProvider>
        <NativeCollectionSyncProvider>
          <NativeRealtimeProvider>
            <Stack
              screenLayout={({ children }) => (
                <SafeAreaView
                  edges={['top', 'bottom']}
                  style={[styles.screenSurface, light && styles.screenSurfaceLight]}
                >
                  {children}
                </SafeAreaView>
              )}
              screenOptions={{
                contentStyle: light ? styles.screenSurfaceLight : styles.screenSurface,
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="login" options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion) }} />
              <Stack.Screen name="register" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="reset-password" options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion) }} />
              <Stack.Screen name="verify-email-change" options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion) }} />
              <Stack.Screen name="not-found" options={{ animation: nativeRouteAnimation('fade', shouldReduceMotion) }} />
              <Stack.Screen name="info/[slug]" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="pokedex/index" options={{ animation: 'none' }} />
              <Stack.Screen name="pokedex/[variantId]" options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion), gestureDirection: 'vertical' }} />
              <Stack.Screen name="rankings" options={{ animation: 'none' }} />
              <Stack.Screen name="raid" options={{ animation: 'none' }} />
              <Stack.Screen name="raid-methodology" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="max" options={{ animation: 'none' }} />
              <Stack.Screen name="pvp" options={{ animation: 'none' }} />
              <Stack.Screen name="pvp-methodology" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="collection" options={{ animation: 'none' }} />
              <Stack.Screen name="search" options={{ animation: 'none' }} />
              <Stack.Screen name="trades" options={{ animation: 'none' }} />
              <Stack.Screen name="trade-board" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="trade-board/[username]" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="settings" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="account" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="friends" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="profile/index" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen name="profile/[username]" options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion) }} />
              <Stack.Screen
                name="collection/[instanceId]"
                options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion), gestureDirection: 'vertical' }}
              />
              <Stack.Screen
                name="collection/catalog/[variantId]"
                options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion), gestureDirection: 'vertical' }}
              />
              <Stack.Screen
                name="collection/trainer/[username]/index"
                options={{ animation: nativeRouteAnimation('slide_from_right', shouldReduceMotion), gestureDirection: 'horizontal' }}
              />
              <Stack.Screen
                name="collection/trainer/[username]/[instanceId]"
                options={{ animation: nativeRouteAnimation('slide_from_bottom', shouldReduceMotion), gestureDirection: 'vertical' }}
              />
            </Stack>
          </NativeRealtimeProvider>
        </NativeCollectionSyncProvider>
      </NativeQueryProvider>
    </NativeSessionProvider>
  );
}

const styles = StyleSheet.create({
  // These surfaces fill the Android window. SafeAreaView applies its insets as
  // internal padding, so the page background continues behind the camera and
  // gesture navigation while page controls remain usable.
  screenSurface: { flex: 1, backgroundColor: '#101a19' },
  screenSurfaceLight: { backgroundColor: '#f8fff9' },
});
