import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { PostHogProvider, PostHogPageView } from '../providers/PostHogProvider';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import posthog from 'posthog-js';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => posthog.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <PostHogProvider>
      <AuthProvider>
        <PostHogPageView />
        <Component {...pageProps} />
      </AuthProvider>
    </PostHogProvider>
  );
}

export default MyApp; 