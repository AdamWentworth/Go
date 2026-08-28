import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { initializeObservability } from '../observability/bootstrap';
import {
  NativeDevicePreferencesProvider,
  useNativeDevicePreferences,
} from '../features/settings/NativeDevicePreferencesProvider';

initializeObservability();

const RootContent = () => {
  const devicePreferences = useNativeDevicePreferences();
  const light = devicePreferences.colorTheme === 'light';

  return (
    <GestureHandlerRootView style={styles.appShell}>
      <SafeAreaProvider>
        <StatusBar style={light ? 'dark' : 'light'} />
        {/* The application shell owns top and bottom safe-area spacing. Screens
            must not apply the same window insets a second time. */}
        <SafeAreaView style={[styles.appShell, light && styles.appShellLight]} edges={['top', 'bottom']}>
          <View style={[styles.appShell, light && styles.appShellLight]}>
            <MobileErrorBoundary>
              <Stack screenOptions={{ headerShown: false }} />
            </MobileErrorBoundary>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default function RootLayout() {
  return (
    <NativeDevicePreferencesProvider>
      <RootContent />
    </NativeDevicePreferencesProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#000',
  },
  appShellLight: { backgroundColor: '#f8fff9' },
});
