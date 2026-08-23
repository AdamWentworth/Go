import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileErrorBoundary } from './src/components/MobileErrorBoundary';
import { MobileAppRoot } from './src/MobileAppRoot';
import { initializeObservability } from './src/observability/bootstrap';

initializeObservability();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent={false} backgroundColor="#000" />
      <SafeAreaView style={styles.appShell} edges={['top', 'bottom']}>
        <View style={styles.appShell}>
          <MobileErrorBoundary>
            <MobileAppRoot />
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
