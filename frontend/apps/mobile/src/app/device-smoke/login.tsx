import { Redirect } from 'expo-router';
import { useState } from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeLoginScreen } from '../../screens/NativeLoginScreen';

export default function DeviceSmokeLoginRoute() {
  const [notice, setNotice] = useState<string | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <NativeLoginScreen
      notice={notice}
      onOpenPasswordReset={() => setNotice('Password reset opens the secure account recovery flow.')}
      onOpenRegister={() => setNotice('Registration opened.')}
      onSignIn={async () => undefined}
      onSignedIn={() => setNotice('Signed in.')}
      onSocialSignIn={(provider) => setNotice(`${provider} sign-in opened.`)}
    />
  );
}
