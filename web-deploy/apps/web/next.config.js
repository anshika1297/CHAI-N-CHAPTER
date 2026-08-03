/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true'

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  ...(isStaticExport ? { output: 'export' } : {}),

  images: {
    ...(isStaticExport ? { unoptimized: true } : {}),
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'chaptersaurchai.com' },
      { protocol: 'https', hostname: 'www.chaptersaurchai.com' },
    ],
  },
}

// Proxy /api and /health to the local API in dev when the browser uses same-origin /api (NEXT_PUBLIC_API_URL unset).
// Production builds with NEXT_PUBLIC_API_URL set hit the public API directly from the client; rewrites still help SSR/local.
if (!isStaticExport) {
  nextConfig.rewrites = async () => {
    const normalize = (raw) => {
      if (!raw || typeof raw !== 'string') return ''
      let u = raw.trim().replace(/\/+$/, '')
      if (u.endsWith('/api')) u = u.slice(0, -4)
      return u
    }
    const fromEnv = normalize(process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL)
    const apiTarget = fromEnv || 'http://127.0.0.1:5001'
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
      { source: '/health', destination: `${apiTarget}/health` },
    ]
  }
}

module.exports = nextConfig
