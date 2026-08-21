import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/next5'; // Agar clerk package installed hai

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
