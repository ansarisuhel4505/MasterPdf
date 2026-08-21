import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      {/* 🌙 ThemeProvider site ko Light/Dark switch karne ki taqat deta hai */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="shortcut icon" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <meta name="theme-color" content="#E5322D" />
        </Head>
        
        <Component {...pageProps} />
      </ThemeProvider>
    </ClerkProvider>
  );
}
