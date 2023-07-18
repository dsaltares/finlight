import { Html, Head, Main, NextScript } from "next/document";

const Document = () => (
  <Html>
    <Head>
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icons/icon.png"></link>
      <meta name="theme-color" content="#fff" />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
