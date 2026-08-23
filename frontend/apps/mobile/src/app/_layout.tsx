import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { initializeObservability } from '../observability/bootstrap';

initializeObservability();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent={false} backgroundColor="#000" />
      <SafeAreaView style={styles.appShell} edges={['top', 'bottom']}>
        <View style={styles.appShell}>
          <MobileErrorBoundary>
            <Stack screenOptions={{ headerShown: false }} />
          </MobileErrorBoundary>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#000',
  },
});
