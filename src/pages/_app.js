import '@/styles/globals.css';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react"; // 🔥 YEH NAYA IMPORT HAI

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    // 🔥 PURI APP KO SESSION PROVIDER KE ANDAR RAKH DIYA
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#E5322D" />
      </Head>
      
      <Component {...pageProps} />
    </SessionProvider>
  );
}
