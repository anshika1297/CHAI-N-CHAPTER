/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'chaptersaurchai.com' },
      { protocol: 'https', hostname: 'www.chaptersaurchai.com' },
    ],
  },

  // Proxy /api and /health to the Express backend so the frontend can use
  // relative URLs (/api/...) regardless of how the reverse-proxy is set up.
  async rewrites() {
    const apiTarget = process.env.API_INTERNAL_URL || 'http://127.0.0.1:5001';
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
      { source: '/health', destination: `${apiTarget}/health` },
    ];
  },
}

module.exports = nextConfig