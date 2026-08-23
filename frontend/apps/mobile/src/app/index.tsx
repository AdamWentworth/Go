import { useRouter } from 'expo-router';
import { MobileAppRoot } from '../MobileAppRoot';

export default function IndexRoute() {
  const router = useRouter();
  return (
    <MobileAppRoot
      onOpenNativeExperience={() => router.push('/native/login')}
    />
  );
}
