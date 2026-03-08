/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Production build optimizations
  ...(isProduction && {
    swcMinify: true, // Use SWC minifier (faster than Terser)
    output: 'standalone', // Optimize for production deployment
  }),

  // Headers (additional security headers)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxying
  async rewrites() {
    if (!apiUrl) return [];
    
    return [
      { source: '/api/img/:token', destination: `${apiUrl}/api/img/:token` },
      { source: '/api/uploads/:path*', destination: `${apiUrl}/api/uploads/:path*` },
      { source: '/api/analytics/:path*', destination: `${apiUrl}/api/analytics/:path*` },
      { source: '/api/settings/:path*', destination: `${apiUrl}/api/settings/:path*` },
      { source: '/api/blog/:path*', destination: `${apiUrl}/api/blog/:path*` },
      { source: '/api/recommendations/:path*', destination: `${apiUrl}/api/recommendations/:path*` },
      { source: '/api/musings/:path*', destination: `${apiUrl}/api/musings/:path*` },
      { source: '/api/book-clubs/:path*', destination: `${apiUrl}/api/book-clubs/:path*` },
      { source: '/api/categories/:path*', destination: `${apiUrl}/api/categories/:path*` },
      { source: '/api/subscribe/:path*', destination: `${apiUrl}/api/subscribe/:path*` },
      { source: '/api/messages/:path*', destination: `${apiUrl}/api/messages/:path*` },
      { source: '/api/auth/:path*', destination: `${apiUrl}/api/auth/:path*` },
    ];
  },

  // Redirects (if needed)
  async redirects() {
    return [
      // Add any permanent redirects here
      // Example:
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true,
      // },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Production optimizations
    if (isProduction) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable if you want to use server components more extensively
    // serverActions: true,
  },
};

module.exports = nextConfig;

