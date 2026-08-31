import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { initializeObservability } from '../observability/bootstrap';
import {
  NativeDevicePreferencesProvider,
  useNativeDevicePreferences,
} from '../features/settings/NativeDevicePreferencesProvider';
import {
  NativeAppLoadingOverlay,
  NativeAppLoadingProvider,
} from '../components/NativeAppLoadingProvider';
import { nativePathSurface } from '../navigation/nativeRouteSurface';

initializeObservability();

const RootContent = () => {
  const devicePreferences = useNativeDevicePreferences();
  const light = devicePreferences.colorTheme === 'light';
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const windowSurface = nativePathSurface(pathname, light, width < 600);

  return (
    <View style={[styles.windowSurface, { backgroundColor: windowSurface }]}>
      <NativeAppLoadingProvider navigationPath={pathname}>
        <StatusBar style={light ? 'dark' : 'light'} />
        <MobileErrorBoundary>
          <Stack
            screenLayout={({ children, route }) => (
              route.name === 'native'
                ? children
                : (
                  <View style={[styles.windowSurface, { backgroundColor: windowSurface }]}>
                    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContent}>
                      {children}
                    </SafeAreaView>
                  </View>
                )
            )}
            screenOptions={{
              contentStyle: { backgroundColor: windowSurface },
              headerShown: false,
              navigationBarTranslucent: true,
              statusBarTranslucent: true,
            }}
          />
        </MobileErrorBoundary>
        <NativeAppLoadingOverlay />
      </NativeAppLoadingProvider>
    </View>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.appShell}>
      <SafeAreaProvider>
        <NativeDevicePreferencesProvider>
          <RootContent />
        </NativeDevicePreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#000',
  },
  appShellLight: { backgroundColor: '#f8fff9' },
  safeContent: { flex: 1, minHeight: 0 },
  windowSurface: { flex: 1, minHeight: 0 },
});
