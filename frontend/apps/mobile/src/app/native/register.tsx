import { Redirect, useRouter } from 'expo-router';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeRegisterScreen } from '../../screens/NativeRegisterScreen';

export default function NativeRegisterRoute() {
  const router = useRouter();
  const session = useNativeSession();
  if (session.status === 'signed-in' && session.user) return <Redirect href="/native" />;
  return (
    <NativeRegisterScreen
      onBackToLogin={() => router.replace('/native/login')}
      onOpenPrivacy={() => router.push({ pathname: '/web', params: { path: '/privacy' } })}
      onOpenTerms={() => router.push({ pathname: '/web', params: { path: '/terms' } })}
      onRegister={session.register}
      onRegistered={() => router.replace('/native')}
    />
  );
}
