import { Redirect } from 'expo-router';
import { MobileAppRoot } from '../MobileAppRoot';
import { runtimeConfig } from '../config/runtimeConfig';

export default function IndexRoute() {
  if (runtimeConfig.mobile.experienceMode === 'native-preview') {
    return <Redirect href="/native/collection" />;
  }
  return <MobileAppRoot />;
}
