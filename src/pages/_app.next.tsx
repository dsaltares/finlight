import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { Session } from 'next-auth';
import CssBaseline from '@mui/material/CssBaseline';

type PageProps = {
  session: Session | null;
};

const App = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<PageProps>) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      })
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <CssBaseline />
        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default App;
