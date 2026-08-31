import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { initializeObservability } from '../observability/bootstrap';
import {
  NativeDevicePreferencesProvider,
  useNativeDevicePreferences,
} from '../features/settings/NativeDevicePreferencesProvider';
import { NativeAppLoadingProvider } from '../components/NativeAppLoadingProvider';

initializeObservability();

const RootContent = () => {
  const devicePreferences = useNativeDevicePreferences();
  const light = devicePreferences.colorTheme === 'light';

  return (
    <>
      <StatusBar style={light ? 'dark' : 'light'} />
      <MobileErrorBoundary>
        <Stack
          screenLayout={({ children, route }) => (
            route.name === 'native'
              ? children
              : (
                <SafeAreaView
                  edges={['top', 'bottom']}
                  style={[styles.appShell, light && styles.appShellLight]}
                >
                  {children}
                </SafeAreaView>
              )
          )}
          screenOptions={{
            contentStyle: light ? styles.appShellLight : styles.appShell,
            headerShown: false,
          }}
        />
      </MobileErrorBoundary>
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.appShell}>
      <SafeAreaProvider>
        <NativeDevicePreferencesProvider>
          <NativeAppLoadingProvider>
            <RootContent />
          </NativeAppLoadingProvider>
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
});
