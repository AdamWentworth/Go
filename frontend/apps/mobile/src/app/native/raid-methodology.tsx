import { useRouter } from 'expo-router';
import { raidMethodologyContent } from '../../features/tools/nativeMethodologyContent';
import { NativeMethodologyScreen } from '../../screens/NativeMethodologyScreen';
export default function NativeRaidMethodologyRoute() { const router = useRouter(); return <NativeMethodologyScreen content={raidMethodologyContent} onBack={() => router.canGoBack() ? router.back() : router.replace('/native/raid')} />; }

