import '@/styles/globals.css';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from 'next-themes'; // 🔥 NAYA IMPORT

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      {/* 🔥 THEME PROVIDER ADD KIYA */}
      <ThemeProvider attribute="class" defaultTheme="light">
        <Head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#E5322D" />
          <link rel="canonical" href="https://pdftools.suhelansari.tech" />
        </Head>
        
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
