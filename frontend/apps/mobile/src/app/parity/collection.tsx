import { Redirect } from 'expo-router';
import { useColorScheme } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeCollectionParityFixture } from '../../features/collection/parity/NativeCollectionParityFixture';

export default function CollectionParityRoute() {
  const colorScheme = useColorScheme();
  if (runtimeConfig.mobile.experienceMode !== 'native-preview') {
    return <Redirect href="/" />;
  }

  return (
    <NativeCollectionParityFixture
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      theme={colorScheme === 'light' ? 'light' : 'dark'}
    />
  );
}
