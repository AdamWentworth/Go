import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { MobileErrorBoundary } from './src/components/MobileErrorBoundary';
import { NetworkStatusBanner } from './src/components/NetworkStatusBanner';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { EventsProvider } from './src/features/events/EventsProvider';
import { NetworkProvider } from './src/features/network/NetworkProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeObservability } from './src/observability/bootstrap';

initializeObservability();

export default function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <EventsProvider>
          <StatusBar style="auto" />
          <View style={styles.appShell}>
            <MobileErrorBoundary>
              <AppNavigator />
            </MobileErrorBoundary>
            <NetworkStatusBanner />
          </View>
        </EventsProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
});
