/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,

  // 🔥 1. YEH RAHA TUMHARA NAYA 301 REDIRECT 🔥
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'master-pdf-gray.vercel.app',
          },
        ],
        destination: 'https://pdftools.suhelansari.tech/:path*',
        permanent: true, // 301 Moved Permanently
      },
    ];
  },

  // 🔥 2. YEH TUMHARA PURANA SEO HEADERS WALA CODE (SAFE HAI) 🔥
  async headers() {
    return [
      {
        // Yeh poori website ke har page par apply hoga
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow' 
          }
        ],
      },
    ];
  },
};

export default nextConfig;
