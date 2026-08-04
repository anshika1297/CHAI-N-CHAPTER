/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true'

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  ...(isStaticExport ? { output: 'export' } : {}),

  /** Polling avoids macOS EMFILE watcher failures that can leave dev returning 404 for every route. */
  webpack: (config, { dev }) => {
    if (dev && process.env.WATCHPACK_POLLING === 'true') {
      config.watchOptions = {
        poll: 1500,
        aggregateTimeout: 500,
        ignored: ['**/node_modules/**', '**/.git/**'],
      }
    }
    return config
  },

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
    const fromInternal = normalize(process.env.API_INTERNAL_URL)
    const fromPublic = normalize(process.env.NEXT_PUBLIC_API_URL)
    // Never rewrite local Next /api to the live site — that returns Apache 500s on OPTIONS ("Failed to fetch").
    const isRemotePublic =
      fromPublic &&
      !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fromPublic)
    const apiTarget =
      fromInternal ||
      (!isRemotePublic && fromPublic) ||
      (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:5002' : 'http://127.0.0.1:5001')
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
      { source: '/health', destination: `${apiTarget}/health` },
    ]
  }
}

module.exports = nextConfig
