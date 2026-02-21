import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
