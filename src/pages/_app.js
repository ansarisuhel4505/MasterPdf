import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
