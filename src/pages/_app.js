import Head from 'next/head';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link 
          rel="icon" 
          type="image/svg+xml" 
          href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyMCIgZmlsbD0iI0U1MzIyRCIvPjxwYXRoIGQ9Ik0xMjAgMzgwIFYxNjAgTDI1NiAyODAgTDM5MiAxNjAgVjM4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjUwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48dGV4dCB4PSIyNTYiIHk9IjQ1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjY1IiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iNCI+UERGPC90ZXh0Pjwvc3ZnPg==" 
        />
        <meta name="theme-color" content="#E5322D" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
