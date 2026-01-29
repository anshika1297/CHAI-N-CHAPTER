/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy image requests to API (same origin, no folder structure exposed for /api/img)
    return [
      { source: '/api/img/:token', destination: `${apiUrl}/api/img/:token` },
      { source: '/api/uploads/:path*', destination: `${apiUrl}/api/uploads/:path*` },
    ];
  },
}

module.exports = nextConfig
