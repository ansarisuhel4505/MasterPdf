import '@/styles/globals.css'; // Make sure path is correct based on your setup
import Head from 'next/head';
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* 🔥 DIRECT INLINE SVG CODE FOR FAVICON (No external image file needed) 🔥 */}
        <link 
          rel="icon" 
          type="image/svg+xml" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='120' fill='%23E5322D'/><path d='M120 380 V160 L256 280 L392 160 V380' fill='none' stroke='%23FFFFFF' stroke-width='50' stroke-linecap='round' stroke-linejoin='round'/><text x='256' y='450' font-family='Arial, sans-serif' font-size='65' font-weight='900' fill='%23FFFFFF' text-anchor='middle' letter-spacing='4'>PDF</text></svg>" 
        />
        <meta name="theme-color" content="#E5322D" />
      </Head>
      
      {/* Tumhari poori website yahan load hoti hai */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
