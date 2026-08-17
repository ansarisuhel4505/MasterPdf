/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // यह लाइन react-pdf को Next.js के Server-Side Rendering से बाहर कर देगी
  serverComponentsExternalPackages: ['pdf-lib', 'react-pdf'],
}

module.exports = nextConfig
