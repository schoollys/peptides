const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // OpenTimestamps pulls in a heavy CommonJS dependency tree (request/bitcore);
  // keep it out of the bundle and require it at runtime from node_modules.
  serverExternalPackages: ['opentimestamps'],
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      // Security headers on everything except the embeddable badge (served
      // cross-origin as <img>; must stay framing-agnostic and cacheable).
      { source: '/((?!badge/).*)', headers: securityHeaders },
    ]
  },
}

export default nextConfig
