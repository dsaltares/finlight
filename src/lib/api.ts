/* eslint-disable no-console */
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { QueryClientConfig } from '@tanstack/react-query';
import type { AppRouter } from '@server/router';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 12 * 60 * 60 * 1000, // 12 hours
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      keepPreviousData: true,
    },
  },
};

const testingQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
};

const client = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          maxURLLength: 2083,
        }),
      ],
      queryClientConfig:
        process.env.IS_TEST_ENV === 'true'
          ? testingQueryClientConfig
          : queryClientConfig,
    };
  },
});

export default client;
