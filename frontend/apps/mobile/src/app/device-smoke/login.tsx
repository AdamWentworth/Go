import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { NativeRouteActionMenu } from '../../components/NativeRouteActionMenu';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeLoginScreen } from '../../screens/NativeLoginScreen';

export default function DeviceSmokeLoginRoute() {
  const [notice, setNotice] = useState<string | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <NativeLoginScreen
        notice={notice}
        onOpenPasswordReset={() => setNotice('Password reset opens the secure account recovery flow.')}
        onSignIn={async () => undefined}
        onSignedIn={() => setNotice('Signed in.')}
        onSocialSignIn={async (provider) => setNotice(`${provider} sign-in opened.`)}
      />
      <NativeRouteActionMenu />
    </View>
  );
}
