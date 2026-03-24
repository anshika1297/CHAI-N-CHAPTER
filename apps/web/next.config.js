/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: can be hosted on Nginx/S3/Netlify etc (no Node server needed).
  // Note: Next.js rewrites are not available in `output: 'export'`, so the frontend
  // must call the API using absolute URLs (NEXT_PUBLIC_API_URL).
  output: 'export',
  images: { unoptimized: true },
}

module.exports = nextConfig
