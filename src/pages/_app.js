import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        {/* 1. Standard ICO (Google Search Bot isko sabse pehle uthayega) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* 2. Modern Browsers ke liye SVG */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        
        {/* 3. Apple/Mobile devices ke liye (Hamesha PNG chahiye hota hai) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <meta name="theme-color" content="#E5322D" />
      </Head>
      
      {/* Tumhari saari website yahan load hoti hai */}
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
