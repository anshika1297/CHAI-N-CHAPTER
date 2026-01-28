/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy uploaded images so they load from same origin (avoids CORS / wrong base URL)
    return [
      { source: '/api/uploads/:path*', destination: `${apiUrl}/api/uploads/:path*` },
    ];
  },
}

module.exports = nextConfig
