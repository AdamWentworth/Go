import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeCollectionParityFixture } from '../../features/collection/parity/NativeCollectionParityFixture';

export default function CollectionParityRoute() {
  const colorScheme = useColorScheme();
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  const theme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <NativeCollectionParityFixture
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        theme={theme}
      />
    </>
  );
}
