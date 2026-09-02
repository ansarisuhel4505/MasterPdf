/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
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
