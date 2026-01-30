/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy image requests and analytics to API (same origin)
    return [
      { source: '/api/img/:token', destination: `${apiUrl}/api/img/:token` },
      { source: '/api/uploads/:path*', destination: `${apiUrl}/api/uploads/:path*` },
      { source: '/api/analytics/:path*', destination: `${apiUrl}/api/analytics/:path*` },
    ];
  },
}

module.exports = nextConfig
