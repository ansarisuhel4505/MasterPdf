import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Google aur Browser ko Logo batane ka code */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#E5322D" />
      </Head>
      
      {/* Tumhari saari website yahan load hoti hai */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
