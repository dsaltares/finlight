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
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import Layout from '@components/Layout';
import theme from '@lib/theme';

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
    <>
      <Head>
        <title>Budget</title>
        <meta name="description" content="Budgetting app" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <CssBaseline />
          <ThemeProvider theme={theme}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </>
  );
};

export default App;
