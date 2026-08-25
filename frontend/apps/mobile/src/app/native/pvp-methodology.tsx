import { useRouter } from 'expo-router';
import { NativeMethodologyScreen } from '../../screens/NativeMethodologyScreen';
import { pvpMethodologyContent } from '../../features/tools/nativeMethodologyContent';

export default function NativePvpMethodologyRoute() {
  const router = useRouter();
  return (
    <NativeMethodologyScreen content={pvpMethodologyContent} onBack={() => router.canGoBack() ? router.back() : router.replace('/native/pvp')} />
  );
}
