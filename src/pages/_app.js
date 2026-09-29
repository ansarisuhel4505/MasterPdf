import '@/styles/globals.css';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from 'next-themes'; 
import { useRouter } from 'next/router'; // 🔥 1. ROUTER IMPORT KIYA

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  
  // 🔥 2. DYNAMIC CANONICAL URL LOGIC
  // Yeh current page ka path lega aur base URL ke aage jod dega (query params ignore karke)
  const currentPath = router.asPath.split('?')[0];
  const canonicalUrl = `https://pdftools.suhelansari.tech${currentPath === '/' ? '' : currentPath}`;

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#E5322D" />
          {/* 🔥 3. YAHAN DYNAMIC CANONICAL TAG LAGAYA */}
          <link rel="canonical" href={canonicalUrl} />
        </Head>
        
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
