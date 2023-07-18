import '@fontsource/roboto-mono/300.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/500.css';
import '@fontsource/roboto-mono/700.css';
import '../../styles/global.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { SnackbarProvider } from 'notistack';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { Session } from 'next-auth';
import CssBaseline from '@mui/material/CssBaseline';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Script from 'next/script';
import Layout from '@components/Layout';
import theme from '@lib/theme';
import client from '@lib/api';

type PageProps = {
  session: Session | null;
};

const App = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<PageProps>) => (
  <>
    <Head>
      <title>Finlight</title>
      <meta name="description" content="Personal finance app" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SnackbarProvider
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        preventDuplicate
        dense
        autoHideDuration={1500}
      />
      <SessionProvider session={session}>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </SessionProvider>
    </LocalizationProvider>
    <Script
      id="cookie-banner"
      src="https://cdn.websitepolicies.io/lib/cookieconsent/cookieconsent.min.js"
      defer
    />
    <Script
      id="cookie-banner-init"
      dangerouslySetInnerHTML={{
        __html: `window.addEventListener("load",function(){window.wpcb.init({"border":"thin","corners":"small","colors":{"popup":{"background":"#FFFFFF","text":"#000000","border":"#808080"},"button":{"background":"#1976D2","text":"#ffffff"}},"position":"bottom","content":{"href":"https://finlight.saltares.com/cookie_policy.pdf","message":"We use cookies to ensure you get the best experience."}})});`,
      }}
    />
  </>
);

export default client.withTRPC(App);
