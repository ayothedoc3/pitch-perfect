'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  // Only initialize PostHog in production or when explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Only track in production or if you explicitly want to track development
  const shouldTrack = isProduction || (isDevelopment && !isLocalhost);

  if (shouldTrack && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: (posthog) => {
        if (!isProduction) {
          console.log('PostHog initialized in development mode');
        }
      },
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogPageView(): null {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview');
    }
  }, []);

  return null;
}
