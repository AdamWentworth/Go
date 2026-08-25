import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { NativeActionMenu } from '../../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../../config/runtimeConfig';
import {
  isNativeInformationSlug,
  NATIVE_INFORMATION_PAGES,
} from '../../../features/information/nativeInformationContent';
import { resolveNativeActionMenuDestination } from '../../../navigation/nativeActionMenuNavigation';
import { NativeInformationScreen } from '../../../screens/NativeInformationScreen';

export default function NativeInformationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  if (!slug || !isNativeInformationSlug(slug)) return <Redirect href="/native" />;
  const page = NATIVE_INFORMATION_PAGES[slug];

  const navigate = (path: string) => {
    setActionMenuOpen(false);
    const [pathname = '/'] = path.split('?');
    if (pathname === '/') {
      router.push('/native');
      return;
    }
    if (isNativeInformationSlug(pathname.slice(1))) {
      router.push({ pathname: '/native/info/[slug]', params: { slug: pathname.slice(1) } });
      return;
    }
    if (pathname === '/login') {
      router.push('/native/login');
      return;
    }
    if (pathname === '/register') {
      router.push('/native/register');
      return;
    }
    if (pathname === '/settings/account') {
      router.push('/native/account');
      return;
    }
    const destination = resolveNativeActionMenuDestination(pathname);
    if (destination.kind === 'native') {
      router.push(destination.pathname);
      return;
    }
    if (destination.kind === 'current') return;
    router.push({ pathname: '/web', params: { path } });
  };

  return (
    <>
      <NativeInformationScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/native')}
        onNavigate={navigate}
        page={page}
      />
      <NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setActionMenuOpen(true)} />
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={navigate}
          visible
        />
      ) : null}
    </>
  );
}
