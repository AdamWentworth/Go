import { useLocalSearchParams } from 'expo-router';
import { WebReplicaApp } from '../screens/WebReplicaApp';

export default function WebExperienceRoute() {
  const params = useLocalSearchParams<{ path?: string | string[] }>();
  const path = Array.isArray(params.path) ? params.path[0] : params.path;
  return <WebReplicaApp initialPath={path} />;
}
