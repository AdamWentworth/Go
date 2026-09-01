import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeLoadingSpinner } from '../../components/NativeLoadingSpinner';

export default function DeviceSmokeLoadingSpinnerRoute() {
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <View style={styles.screen} testID="device-smoke-loading-spinner">
      <NativeLoadingSpinner light={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
  },
});
