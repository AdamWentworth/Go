import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { EventsProvider } from './src/features/events/EventsProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeObservability } from './src/observability/bootstrap';

initializeObservability();

export default function App() {
  return (
    <AuthProvider>
      <EventsProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </EventsProvider>
    </AuthProvider>
  );
}
